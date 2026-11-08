import type { Env, Puzzle, PuzzleEvent, ThemeType, SpreadType } from '../types.ts';
import { getDifficultyAndThemeForDate, validateEventSpread } from './difficulty.ts';
import { checkStaticEventRules, runIndependentVerificationPass } from './verifier.ts';
import { getBacklogPuzzleForDate } from './backlog.ts';
import { getRecentEventTexts } from '../db.ts';

const MAX_GENERATION_ATTEMPTS = 3;

export interface GeneratedPuzzlePayload {
  plate: string;
  theme: ThemeType;
  spread_type: SpreadType;
  events: Array<{
    text: string;
    year: number;
    precision: 'exact' | 'approximate';
    source: string;
  }>;
}

const GENERATE_SYSTEM_PROMPT = `You are the lead historical archivist for "Strata", a daily timeline game.
Your task is to generate exactly 6 historical events for a daily puzzle that players must arrange from newest (top) to oldest (bottom).

CRITICAL RULES:
1. Exactly 6 events.
2. Every event must have:
   - "text": One-line neutral description, strictly max 70 characters.
   - "year": Integer (negative for BCE, e.g. -44, -2560). No year 0.
   - "precision": "exact" or "approximate".
   - "source": A reliable Wikipedia or encyclopedic URL.
3. QUALITY & VERIFIABILITY:
   - Events must be unambiguous in chronological order.
   - No two events within 2 years of each other.
   - Avoid events whose dates are disputed by scholars.
   - None involves graphic violence, tragedy, genocide, mass murder, or human degradation as the main subject. Focus on achievements, discoveries, treaties, cultural milestones, constructions, and peaceful shifts.
4. ABSOLUTELY NO DATE OR ORDER LEAKAGE:
   - Do NOT include dates, years, centuries, or decades in the text (e.g. no "in 1969", no "18th century", no "1940s").
   - Do NOT include ordering cues in the text (e.g. no "the first X", "the last Y", "the earliest", "subsequent").
5. SPREAD:
   - "century": all events within a 100-year window.
   - "era": events spread across 200 to 800 years.
   - "millennia": events spanning over 1000 years (often BCE to modern).

Return ONLY a strict JSON object:
{
  "events": [
    { "text": "...", "year": 1969, "precision": "exact", "source": "https://..." }
  ]
}`;

import { callAiCompletion, cleanJson } from './ai.ts';

export async function callAnthropicGeneratePuzzle(
  theme: ThemeType,
  spread: SpreadType,
  plate: string,
  excludeTexts: string[],
  apiKey: string,
  model: string = 'claude-sonnet-4-6'
): Promise<PuzzleEvent[]> {
  const excludeWarning =
    excludeTexts.length > 0
      ? `\nDO NOT reuse any of these recently featured events:\n${excludeTexts.slice(0, 40).map((t) => `- ${t}`).join('\n')}\n`
      : '';

  const userPrompt = `Generate 6 events for today's Strata puzzle.
Theme: ${theme}
Spread: ${spread}
Plate Title: ${plate}
${excludeWarning}

Ensure descriptions are concise (<= 70 chars) and contain NO dates or "first/last" cues. Return JSON.`;

  const rawContent = await callAiCompletion({
    systemPrompt: GENERATE_SYSTEM_PROMPT,
    userPrompt,
    temperature: 0.7,
    maxTokens: 800,
    model,
    apiKey,
  });

  const parsed = JSON.parse(cleanJson(rawContent));

  if (!parsed.events || !Array.isArray(parsed.events) || parsed.events.length !== 6) {
    throw new Error('Model did not return exactly 6 events in JSON.');
  }

  // Sort descending by year: index 0 = newest / surface, index 5 = oldest / bedrock
  const sorted = [...parsed.events].sort((a: any, b: any) => b.year - a.year);

  return sorted.map((e: any, idx: number) => ({
    id: `ev-${crypto.randomUUID().slice(0, 8)}`,
    text: String(e.text).trim(),
    year: Number(e.year),
    precision: e.precision === 'approximate' ? 'approximate' : 'exact',
    source: String(e.source || 'https://en.wikipedia.org'),
    true_order: idx,
  }));
}

export async function generateDailyPuzzle(
  env: Env,
  dateStr: string
): Promise<{ puzzle: Puzzle; events: PuzzleEvent[]; source: 'anthropic' | 'backlog' }> {
  const { theme, spread, plate } = getDifficultyAndThemeForDate(dateStr);
  const puzzleId = `puzzle-${dateStr}`;

  let recentTexts: string[] = [];
  try {
    recentTexts = await getRecentEventTexts(env.DB, 120);
  } catch (err) {
    console.warn('Could not read recent events from D1, proceeding without history:', err);
  }

  if (env.ANTHROPIC_API_KEY) {
    for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
      try {
        console.log(`[Strata] Generation attempt ${attempt}/${MAX_GENERATION_ATTEMPTS} for ${dateStr} (${theme}, ${spread})...`);

        const candidateEvents = await callAnthropicGeneratePuzzle(
          theme,
          spread,
          plate,
          recentTexts,
          env.ANTHROPIC_API_KEY
        );

        // Assign puzzle_id and true_order
        candidateEvents.forEach((ev, idx) => {
          ev.puzzle_id = puzzleId;
          ev.true_order = idx;
        });

        // 1. Static rule checks
        const staticCheck = checkStaticEventRules(candidateEvents);
        if (!staticCheck.valid) {
          console.warn(`[Strata] Static validation failed on attempt ${attempt}:`, staticCheck.errors);
          continue;
        }

        // 2. Spread validation
        const spreadCheck = validateEventSpread(
          candidateEvents.map((e) => e.year),
          spread
        );
        if (!spreadCheck.valid) {
          console.warn(`[Strata] Spread validation failed on attempt ${attempt}:`, spreadCheck.reason);
          continue;
        }

        // 3. Verification pass (second model call)
        const verification = await runIndependentVerificationPass(
          candidateEvents,
          env.ANTHROPIC_API_KEY
        );

        if (!verification.valid) {
          console.warn(`[Strata] Verification pass failed on attempt ${attempt}:`, verification.errors);
          continue;
        }

        console.log(`[Strata] Puzzle generated & verified successfully for ${dateStr}!`);

        const puzzle: Puzzle = {
          id: puzzleId,
          date: dateStr,
          plate,
          theme,
          spread_type: spread,
          status: 'pending', // Pending review gate until 06:00 UTC
          created_at: Date.now(),
          published_at: null,
          events: candidateEvents,
        };

        return { puzzle, events: candidateEvents, source: 'anthropic' };
      } catch (err) {
        console.error(`[Strata] Error during generation attempt ${attempt}:`, err);
      }
    }
  }

  // Fallback to verified backlog template
  console.warn(`[Strata] Falling back to pre-approved backlog puzzle for ${dateStr}.`);
  const backlog = getBacklogPuzzleForDate(dateStr);
  return { ...backlog, source: 'backlog' };
}

export async function sendPreviewWebhook(
  webhookUrl: string,
  puzzle: Puzzle,
  events: PuzzleEvent[]
): Promise<void> {
  const sorted = [...events].sort((a, b) => b.year - a.year);
  const eventLines = sorted
    .map((e, idx) => `${idx + 1}. **${e.text}** (${e.year < 0 ? `${Math.abs(e.year)} BCE` : e.year}) — [Source](${e.source})`)
    .join('\n');

  const payload = {
    content: `🧩 **New Strata Puzzle Pending Review [${puzzle.date}]**\n` +
      `**Plate:** ${puzzle.plate} | **Theme:** ${puzzle.theme} | **Spread:** ${puzzle.spread_type}\n\n` +
      `*Order (Newest at top to Oldest at bottom):*\n${eventLines}\n\n` +
      `_This puzzle will automatically publish at 06:00 UTC unless vetoed._`,
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[Strata] Failed to send preview webhook:', err);
  }
}
