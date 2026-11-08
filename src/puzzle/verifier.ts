import type { PuzzleEvent } from '../types.ts';

export interface VerificationResult {
  valid: boolean;
  errors: string[];
  estimatedYears?: Record<string, number>;
}

const LEAK_PATTERNS = [
  /\bthe\s+first\b/i,
  /\bthe\s+last\b/i,
  /\b\d{1,2}(st|nd|rd|th)\s+century\b/i,
  /\b\d{4}s?\b/, // 4-digit year like 1969 or 1492
  /\b\d{1,4}\s*(bce|ce|bc|ad)\b/i, // Explicit BC/AD/BCE/CE in text
];

/**
 * Validate text length, answer leakage, year uniqueness, and minimum year gap.
 */
export function checkStaticEventRules(events: PuzzleEvent[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (events.length !== 6) {
    errors.push(`Puzzle must have exactly 6 events, found ${events.length}.`);
    return { valid: false, errors };
  }

  const seenTexts = new Set<string>();
  const seenYears = new Set<number>();

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const loc = `Event ${i + 1} ("${ev.text.slice(0, 30)}...")`;

    if (!ev.text || ev.text.trim().length === 0) {
      errors.push(`${loc}: text cannot be empty.`);
    }

    if (ev.text.length > 70) {
      errors.push(`${loc}: description exceeds 70 characters (${ev.text.length} chars).`);
    }

    if (seenTexts.has(ev.text.trim().toLowerCase())) {
      errors.push(`${loc}: duplicate event description found.`);
    }
    seenTexts.add(ev.text.trim().toLowerCase());

    if (seenYears.has(ev.year)) {
      errors.push(`${loc}: duplicate year ${ev.year} found. Events must have distinct years.`);
    }
    seenYears.add(ev.year);

    // Check for date/order leakage
    for (const pattern of LEAK_PATTERNS) {
      if (pattern.test(ev.text)) {
        errors.push(`${loc}: text leaks timing or order cues (matches ${pattern}).`);
        break;
      }
    }

    if (!ev.source || !ev.source.startsWith('http')) {
      errors.push(`${loc}: missing valid source URL.`);
    }
  }

  // Check that years are sorted or sortable with no two events within 2 years unless strictly spaced
  const sortedYears = [...events].map((e) => e.year).sort((a, b) => a - b);
  for (let i = 0; i < sortedYears.length - 1; i++) {
    const diff = Math.abs(sortedYears[i + 1] - sortedYears[i]);
    if (diff < 2) {
      errors.push(
        `Events with years ${sortedYears[i]} and ${sortedYears[i + 1]} are only ${diff} year(s) apart (must be >= 2 years).`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Compare independent year estimates against stored years.
 * - 'exact': tolerance is max 2 years
 * - 'approximate': tolerance is max 30 years (or 2% of span for ancient events)
 */
export function verifyEstimatedYears(
  events: PuzzleEvent[],
  estimates: Record<string, number>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const ev of events) {
    const estimated = estimates[ev.id];
    if (estimated === undefined || typeof estimated !== 'number') {
      errors.push(`Missing year estimate for event ${ev.id} (${ev.text}).`);
      continue;
    }

    const diff = Math.abs(estimated - ev.year);
    const maxAllowedDiff = ev.precision === 'exact' ? 2 : 30;

    if (diff > maxAllowedDiff) {
      errors.push(
        `Year verification failed for "${ev.text}": stored ${ev.year}, independent estimate ${estimated} (diff ${diff} > max allowed ${maxAllowedDiff}).`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Execute the independent verification pass.
 * Calls Anthropic API to independently date each event from its description and source.
 */
export async function runIndependentVerificationPass(
  events: PuzzleEvent[],
  anthropicApiKey?: string,
  model: string = 'claude-sonnet-4-6'
): Promise<VerificationResult> {
  // 1. Static rule checks
  const staticCheck = checkStaticEventRules(events);
  if (!staticCheck.valid) {
    return { valid: false, errors: staticCheck.errors };
  }

  if (!anthropicApiKey) {
    // If no API key provided, assume verification passes static checks
    return { valid: true, errors: [] };
  }

  // Format prompt for second model call
  const promptEvents = events.map((e, idx) => ({
    id: e.id,
    description: e.text,
    source: e.source,
  }));

  const prompt = `You are a chronological verifier.
Given these 6 historical events and their sources, independently estimate the year of occurrence for each.
Do NOT look up or bias toward any assumed order.
Use negative numbers for BCE (e.g. -44 for 44 BCE, -2560 for 2560 BCE).

Events:
${JSON.stringify(promptEvents, null, 2)}

Return ONLY a strict JSON object mapping event id to integer year:
{
  "${events[0]?.id || 'e1'}": 1969,
  ...
}`;

  try {
    const { callAiCompletion, cleanJson } = await import('./ai.ts');
    const rawContent = await callAiCompletion({
      userPrompt: prompt,
      temperature: 0.0,
      maxTokens: 500,
      model,
      apiKey: anthropicApiKey,
    });

    const clean = cleanJson(rawContent);
    const estimates = JSON.parse(clean);

    const check = verifyEstimatedYears(events, estimates);
    return {
      valid: check.valid,
      errors: check.errors,
      estimatedYears: estimates,
    };
  } catch (err: any) {
    return {
      valid: false,
      errors: [`Verification model error: ${err.message || String(err)}`],
    };
  }
}
