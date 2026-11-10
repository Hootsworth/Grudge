# Quipher Backend

Daily cryptogram backend built on **Cloudflare Workers**, **D1 (SQLite)**, and **Cron Triggers** in TypeScript.

Players decrypt a famous historical or literary quote encrypted with a substitution cipher (derangement: no letter maps to itself). All players worldwide receive the same quote and cipher each day.

---

## Critical Security Rule

> **The client never receives the plaintext, the cipher key, the author, or the source.**
> The server serves only the ciphertext and letter count. All validation, cross-checking, hints, timing, and revelations occur authoritatively on the server.

---

## Architecture & Data Flow

- **Runtime**: Cloudflare Workers with TypeScript.
- **Storage (D1)**:
  - `quotes`: Daily puzzles, plates, ciphertexts, cipher keys (derangements), entropies, and difficulty tiers.
  - `sessions`: Anonymous session UUIDs, server start time, check counts, hint counts, solve seconds, penalty scores, and status (`in_progress`, `solved`, `flagged`).
  - `events`: Audit log of checks, hints, and solve attempts.
  - `daily_stats`: Aggregated yesterday metrics (median solve time, solve rate, most-used hint letter).
  - `ip_rate_limits`: Anti-abuse sliding minute windows.
- **Cron Generation (04:00 UTC)**:
  - Evaluates candidates against strict public domain guidelines (US pre-1930 / year $\le$ 1929).
  - Attribution check: rejects famous apocryphal misattributions (e.g. Einstein "definition of insanity", Wilde "Be yourself", modern quotes).
  - Shannon entropy & letter distribution analysis (difficulty rises toward the weekend).
  - Requires $\ge 14$ distinct letters for solvability.
  - Human review: sends an email preview with verified Gutenberg excerpts for approval before 05:30 UTC. If unapproved, safely falls back to `/backlog` (14 days filled).

---

## API Endpoints

### 1. `GET /api/today`
Returns the daily ciphertext without leaking plaintext or key.
- **Query Params**: `?date=YYYY-MM-DD` (optional), `?session=UUID` (optional, starts session clock)
- **Response**:
```json
{
  "plate": 2,
  "ciphertext": "BLW IEE, ZWD BLW VW GBA VZIEHRE. ALE VIOAEGRAVEG IO RMAHP.",
  "letterCount": 44
}
```

### 2. `POST /api/check`
Submits player's current mapping to check for errors.
- **Rate Limit**: At most 1 check per 3 seconds.
- **Request**:
```json
{
  "session": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "mapping": { "B": "Y", "L": "O", "W": "U" },
  "date": "2026-11-10"
}
```
- **Response**:
```json
{
  "wrong": ["L"],
  "solved": false,
  "checks": 1
}
```

### 3. `POST /api/hint`
Reveals the most frequent cipher letter in the ciphertext that is not yet correctly assigned.
- **Request**:
```json
{
  "session": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "mapping": { "B": "Y" },
  "date": "2026-11-10"
}
```
- **Response**:
```json
{
  "cipherLetter": "E",
  "plainLetter": "E",
  "hints": 1
}
```

### 4. `POST /api/solve`
Verifies full decryption and records official solve time.
- **Request**:
```json
{
  "session": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "mapping": { ...complete mapping... },
  "date": "2026-11-10"
}
```
- **Response (upon successful solve)**:
```json
{
  "solved": true,
  "plaintext": "You see, but you do not observe. The distinction is clear.",
  "author": "Arthur Conan Doyle",
  "source": "A Scandal in Bohemia",
  "year": 1891,
  "solveSeconds": 92,
  "checks": 2,
  "hints": 1,
  "score": 177,
  "percentile": 84,
  "rank": "Cryptanalyst"
}
```

### 5. `GET /api/stats/yesterday`
Returns community stats from yesterday's intercept.
- **Response**:
```json
{
  "date": "2026-11-09",
  "medianSolveTime": 145,
  "solveRate": 88.5,
  "mostUsedHintLetter": "E",
  "totalSolves": 142
}
```

---

## Scoring & Ranks

$$\text{Score (penalty-adjusted seconds)} = \text{solveSeconds} + (20 \times \text{checks}) + (45 \times \text{hints})$$

- **Under 120s**: `Codebreaker`
- **Under 240s**: `Cryptanalyst`
- **Under 420s**: `Bletchley intern`
- **420s or above**: `Rot13 enjoyer`

---

## Anti-Abuse Protections

1. **Human Cognition Threshold**: Solves completed under 15 seconds are flagged as automated scripts and excluded from leaderboards.
2. **Brute-Force Pattern Detection**: Submissions rapidly cycling single letters are flagged.
3. **Interval Throttling**: Checks are limited to 1 call per 3 seconds per session.
4. **IP Rate Limiting**: 120 requests/minute sliding window.

---

## Local Development & Testing

```bash
# Run test suite (derangements, round-trips, attribution rejection, hints, scoring, routes)
npm test

# Run seed simulation (generates fake players and medians)
npm run seed -- --date=2026-11-10

# Start local worker
npm run dev

# Deploy to Cloudflare Workers
npm run deploy
```
