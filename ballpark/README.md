# Ballpark — Backend & Daily Pipeline

A daily Fermi estimation game built on **Cloudflare Workers**, **D1** (SQLite), and **Cron Triggers** in TypeScript. Players estimate 5 massive or microscopic real-world quantities on a logarithmic slider ($10^0$ to $10^{24}$) and are scored on how many orders of magnitude they are off.

---

## 1. Game Mechanics & Scoring

### Question Shape
```typescript
interface Question {
  id: string;               // e.g., "q_20261109_1"
  date: string;             // "YYYY-MM-DD"
  question: string;         // "How many times does an average human heart beat across an 80-year lifespan?"
  unit: string;             // "heartbeats"
  value: number;            // 2.94e9
  valueLog10: number;       // 9.468
  explanation: string;      // 1-2 sentence walkthrough without invented numbers
  sources: [string, string];// At least two independent, verified source URLs
  category: string;         // biology, astronomy, history, technology, everyday life, food, geography
  difficulty: number;       // 1 - 5
  fermiDerivation?: string; // Back-of-envelope formula check
}
```

### Scale Spread Rules (Daily 5 Questions)
1. **Spread the Scale**: Each day's 5 answers must cover at least 4 distinct orders of magnitude ($\lfloor \log_{10}(\text{value}) \rfloor$).
2. **Boundary Anchors**:
   - At least one answer under $10^4$ ($< 10,000$).
   - At least one answer above $10^{15}$ ($> 1,000,000,000,000,000$).
3. **Category Diversity**: Mix of at least 4 distinct categories among the 5 questions.
4. **No-Reuse Window**: Quantities are never reused within 120 days.
5. **No-Gotcha Policy**: Quantities are stable, dated when appropriate ("as of 2024"), and clearly defined.

### Scoring Formula
$$\text{errorOrders} = |\text{exponent} - \text{truthLog10}|$$
$$\text{points} = \text{round}\left(1000 \times \max\left(0, 1 - \frac{\text{errorOrders}}{2.5}\right)\right)$$

- **Exact guess** ($\text{error} = 0$) &rarr; $1,000$ points
- **1 order of magnitude off** ($\text{error} = 1.0$, $10\times$) &rarr; $600$ points
- **2 orders of magnitude off** ($\text{error} = 2.0$, $100\times$) &rarr; $200$ points
- **$\ge 2.5$ orders of magnitude off** &rarr; $0$ points
- **Daily Total**: Up to $5,000$ points across 5 questions.

### Rank Classification (by Cumulative Total Error in Orders)
| Total Error in Orders | Rank Title |
| :--- | :--- |
| $< 0.5$ orders | **Human calculator** |
| $< 1.5$ orders | **Fermi's apprentice** |
| $< 3.0$ orders | **Napkin mathematician** |
| $< 6.0$ orders | **Vibes-based estimator** |
| $\ge 6.0$ orders | **Order of magnitude? Never heard of her.** |

---

## 2. Critical Security & Anti-Abuse Rules

1. **Never Send Truth Early**: The server **never** returns `value`, `valueLog10`, `explanation`, or `sources` in `/api/today` or prior to a valid guess submission.
2. **Anti-Cheat Serve Timer**: When questions are served, the server records the serve timestamp. Any guess submitted faster than **2.0 seconds** after serve time is rejected with HTTP 400.
3. **Enforce Sequence Order**: Questions must be answered in strict sequential order ($1 \to 2 \to 3 \to 4 \to 5$). Out-of-order requests are rejected.
4. **One Guess Per Question**: A session can submit exactly one guess per question.
5. **Crowd Median Anonymization**: The crowd median guess is rounded to **0.1** and returned only after the player has guessed, and **only after at least 30 players** have submitted guesses.

---

## 3. API Reference

| Method | Endpoint | Request Body / Params | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/today` | `?date=YYYY-MM-DD&session=UUID` | Returns `{ plate, date, questions: [{ id, question, unit }] }`. Starts serve timer for Q1. |
| `POST` | `/api/guess` | `{ session, questionId, exponent }` | Validates exponent ($0 \le x \le 24$). Enforces timing and order. Returns truth, errorOrders, points, explanation, and crowd median. |
| `POST` | `/api/finish` | `{ session }` | Validates all 5 completed questions. Returns `{ total, totalErrorOrders, rank, percentile, perQuestion }`. |
| `GET` | `/api/stats/yesterday` | `?date=YYYY-MM-DD` | Returns per-question median error, closest guess, most common guess, and overall solve rate. |
| `POST` | `/api/admin/publish` | `{ date, questions }` (Auth: `APPROVAL_SECRET`) | Publishes approved daily questions to D1. |
| `GET` | `/api/admin/approve` | `?date=YYYY-MM-DD&token=SECRET` | One-click approval link from review email. |

---

## 4. Nightly Generation Pipeline (04:00 UTC)

1. **Candidate Proposal**: Queries the Anthropic API (`claude-sonnet-4-6`) for 12 candidate questions with dual independent sources.
2. **Dual-Source Verification**: Computes discrepancy between source A and source B. Rejects any where the sources differ by more than **25%** (ratio $> 1.25$).
3. **Extraction Consistency**: A second model call extracts the quantity from the question and sources. Rejects any where the extracted value differs from proposed value by more than **10%** (ratio $> 1.10$).
4. **Fermi Derivation Check**: Computes a back-of-envelope formula in code. Rejects/flags any candidate where the sourced value differs from the Fermi derivation by more than a **factor of 3**.
5. **Selection & 120-Day No-Reuse**: Picks 5 questions satisfying the scale spread rules without repeating any quantity used in the last 120 days.
6. **Human Review Email**: Sends preview email to editor with one-click approval link before 05:30 UTC. If unapproved by 05:30 UTC, automatically falls back to pre-approved `/backlog` sets.

---

## 5. Local Development & Testing

```bash
# Run unit and integration test suite (30 tests)
npm test

# Generate / refresh 14 days of backlog fixtures with simulated crowd players (>= 35 players)
npm run seed

# Run local worker development server
npm run dev
```
