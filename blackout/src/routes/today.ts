// Route: GET /api/today
import type { Env, TodayResponse } from '../types.ts';
import { ensurePuzzle } from '../db.ts';
import { tokenizeExcerpt } from '../dossiers.ts';

export async function handleTodayRoute(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const targetDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const dossier = await ensurePuzzle(env.DB, targetDate);
    const tokens = tokenizeExcerpt(dossier.excerpt);

    // Sanitize payload: Deliver word lengths and punctuation without leaking secret words
    const sanitizedTokens = tokens.map((t) => {
      // Extract punctuation before and after the core word
      const match = t.raw.match(/^([^a-zA-Z0-9]*)(.*?)([^a-zA-Z0-9]*)$/);
      const punctBefore = match ? match[1] : '';
      const punctAfter = match ? match[3] : '';

      return {
        index: t.index,
        length: t.word.length,
        punctuationBefore: punctBefore,
        punctuationAfter: punctAfter,
        preRevealedWord: t.isCommonArticle ? t.word : undefined,
      };
    });

    const payload: TodayResponse = {
      date: dossier.date,
      plate: dossier.plate,
      classification: dossier.classification,
      category: dossier.category,
      year: dossier.year,
      totalTokens: tokens.length,
      totalWords: tokens.filter((t) => !t.isPunctuationOnly).length,
      tokens: sanitizedTokens,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve today blackout dossier', details: err?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
