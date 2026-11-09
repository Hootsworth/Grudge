# Pinpoint Backend

> Daily geography mystery spot game powered by Cloudflare Workers, D1 (SQLite), KV (SVG window store), and a nightly Node.js geometry generation pipeline.

---

## 1. Overview & Critical Security Rule

In Pinpoint, players are presented with 5 daily mystery spots. For each spot, they view a small **unlabeled window** of a real map (coastlines, country boundaries, islands) and drop a pin on a global map. Players can zoom out up to two times (at a 15% score penalty per zoom-out).

### Critical Security Rule
**The server NEVER sends true coordinates, window centers, bounding boxes, or any absolute latitude/longitude to the client before a guess is submitted.**

- The server pre-renders each mystery window itself using Web Mercator projection.
- Mystery windows are delivered as self-contained SVG paths in **local coordinates** (origin strictly at `(0, 0)`), plus a `kmPerUnit` scale for the scale bar.
- There are **no country names**, **no geographic identifiers**, and **no absolute coordinates** in the mystery view payload.
- Path element ordering is randomized per session so two players never receive byte-identical payloads.
- The client cannot recover the location through DOM inspection or reverse calculation; solving requires recognizing coastal and continental shapes.

---

## 2. Frontend Contract

### Mystery View
- The mystery window container (`.mv`) receives `{ viewBox, kmPerUnit, shapes: [{ d, cls }] }` from `POST /api/round/start` or `POST /api/round/zoomout`.
- The client renders the returned SVG shapes directly into its local SVG element:
  ```html
  <svg viewBox="${window.viewBox}" preserveAspectRatio="xMidYMid slice">
    <rect x="-50" y="-50" width="1000" height="1000" class="oc"/>
    ${window.shapes.map(s => `<path class="${s.cls}" d="${s.d}"/>`).join('')}
  </svg>
  ```
- The scale bar uses `window.kmPerUnit`:
  - 100 km on the scale bar = `100 / window.kmPerUnit` SVG viewBox units.
- Zoom-out requests call `POST /api/round/zoomout { session, round, aspect }`. The server tracks hints used (0, 1, or 2) and returns the corresponding wider window (level 1 = 22°, level 2 = 55°).

### Guess Map
- The guess map (`.mw`) keeps its own world map for pin dropping.
- When the player locks in a guess, the client sends `{ session, round, lat, lon }` to `POST /api/round/guess`.
- Only **after** the guess is submitted does the server return:
  `{ distanceKm, points, hintsUsed, trueLat, trueLon, name, fact, sourceUrl }`.

---

## 3. Architecture & Tech Stack

- **Serving Layer (`worker/`)**:
  - Cloudflare Worker in TypeScript.
  - **D1 Database**: Stores `puzzles`, `rounds`, `sessions`, `guesses`, `daily_stats`, and `ip_rate_limits`.
  - **KV Namespace**: Stores pre-rendered local SVG mystery windows under keys:
    `puzzle/{date}/{round}/{level}/{aspect}`
    - Levels: `0` (9° wide), `1` (22° wide), `2` (55° wide)
    - Aspects: `4:3`, `16:9`, `3:4`
- **Nightly Generation Pipeline (`generator/`)**:
  - Runs in Node.js 22 (via GitHub Actions cron `03:00 UTC`).
  - Natural Earth 50m data loaded from `world-atlas` (`countries-50m.json`, `land-50m.json`).
  - Web Mercator projection:
    $$x = (\text{lon} + 180) \times 10$$
    $$y = 1525 - 572.9578 \times \ln(\tan(\pi/4 + \text{lat}/2))$$
  - Filters out Antarctica.
  - Sutherland-Hodgman clipping clips geometry to window bounding boxes.
  - Welsh-Powell greedy 6-coloring (`c0` through `c5`) ensures no adjacent countries share the same color.
  - Generates 1-sentence verified facts via Anthropic API (`claude-sonnet-4-6`) with web citation sources.
  - Sends a preview review email before `05:30 UTC`. If not approved, falls back to pre-approved backlog puzzles.

---

## 4. API Specification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/today` | Returns `{ plate, rounds: 5 }`. Zero location leaks. |
| `POST` | `/api/round/start` | `{ session, round, aspect }` $\rightarrow$ `{ window: level0Window }`. Validates round order and starts timer. |
| `POST` | `/api/round/zoomout` | `{ session, round, aspect }` $\rightarrow$ `{ window, hintsUsed }`. Max 2 zoom-outs per round (15% score penalty each). |
| `POST` | `/api/round/guess` | `{ session, round, lat, lon }` $\rightarrow$ `{ distanceKm, points, hintsUsed, trueLat, trueLon, name, fact, sourceUrl }`. Enforces $\ge 1.5$s anti-bot delay. |
| `POST` | `/api/finish` | `{ session }` $\rightarrow$ `{ total, perRound, rank, percentile }`. Validates all 5 rounds completed. |
| `GET` | `/api/stats/yesterday` | Returns median scores per spot, hardest spot, and average distance. |
| `POST` | `/api/admin/publish` | Ingests puzzle, rounds, and KV window renderings. Authenticated via `x-admin-key`. |
| `POST` | `/api/admin/approve` | One-click email approval link for nightly puzzle candidates. |

### Scoring & Rank Calculation
$$\text{points} = \text{round}\left(5000 \times \exp\left(-\frac{\max(0, d - 30)}{800}\right) \times (1 - 0.15 \times \text{hintsUsed})\right)$$
where $d$ is the Haversine distance in kilometers.

**Rank Titles**:
- $< 5,000$: Lost at sea
- $< 10,000$: Deckhand
- $< 15,000$: First mate
- $< 20,000$: Navigator
- $\ge 20,000$: Master cartographer

---

## 5. Local Setup & Testing

### Installation
```bash
cd pinpoint
npm install
```

### Running Tests
All 38 test suites covering Haversine distance, scoring, greedy map coloring, distinctiveness filters, round sequencing, hint tracking, and anti-abuse:
```bash
npm test
```

### Seed Mode (`--seed`)
Pre-renders 14 days of vetted, verified fixtures covering all 6 continents:
```bash
npm run seed
# Output written to: backlog/fixtures.json and backlog/rendered/{date}.json
```

---

## 6. Nightly Review & Approval Flow

1. **Nightly Run (03:00 UTC)**: GitHub Actions workflow `.github/workflows/pinpoint-daily.yml` triggers `generator/generate.ts`.
2. **Distinctiveness & Diversity Checks**: Candidate spots are filtered for 25%–75% land fraction, coastline transition complexity, global descriptor uniqueness (>700 km), and 4+ continent diversity.
3. **Fact Generation**: Anthropic API drafts 1-sentence facts with no unverifiable numbers and verifies citation URLs.
4. **Email Preview**: Sends an HTML email with rendered previews and a one-click approval link:
   `${WORKER_URL}/api/admin/approve?date=YYYY-MM-DD&token=${APPROVAL_SECRET}`
5. **Deadline (05:30 UTC)**: If the email link is clicked, the puzzle status is marked `live`. If not approved before 05:30 UTC, the server falls back to pre-approved puzzles from `/backlog`.
