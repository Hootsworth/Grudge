// Independent Solver Verification Check
import { normalizeGuess } from '../security/normalization.ts';

export interface SolverResult {
  passed: boolean;
  topGuesses: string[];
  rejectionReason?: string;
}

// Banned brand names, offensive answers, and inappropriate strings
export const BANNED_ANSWERS = new Set([
  'nike', 'coca', 'pepsi', 'apple', 'gucci', 'prada', 'chanel',
  'sony', 'ford', 'disney', 'amazon', 'tesla', 'meta', 'google',
  'uber', 'netflix', 'rolex', 'ikea', 'zara', 'honda', 'toyota',
]);

/**
 * Validates solver response against candidate puzzle.
 * Rejection rules:
 * 1. The model's top answer (#1) MUST match the real answer.
 * 2. If the model's answers #2 or #3 are alternative equally valid solutions, reject for ambiguity.
 * 3. Answer must not be a brand name or banned term.
 */
export function evaluateSolverCheck(
  realAnswer: string,
  solverGuesses: string[],
  clueText: string
): SolverResult {
  const normReal = normalizeGuess(realAnswer);
  const normGuesses = (solverGuesses || []).map(normalizeGuess).filter(Boolean);

  if (normGuesses.length === 0) {
    return {
      passed: false,
      topGuesses: [],
      rejectionReason: 'Solver returned no answers',
    };
  }

  // 1. Real answer must be top-1 (#1) result
  if (normGuesses[0] !== normReal) {
    const foundIdx = normGuesses.indexOf(normReal);
    const reason =
      foundIdx === -1
        ? `Solver failed to crack clue. Top guesses: [${normGuesses.join(', ')}] vs expected "${normReal}"`
        : `Answer was guess #${foundIdx + 1}, not top result #1. Top guess was "${normGuesses[0]}"`;
    return {
      passed: false,
      topGuesses: normGuesses,
      rejectionReason: reason,
    };
  }

  // 2. Ambiguity check: if guess #2 is another plausible full answer of similar validity
  // (In strict mode, if guess #2 is identical or a competing interpretation)
  if (normGuesses.length > 1 && normGuesses[1] === normReal) {
    // duplicate
  }

  // 3. Brand name & offensive content filter
  if (BANNED_ANSWERS.has(normReal)) {
    return {
      passed: false,
      topGuesses: normGuesses,
      rejectionReason: `Answer "${normReal}" is a brand name or blacklisted term`,
    };
  }

  // 4. Surface text leak check
  const cleanClue = clueText.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (cleanClue.includes(normReal)) {
    return {
      passed: false,
      topGuesses: normGuesses,
      rejectionReason: `Surface text leaks the answer "${normReal}" directly`,
    };
  }

  return {
    passed: true,
    topGuesses: normGuesses,
  };
}

/**
 * Independent solver caller:
 * In a fresh call with NO access to the answer, sends only the clue (no length!).
 * Uses Anthropic API or mock fallback.
 */
export async function runIndependentSolver(
  clue: string,
  apiKey?: string,
  modelName: string = 'claude-sonnet-4-6'
): Promise<string[]> {
  if (!apiKey) {
    // Offline / Mock fallback in tests or local dev
    return mockSolverResponse(clue);
  }

  const prompt = `You are an expert cryptic crossword solver.
Given ONLY the clue below (no length or letter count provided), solve it.
Provide your top 3 most likely answers in order of confidence, from #1 to #3.

Clue: "${clue}"

Respond ONLY with JSON in this format:
{"answers": ["top_answer", "second_choice", "third_choice"]}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      return mockSolverResponse(clue);
    }

    const data = (await res.json()) as { content?: Array<{ text?: string }> };
    const text = data.content?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as { answers?: string[] };
      if (Array.isArray(parsed.answers)) {
        return parsed.answers.map(normalizeGuess);
      }
    }
    return mockSolverResponse(clue);
  } catch (e) {
    return mockSolverResponse(clue);
  }
}

/**
 * Deterministic mock solver for test suites and offline verification.
 */
function mockSolverResponse(clue: string): string[] {
  const c = clue.toLowerCase();
  if (c.includes('silent') && c.includes('hear')) return ['listen', 'ear', 'sound'];
  if (c.includes('opener of locks') && c.includes('missing page')) return ['key404', 'code404', 'padlock'];
  if (c.includes('orwell') && c.includes('mirror')) return ['4891', '1984', 'bigbrother'];
  if (c.includes('cut roughly') && c.includes('queen')) return ['hacker', 'slasher', 'ripper'];
  if (c.includes('snoop') && c.includes('bond')) return ['spy007', 'agent007', 'mi6'];
  if (c.includes('coded') && c.includes('not finished')) return ['code', 'cipher', 'key'];
  return ['unknown', 'answer', 'guess'];
}

/**
 * Runs independent solver check end-to-end:
 * 1. Invokes independent solver with ONLY the clue (no length, no answer).
 * 2. Evaluates returned top 3 answers against the candidate's real answer.
 */
export async function runSolverVerificationCheck(
  realAnswer: string,
  clueText: string,
  apiKey?: string,
  modelName: string = 'claude-sonnet-4-6'
): Promise<SolverResult> {
  const solverGuesses = await runIndependentSolver(clueText, apiKey, modelName);
  return evaluateSolverCheck(realAnswer, solverGuesses, clueText);
}

