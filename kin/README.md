# 🧬 Kin — Daily Evolutionary Kinship Backend

The daily backend for **Kin**, a game where players see 3 organisms and must identify the two most closely related across 5 daily rounds.

Each puzzle is **correct by construction** using real pairwise divergence-time data from **TimeTree** and **Open Tree of Life**, strictly avoiding reliance on LLM memory.

- **Stack**: Cloudflare Workers + Cloudflare D1 (SQLite) + Cron Triggers (TypeScript).
- **Data Prep**: Python 3.9+ offline pipeline for taxon curation and TimeTree / OpenTree divergence caching.
- **Client Auth**: Anonymous session UUID from the client (no accounts, no tracking).
- **Frontend**: Static single-page application (`Kin — daily odd relatives game.html`).

---

## 📡 API Specification

### 1. `GET /api/today`
Returns today's active puzzle with 5 rounds. Each round provides 3 organisms in a seeded shuffled order.
> 🔒 **Security Guarantee**: This endpoint NEVER reveals the true closest pair or divergence times.

**Response `(200 OK)`**:
```json
{
  "date": "2026-11-08",
  "plate": "Deep Time Decoded #01",
  "rounds": [
    {
      "id": "kin-puzzle-2026-11-08-r1",
      "roundNumber": 1,
      "organisms": [
        { "id": "org_manatee", "name": "Manatee", "latin": "Trichechus manatus" },
        { "id": "org_elephant", "name": "Elephant", "latin": "Loxodonta africana" },
        { "id": "org_rhino", "name": "Rhino", "latin": "Diceros bicornis" }
      ]
    },
    ... (5 rounds total)
  ]
}
```

---

### 2. `POST /api/answer`
Submit a player's answer for a specific round.
- **Idempotent**: Resubmitting the same round for a session returns the recorded result without duplicate scoring.
- **Enforces Sequence**: Rounds must be answered in strict chronological order ($1 \to 2 \to 3 \to 4 \to 5$).
- **Anti-Abuse**: Guesses arriving faster than human deliberation ($< 1000$ms) are rejected (`HTTP 429`).

**Request Body**:
```json
{
  "session": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "roundId": "kin-puzzle-2026-11-08-r1",
  "pair": ["org_elephant", "org_manatee"]
}
```

**Response `(200 OK)`**:
```json
{
  "correct": true,
  "pair": ["org_elephant", "org_manatee"],
  "outgroup": "org_rhino",
  "t1": 65,
  "t2": 100,
  "t1Display": "about 65 million years ago",
  "t2Display": "about 100 million years ago",
  "ci1": [58, 72],
  "ci2": [94, 108],
  "fact": "Elephants and manatees are Afrotherians, while rhinos belong to the distantly related Perissodactyla.",
  "source": "https://timetree.org"
}
```

*Time rounding rules: Times under 500 Mya are rounded to the nearest 5 Mya; times 500 Mya and above are rounded to the nearest 50 Mya.*

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
  "totalMya": 2430,
  "deepestMya": 1550,
  "rank": "Precambrian prophet",
  "percentile": 88.5
}
```

#### Rank Thresholds:
| Deepest Resolved Split ($t_2$) | Earned Rank Title |
|---|---|
| 0 correct answers | **Still in the soup** |
| $< 100$ Mya | **Cenozoic tourist** |
| $100$ to $< 252$ Mya | **Mesozoic tracker** |
| $252$ to $< 541$ Mya | **Paleozoic sleuth** |
| $541$ to $< 1000$ Mya | **Ediacaran detective** |
| $\ge 1000$ Mya | **Precambrian prophet** |

---

### 4. `GET /api/stats/yesterday`
Retrieve community statistics for yesterday's puzzle.

**Response `(200 OK)`**:
```json
{
  "date": "2026-11-07",
  "solveRatePerRound": [0.85, 0.76, 0.64, 0.58, 0.32],
  "mostCommonWrongPairing": {
    "roundIndex": 5,
    "pairNames": ["Human", "Oak"],
    "count": 38
  }
}
```

---

## 🔬 Scientific Triplet Selection Engine

Each day at **05:00 UTC**, the selection engine picks 5 triplets $\{A, B, C\}$ where $((A, B), C)$ is the true evolutionary topology:
1. **Topology Gap Rule**: $(t_2 - t_1) \ge 0.08 \times t_2$ (at least 8% separation).
2. **Confidence Interval Rule**: $CI_1.\text{high} < CI_2.\text{low}$ (strictly non-overlapping confidence intervals).
3. **Contested Taxa Filter**: Rejects disputed clades (bats, ctenophores vs sponges, unresolved bird lineages).
4. **Counterintuitive Scoring**: Evaluates morphological and category similarity so outgroup $C$ appears more visually similar to $A$ or $B$ than the true kin pair appear to each other.
5. **Depth Spread**: Every day must include at least one round under 100 Mya and one over 500 Mya.
6. **No-Reuse Windows**:
   - Organisms cannot be reused within **30 days**.
   - Triplets cannot be reused within **365 days**.
7. **Fact-Number Validation**: The generated explanation from Anthropic (`claude-haiku-4-5`) is validated so that it contains **no numbers or dates that are not in the verified dataset**.
8. **Review Gate**: Saved to D1 as `pending` and preview webhook sent. Auto-publishes at **06:00 UTC** unless vetoed, falling back to a pre-approved 14-day backlog in [`src/backlog/puzzles.ts`](file:///Users/adityadixit/Documents/antigravity/radiant-raman/kin/src/backlog/puzzles.ts).

---

## 🛠️ Data Refresh & Local Testing

### 1. Offline Data Preparation (Monthly Refresh)
```bash
python3 data/prep_data.py --outdir=data
```
Generates:
- `data/organisms.json` (~400 curated familiar organisms).
- `data/divergences.json` (verified TimeTree & Open Tree divergence records).
- `data/seed.sql` (SQLite statements to populate D1).

### 2. Run Unit Tests
```bash
npm test
# Or with native Node 26:
node --experimental-strip-types --test tests/*.test.ts
```
Covers:
- Topology gap filtering ($\ge 8\%$).
- Confidence interval overlap rejection ($CI_1.\text{high} < CI_2.\text{low}$).
- 30-day organism and 365-day triplet reuse windows.
- Fact-number validation.
- Deep-time rank thresholds.

### 3. Generate Seed Data (`--seed` mode)
```bash
# Generate 50 simulated player sessions to seed.sql
npm run seed -- --sessions=50 --date=2026-11-08
```

### 4. Run Locally with Cloudflare Wrangler
```bash
# Apply schema to local D1
npx wrangler d1 migrations apply kin-db --local

# Apply organisms and divergence data
npx wrangler d1 execute kin-db --local --file=data/seed.sql

# Apply seeded player sessions
npx wrangler d1 execute kin-db --local --file=seed.sql

# Start local worker
npx wrangler dev
```

---

## 🚢 Cloudflare Deployment

1. **Create D1 Database**:
   ```bash
   npx wrangler d1 create kin-db
   ```
2. **Apply Migrations and Seed**:
   ```bash
   npx wrangler d1 migrations apply kin-db --remote
   npx wrangler d1 execute kin-db --remote --file=data/seed.sql
   ```
3. **Set Secrets**:
   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler secret put PREVIEW_WEBHOOK_URL
   npx wrangler secret put VETO_SECRET
   ```
4. **Deploy**:
   ```bash
   npx wrangler deploy
   ```
