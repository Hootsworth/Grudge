// Routes: /api/round/start, /api/round/zoomout, /api/round/guess
import type { Env, WindowRendering, GuessResponse } from '../types.ts';
import {
  createOrGetSession,
  getRound,
  updateSessionStartRound,
  incrementHintsUsed,
  recordGuess,
  getGuessesForSession,
} from '../db.ts';
import {
  haversineDistanceKm,
  calculatePoints,
  shuffleShapes,
} from '../scoring.ts';
import {
  hashIp,
  checkIpRateLimit,
  validateGuessTiming,
} from '../rate_limit.ts';

function sanitizeAspect(raw?: string): '4:3' | '16:9' | '3:4' {
  if (raw === '16:9') return '16:9';
  if (raw === '3:4') return '3:4';
  return '4:3';
}

/**
 * Fallback procedural window in case KV key is missing or not yet seeded.
 */
function getFallbackWindow(level: number, aspect: string): WindowRendering {
  const widthUnits = level === 0 ? 90 : level === 1 ? 220 : 550;
  const ratio = aspect === '16:9' ? 16 / 9 : aspect === '3:4' ? 3 / 4 : 4 / 3;
  const heightUnits = Math.round((widthUnits / ratio) * 10) / 10;

  return {
    viewBox: `0 0 ${widthUnits} ${heightUnits}`,
    kmPerUnit: 11.1,
    shapes: [
      {
        d: `M10,10 L${widthUnits - 10},10 L${widthUnits - 10},${heightUnits - 10} L10,${heightUnits - 10} Z`,
        cls: 'c0',
      },
    ],
  };
}

/**
 * Route: POST /api/round/start
 */
export async function handleRoundStart(
  request: Request,
  env: Env
): Promise<Response> {
  const now = Date.now();
  const rawIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const ipHash = await hashIp(rawIp);
  const todayStr = new Date().toISOString().split('T')[0];

  const rateCheck = await checkIpRateLimit(env.DB, ipHash, todayStr, now);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: rateCheck.lockoutMessage || 'Rate limit active' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateCheck.retryAfterSeconds || 10),
        },
      }
    );
  }

  let body: { session?: string; round?: number; aspect?: string };
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { session: sessionId, round: requestedRound, aspect: rawAspect } = body;

  if (!sessionId || typeof sessionId !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid session UUID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const roundNum = Number(requestedRound);
  if (!roundNum || roundNum < 1 || roundNum > 5) {
    return new Response(JSON.stringify({ error: 'Round number must be between 1 and 5' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = await createOrGetSession(env.DB, sessionId, todayStr, ipHash, now);

  // Enforce strict round ordering
  if (roundNum !== session.current_round) {
    if (roundNum === 1 && (session.status === 'finished' || session.current_round > 5)) {
      await env.DB.prepare(
        'UPDATE sessions SET current_round = 1, round_started_at = ?, hints_used = 0, total_score = 0, status = "active", finished_at = NULL WHERE id = ?'
      ).bind(now, sessionId).run();
      session.current_round = 1;
      session.status = 'active';
    } else {
      return new Response(
        JSON.stringify({
          error: `Rounds must be played in order. Currently on round ${session.current_round}.`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Mark round start time
  await updateSessionStartRound(env.DB, sessionId, roundNum, now);

  const aspect = sanitizeAspect(rawAspect);
  const kvKey = `puzzle/${todayStr}/${roundNum}/0/${aspect}`;

  let windowData: WindowRendering | null = null;
  if (env.KV) {
    try {
      windowData = await env.KV.get<WindowRendering>(kvKey, 'json');
    } catch (e) {}
  }

  if (!windowData) {
    windowData = getFallbackWindow(0, aspect);
  }

  // Anti-leak: Randomize path ordering per session so payloads are not byte-identical
  const randomizedShapes = shuffleShapes(windowData.shapes, sessionId + roundNum);
  const responseWindow: WindowRendering = {
    viewBox: windowData.viewBox,
    kmPerUnit: windowData.kmPerUnit,
    shapes: randomizedShapes,
  };

  return new Response(JSON.stringify({ window: responseWindow }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
}

/**
 * Route: POST /api/round/zoomout
 */
export async function handleRoundZoomout(
  request: Request,
  env: Env
): Promise<Response> {
  const now = Date.now();
  const rawIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const ipHash = await hashIp(rawIp);
  const todayStr = new Date().toISOString().split('T')[0];

  const rateCheck = await checkIpRateLimit(env.DB, ipHash, todayStr, now);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: rateCheck.lockoutMessage || 'Rate limit active' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: { session?: string; round?: number; aspect?: string };
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { session: sessionId, round: requestedRound, aspect: rawAspect } = body;
  if (!sessionId || typeof sessionId !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid session UUID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const roundNum = Number(requestedRound);
  const session = await createOrGetSession(env.DB, sessionId, todayStr, ipHash, now);

  if (roundNum !== session.current_round) {
    return new Response(
      JSON.stringify({ error: `Invalid round. Currently on round ${session.current_round}.` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!session.round_started_at) {
    return new Response(
      JSON.stringify({ error: 'Round has not been started yet. Call /api/round/start first.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (session.hints_used >= 2) {
    return new Response(
      JSON.stringify({ error: 'Maximum zoom-out reached (2 zoom-outs max per round).' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Increment server-tracked hints
  const newHints = await incrementHintsUsed(env.DB, sessionId);
  const level = newHints; // level 1 or 2
  const aspect = sanitizeAspect(rawAspect);
  const kvKey = `puzzle/${todayStr}/${roundNum}/${level}/${aspect}`;

  let windowData: WindowRendering | null = null;
  if (env.KV) {
    try {
      windowData = await env.KV.get<WindowRendering>(kvKey, 'json');
    } catch (e) {}
  }

  if (!windowData) {
    windowData = getFallbackWindow(level, aspect);
  }

  const randomizedShapes = shuffleShapes(windowData.shapes, sessionId + roundNum + level);
  const responseWindow: WindowRendering = {
    viewBox: windowData.viewBox,
    kmPerUnit: windowData.kmPerUnit,
    shapes: randomizedShapes,
  };

  return new Response(JSON.stringify({ window: responseWindow, hintsUsed: newHints }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
}

/**
 * Route: POST /api/round/guess
 */
export async function handleRoundGuess(
  request: Request,
  env: Env
): Promise<Response> {
  const now = Date.now();
  const rawIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const ipHash = await hashIp(rawIp);
  const todayStr = new Date().toISOString().split('T')[0];

  const rateCheck = await checkIpRateLimit(env.DB, ipHash, todayStr, now);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: rateCheck.lockoutMessage || 'Rate limit active' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: { session?: string; round?: number; lat?: number; lon?: number };
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { session: sessionId, round: requestedRound, lat, lon } = body;
  if (!sessionId || typeof sessionId !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid session UUID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const roundNum = Number(requestedRound);
  if (!roundNum || roundNum < 1 || roundNum > 5) {
    return new Response(JSON.stringify({ error: 'Round number must be between 1 and 5' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
    return new Response(JSON.stringify({ error: 'Coordinates lat and lon must be numbers' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (lat < -85 || lat > 85 || lon < -180 || lon > 180) {
    return new Response(
      JSON.stringify({ error: 'Latitude must be in [-85, 85] and longitude in [-180, 180]' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const session = await createOrGetSession(env.DB, sessionId, todayStr, ipHash, now);

  if (roundNum !== session.current_round) {
    return new Response(
      JSON.stringify({
        error: `Out-of-order guess rejected. Currently on round ${session.current_round}.`,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!session.round_started_at) {
    return new Response(
      JSON.stringify({ error: 'Round must be started before submitting a guess.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Anti-cheat timing check: minimum 1.5 seconds between round start and guess
  if (!validateGuessTiming(session.round_started_at, now)) {
    return new Response(
      JSON.stringify({
        error: 'Guess submitted too fast. Please take at least 1.5s to view the map.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check if round was already guessed in this session
  const previousGuesses = await getGuessesForSession(env.DB, sessionId);
  if (previousGuesses.some((g) => g.round_number === roundNum)) {
    return new Response(
      JSON.stringify({ error: `Round ${roundNum} has already been guessed in this session.` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Fetch true spot location for this round
  const roundData = await getRound(env.DB, todayStr, roundNum);
  if (!roundData) {
    // If not seeded, use deterministic fallback spot
    const fallbackSpots = [
      { name: 'Strait of Gibraltar', lat: 35.96, lon: -5.6, fact: 'The Strait of Gibraltar connects the Atlantic Ocean to the Mediterranean Sea.', source_url: 'https://en.wikipedia.org/wiki/Strait_of_Gibraltar' },
      { name: 'Sinai Peninsula', lat: 29.5, lon: 33.8, fact: 'The Sinai Peninsula serves as a land bridge connecting Asia and Africa.', source_url: 'https://en.wikipedia.org/wiki/Sinai_Peninsula' },
      { name: 'Baja California', lat: 28.0, lon: -113.5, fact: 'Baja California separates the Pacific Ocean from the Gulf of California.', source_url: 'https://en.wikipedia.org/wiki/Baja_California_Peninsula' },
      { name: 'Bosphorus Strait', lat: 41.1, lon: 29.05, fact: 'The Bosphorus Strait forms part of the continental boundary between Europe and Asia.', source_url: 'https://en.wikipedia.org/wiki/Bosphorus' },
      { name: 'Cape of Good Hope', lat: -34.35, lon: 18.49, fact: 'The Cape of Good Hope marks the point where ships begin to travel more eastward than southward.', source_url: 'https://en.wikipedia.org/wiki/Cape_of_Good_Hope' },
    ];
    const fb = fallbackSpots[roundNum - 1] || fallbackSpots[0];

    const distKm = haversineDistanceKm(lat, lon, fb.lat, fb.lon);
    const pts = calculatePoints(distKm, session.hints_used);
    const durationMs = now - session.round_started_at;

    await recordGuess(env.DB, {
      session_id: sessionId,
      puzzle_date: todayStr,
      round_number: roundNum,
      guess_lat: lat,
      guess_lon: lon,
      distance_km: Math.round(distKm * 10) / 10,
      points: pts,
      hints_used: session.hints_used,
      duration_ms: durationMs,
      created_at: now,
    });

    const resp: GuessResponse = {
      distanceKm: Math.round(distKm * 10) / 10,
      points: pts,
      hintsUsed: session.hints_used,
      trueLat: fb.lat,
      trueLon: fb.lon,
      name: fb.name,
      fact: fb.fact,
      sourceUrl: fb.source_url,
    };

    return new Response(JSON.stringify(resp), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-store',
      },
    });
  }

  const distanceKm = haversineDistanceKm(lat, lon, roundData.lat, roundData.lon);
  const points = calculatePoints(distanceKm, session.hints_used);
  const durationMs = now - session.round_started_at;

  await recordGuess(env.DB, {
    session_id: sessionId,
    puzzle_date: todayStr,
    round_number: roundNum,
    guess_lat: lat,
    guess_lon: lon,
    distance_km: Math.round(distanceKm * 10) / 10,
    points,
    hints_used: session.hints_used,
    duration_ms: durationMs,
    created_at: now,
  });

  const responsePayload: GuessResponse = {
    distanceKm: Math.round(distanceKm * 10) / 10,
    points,
    hintsUsed: session.hints_used,
    trueLat: roundData.lat,
    trueLon: roundData.lon,
    name: roundData.name,
    fact: roundData.fact,
    sourceUrl: roundData.source_url,
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
}
