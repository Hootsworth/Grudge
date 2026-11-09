// Route: POST /api/finish
import type { Env, FinishRequest, FinishResponse } from '../types.ts';
import { createOrGetSession, ensurePuzzle, finishSession } from '../db.ts';
import { getAllAccountedSubAnagrams } from '../words.ts';

export async function handleFinishRoute(request: Request, env: Env): Promise<Response> {
  let body: FinishRequest;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { session: sessionId } = body;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Missing session UUID' }), { status: 400 });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const puzzle = await ensurePuzzle(env.DB, todayStr);
  const session = await createOrGetSession(env.DB, sessionId, todayStr);

  await finishSession(env.DB, sessionId);

  const foundWords: string[] = JSON.parse(session.words_found_json || '[]');
  const allAccountedWords = getAllAccountedSubAnagrams(puzzle.keyLetters);

  // Missed words accounted for by the authoritative database
  const missedWords = allAccountedWords.filter((w) => !foundWords.includes(w));

  const pct = puzzle.maxScore > 0 ? session.score / (puzzle.maxScore * 1.5) : 0;
  let title = 'Warm-up';
  if (pct >= 0.70) {
    title = 'Walking Thesaurus';
  } else if (pct >= 0.45) {
    title = 'Dictionary Goblin';
  } else if (pct >= 0.25) {
    title = 'Lexicon Lord';
  } else if (pct >= 0.10) {
    title = 'Wordsmith';
  }

  const shareCard = `Sprint #${puzzle.plate}  ${session.score} pts  x${session.best_combo} best combo  ${foundWords.length}/${allAccountedWords.length} words`;

  const payload: FinishResponse = {
    score: session.score,
    wordsFoundCount: foundWords.length,
    totalWordsCount: allAccountedWords.length,
    bestCombo: session.best_combo,
    title,
    missedWords,
    shareCard,
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
