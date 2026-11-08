# <img src="logo.png" width="48" height="48" style="vertical-align: middle;" alt="Oddly Logo" /> Oddly — Daily Games Hub & Backends

Welcome to **Oddly** (formerly Grudge) — daily games that keep you guessing. Single-player, one-shot daily puzzles served on **GitHub Pages**, backed by automated GitHub Actions and Cloudflare Workers + D1 databases.

Target Repository: `https://github.com/Hootsworth/Grudge.git`  
GitHub Pages: `https://hootsworth.github.io/Grudge/`

---

## 🎮 Playable Games

| Game | Type | URL | Backend Engine |
| :--- | :--- | :--- | :--- |
| **Fibber** | News / Fake Headlines | [`fibber.html`](fibber.html) | Python 3.11 + GitHub Actions daily cron (`0 3 * * *`) |
| **Strata** | Historical Timeline Sorting | [`strata.html`](strata.html) | Cloudflare Workers + D1 (SQLite) + TypeScript |
| **Kin** | Evolutionary Kinship | [`kin.html`](kin.html) | Cloudflare Workers + D1 + TimeTree & OpenTree data |
| **Admin Studio** | Game Manager & AI Generator | [`admin.html`](admin.html) | Client-side studio + GitHub REST API integration |

> All games are 100% playable out-of-the-box as static client applications on **GitHub Pages**, with seamless optional connectivity to Cloudflare Worker APIs (`/api/today`, `/api/guess`, `/api/answer`).

---

## 🛠️ Admin Studio & AI Game Generator (`admin.html`)

Access the Admin Studio directly at [`admin.html`](admin.html) (or via the footer link on the home page).

### Features:
1. **Games Manifest Manager**:
   - Manage all live and in-lab games (Fibber, Strata, Kin, Petty, Wordy Golf, etc.).
   - Toggle status between `Live` and `In Lab` with 1 click.
   - Built-in **Playtest Simulator** to test games right inside an admin iframe.
2. **Add New Games**:
   - Register games with custom slugs, colors, spiteful descriptions, and card art styles.
   - Real-time card preview matches the exact Grudge frontpage layout.
3. **🤖 AI Game Studio**:
   - Generate complete AI prompts & specifications to feed to Claude, Gemini, or Antigravity to build new daily games.
   - Generate standalone, production-ready frontend HTML templates (`[slug].html`) with Grudge styling, daily calendar math, and shareable scoreboards.
4. **Daily Content & Backlog Manager**:
   - Inspect, edit, and validate daily puzzle JSON (`today.json`).
   - Quick-switch between emergency pre-approved backlog puzzles.
5. **Zero-Terminal GitHub Sync**:
   - Optional Personal Access Token (PAT) integration to commit updated `games.json` directly to the `main` branch from the browser, triggering automatic GitHub Pages re-deployment.

---

## 🚀 GitHub Pages Deployment

The repository is configured for automated, zero-config deployment to **GitHub Pages** using GitHub Actions.

### 1. Enable GitHub Pages in Repository Settings
1. Go to your repository on GitHub: `https://github.com/Hootsworth/Grudge`
2. Navigate to **Settings** > **Pages**
3. Under **Build and deployment** > **Source**, select:  
   👉 **GitHub Actions**
4. Push any commit to `main` (or run the `Deploy Grudge Hub to GitHub Pages` workflow under the **Actions** tab).

### 2. Automated Workflows (`.github/workflows/`)
- [`.github/workflows/pages.yml`](.github/workflows/pages.yml): Packages and publishes the site to GitHub Pages whenever HTML, CSS, or JSON files change on `main`, or on workflow dispatch.
- [`.github/workflows/daily.yml`](.github/workflows/daily.yml): Automated daily generator for **Fibber** (03:00 UTC). Collects strange news, generates fakes, verifies them against web search, opens a GitHub Issue review gate, and triggers emergency fallback to pre-approved backlog at 06:00 UTC if unapproved.
- [`.github/workflows/ci.yml`](.github/workflows/ci.yml): Runs the full test suite (Fibber 24 unit tests, Strata 18 tests, Kin 13 tests) on all PRs and pushes.
- [`.github/workflows/deploy-workers.yml`](.github/workflows/deploy-workers.yml): Optional auto-deployment for Cloudflare Workers if `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets are added.

### 3. GitHub Secrets Configuration (Optional)
Under **Settings** > **Secrets and variables** > **Actions**:

| Secret Name | Purpose | Required For |
| :--- | :--- | :--- |
| `ANTHROPIC_API_KEY` | Daily LLM puzzle generation & verification | Fibber & Strata cron |
| `SEARCH_API_KEY` | Tavily or Brave web search verification | Fibber fake headline verification |
| `SEARCH_PROVIDER` | `tavily` or `brave` (default: `tavily`) | Fibber |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Worker deployment token | Strata & Kin Workers |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID | Strata & Kin Workers |

---

## 🧪 Testing Everything Locally

To verify all 55 tests across the three games:
```bash
npm run test:all
```
This executes:
1. **Strata Unit Tests**: 18 tests (Lock logic, speed anti-abuse, spread difficulty rotation, leak detection).
2. **Kin Unit Tests**: 13 tests (Topology gap filtering, CI overlap rejection, no-reuse window, fact validation).
3. **Fibber Unit Tests**: 24 tests (Collection, deduplication, JSON schema validation, fallback rotation).

---

## 📦 Pushing to GitHub

To push this entire repository to `https://github.com/Hootsworth/Grudge.git`:

```bash
git remote set-url origin https://github.com/Hootsworth/Grudge.git
# or if not set yet:
# git remote add origin https://github.com/Hootsworth/Grudge.git

git add .
git commit -m "feat: complete Grudge daily game hub with GitHub Pages & Actions"
git push -u origin main
```

---

# 🧬 Kin — Daily Evolutionary Kinship Backend

**Kin** is a game where players see 3 organisms and must identify the two most closely related across 5 daily rounds. Each puzzle is **correct by construction** using real divergence times from **TimeTree** and **Open Tree of Life**.

- **Full Documentation**: See [`kin/README.md`](./kin/README.md)
- **Data Prep & Refresh**: `python3 data/prep_data.py --outdir=data`
- **Unit Tests**: `npm run test:kin`
- **Seed Mode**: `npm run seed:kin -- --sessions=50`

---

# ⏳ Strata — Daily Backend Pipeline

**Strata** is a daily timeline game where players drag 6 historical events into chronological order (**newest on the surface / top, oldest on the bedrock / bottom**) in at most 4 attempts.
After each attempt, correctly placed events lock into position. Everyone plays the exact same daily puzzle.

- **Stack**: Cloudflare Workers + D1 (SQLite) + Cron Triggers, written in strict TypeScript.
- **Client Auth**: Anonymous session UUID generated client-side (no accounts, no tracking).
- **Frontend**: Static single-page application (`Strata — daily timeline game.html`).

---

## 📡 API Specification

### 1. `GET /api/today`
Returns today's active puzzle with events in a **seeded shuffled order**.
> 🔒 **Security Guarantee**: This endpoint NEVER sends years, dates, or the correct chronological order to the client.

**Response `(200 OK)`**:
```json
{
  "date": "2026-11-08",
  "plate": "Silicon & Microchips",
  "events": [
    { "id": "ev-4004", "text": "Intel releases the commercial 4004 microprocessor" },
    { "id": "ev-arpa", "text": "First message transmitted over ARPANET network" },
    { "id": "ev-trans", "text": "Bell Labs engineers invent the point-contact transistor" },
    { "id": "ev-lamp", "text": "Edison demonstrates commercial incandescent electric lamp" },
    { "id": "ev-web", "text": "Tim Berners-Lee publishes proposal for the World Wide Web" },
    { "id": "ev-fly", "text": "Wright brothers conduct sustained powered airplane flight" }
  ]
}
```

---

### 2. `POST /api/guess`
Submit a player's ordered guess from top (newest) to bottom (oldest).

**Request Body**:
```json
{
  "session": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "order": ["ev-web", "ev-4004", "ev-arpa", "ev-trans", "ev-fly", "ev-lamp"]
}
```

**Rejections & Anti-Abuse (400 / 429)**:
- **Moved Locked Event**: If an event was locked at position $k$ in a prior attempt, moving it to any other position is rejected (`HTTP 400: "Locked event '...' at position X was moved"`).
- **Attempt Limit**: Exceeding 4 attempts or submitting after solving is rejected (`HTTP 400`).
- **Malformed Order**: Submitting anything other than 6 unique valid event IDs is rejected (`HTTP 400`).
- **Speed Anti-Abuse**: Guesses arriving in $< 1.0$s from the previous guess or session start are rejected (`HTTP 429: "Guesses arriving faster than humanly possible"`).

**Response (Ongoing Guess) `(200 OK)`**:
```json
{
  "correct": [true, false, false, true, true, true],
  "solved": false,
  "attemptsUsed": 1,
  "locked": ["ev-web", "ev-trans", "ev-fly", "ev-lamp"]
}
```

**Response (On Solving or Final 4th Attempt) `(200 OK)`**:
Returns the full historical reveal in chronological order:
```json
{
  "correct": [true, true, true, true, true, true],
  "solved": true,
  "attemptsUsed": 2,
  "locked": ["ev-web", "ev-4004", "ev-arpa", "ev-trans", "ev-fly", "ev-lamp"],
  "reveal": [
    { "id": "ev-web", "year": 1989, "display": "1989", "source": "https://en.wikipedia.org/wiki/World_Wide_Web" },
    { "id": "ev-4004", "year": 1971, "display": "1971", "source": "https://en.wikipedia.org/wiki/Intel_4004" },
    { "id": "ev-arpa", "year": 1969, "display": "1969", "source": "https://en.wikipedia.org/wiki/ARPANET" },
    { "id": "ev-trans", "year": 1947, "display": "1947", "source": "https://en.wikipedia.org/wiki/Transistor" },
    { "id": "ev-fly", "year": 1903, "display": "1903", "source": "https://en.wikipedia.org/wiki/Wright_brothers" },
    { "id": "ev-lamp", "year": 1879, "display": "1879", "source": "https://en.wikipedia.org/wiki/Incandescent_light_bulb" }
  ]
}
```

---

### 3. `POST /api/finish`
Finish session and calculate score percentile.

**Request Body**:
```json
{
  "session": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

**Response `(200 OK)`**:
```json
{
  "attempts": 2,
  "percentile": 85.5,
  "avgAttempts": 2.45
}
```
*Note: `attempts` is `null` if the player did not solve the puzzle within 4 attempts.*

---

### 4. `GET /api/stats/yesterday`
Retrieve aggregate community statistics for yesterday's puzzle.

**Response `(200 OK)`**:
```json
{
  "date": "2026-11-07",
  "solveRate": 0.724,
  "avgAttempts": 2.65,
  "hardestPair": {
    "eventA": "Bell Labs engineers invent the point-contact transistor",
    "eventB": "First message transmitted over ARPANET network",
    "swaps": 48
  }
}
```

---

## ⚙️ Cron Triggers & Review Gate

Strata uses two scheduled Cloudflare Cron Triggers configured in [`wrangler.toml`](file:///Users/adityadixit/Documents/antigravity/radiant-raman/wrangler.toml):

1. **`05:00 UTC` — Puzzle Generation & Independent Verification**:
   - Queries D1 history to ensure **no event from the past 120 days is reused**.
   - Determines daily rotation:
     - **7 Themes**: `science`, `exploration`, `culture`, `technology`, `sport`, `politics`, `ancient world`.
     - **3 Spreads**: `century` (hard, $\le 100$ yrs), `era` (medium, 200–800 yrs), `millennia` (easy, $> 1000$ yrs).
   - Generates 6 verified events via Anthropic (`claude-sonnet-4-6`).
   - Runs a **Verification Pass**: A second model call independently dates the events. The puzzle is rejected if any estimate deviates beyond precision tolerance ($\le 2$ years for exact, $\le 30$ years for approximate).
   - Inserts puzzle into D1 as `status = 'pending'` and sends a preview webhook.

2. **`06:00 UTC` — Auto-Publish & Backlog Fallback**:
   - Checks if the pending puzzle was vetoed via `POST /api/admin/veto`.
   - If not vetoed: auto-publishes the pending puzzle.
   - If vetoed or generation failed: deploys a pre-approved puzzle from the 14-day backlog in [`backlog/strata/`](file:///Users/adityadixit/Documents/antigravity/radiant-raman/backlog/strata).
   - Compiles yesterday's aggregate solve rates and hardest event pair.

---

## 🧪 Local Testing & Seed Mode

### 1. Run Unit Tests
Covers lock logic, locked movement rejection, factual verification tolerance, and spread rotation:
```bash
npm test
# Or natively with Node 26:
node --experimental-strip-types --test tests/strata/*.test.ts
```

### 2. Generate Seed Data (`--seed` mode)
Simulates realistic community player sessions (70% win distribution, simulated inversions, and lock steps):
```bash
# Generate 50 simulated player sessions to seed.sql
npm run seed -- --sessions=50 --date=2026-11-08
```

### 3. Run Locally with Wrangler
```bash
# Apply database schema to local D1
npx wrangler d1 migrations apply strata-db --local

# Apply seeded test data
npx wrangler d1 execute strata-db --local --file=seed.sql

# Start local worker
npx wrangler dev
```

---

## 🚢 Deployment to Cloudflare Workers

1. **Create D1 Database**:
   ```bash
   npx wrangler d1 create strata-db
   ```
   *Copy the output `database_id` into [`wrangler.toml`](file:///Users/adityadixit/Documents/antigravity/radiant-raman/wrangler.toml).*

2. **Apply Remote Migrations**:
   ```bash
   npx wrangler d1 migrations apply strata-db --remote
   ```

3. **Set Cloudflare Secrets**:
   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler secret put PREVIEW_WEBHOOK_URL
   npx wrangler secret put VETO_SECRET
   ```

4. **Deploy**:
   ```bash
   npx wrangler deploy
   ```

---

# 🤥 Fibber — Daily Backend Pipeline

The daily backend for **Fibber**, running as a Python 3.11 batch pipeline that writes `/public/today.json` for GitHub Pages.

```bash
# Run unit tests
python3 -m unittest discover tests

# Dry-run pipeline with fixtures (no API keys required)
python3 -m fibber.main --dry-run

# Approve and publish
python3 -m fibber.main --approve
```
