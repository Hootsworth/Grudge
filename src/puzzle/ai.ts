/**
 * Multi-provider AI completion helper for Cloudflare Workers & Node.js.
 * Supports Google Gemini, OpenAI, Anthropic Claude, and Meta Llama (Groq / Together).
 */

export interface AiRequestOptions {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  provider?: string;
  model?: string;
  apiKey?: string;
}

export const DEFAULT_MODELS: Record<string, string> = {
  gemini: 'gemini-2.0-flash',
  google: 'gemini-2.0-flash',
  openai: 'gpt-4o',
  anthropic: 'claude-3-5-sonnet-20241022',
  meta: 'llama-3.3-70b-versatile',
  groq: 'llama-3.3-70b-versatile',
  together: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
};

export async function callAiCompletion(options: AiRequestOptions, env?: Record<string, any>): Promise<string> {
  const getEnv = (key: string): string => {
    return (
      (env && env[key]) ||
      (typeof process !== 'undefined' && process.env && process.env[key]) ||
      ''
    ).trim();
  };

  let provider = (options.provider || getEnv('AI_PROVIDER')).toLowerCase();
  const universalKey = options.apiKey || getEnv('AI_API_KEY');

  const geminiKey = getEnv('GEMINI_API_KEY') || getEnv('GOOGLE_API_KEY');
  const openaiKey = getEnv('OPENAI_API_KEY');
  const anthropicKey = getEnv('ANTHROPIC_API_KEY');
  const metaKey = getEnv('META_API_KEY') || getEnv('GROQ_API_KEY') || getEnv('TOGETHER_API_KEY');

  // Auto-detect provider if unspecified
  if (!provider) {
    if (geminiKey) provider = 'gemini';
    else if (openaiKey) provider = 'openai';
    else if (anthropicKey) provider = 'anthropic';
    else if (metaKey) provider = 'meta';
    else if (universalKey) provider = 'gemini';
    else provider = 'anthropic';
  }

  // Select appropriate API Key
  let apiKey = universalKey;
  if ((provider === 'gemini' || provider === 'google') && geminiKey) apiKey = geminiKey;
  else if (provider === 'openai' && openaiKey) apiKey = openaiKey;
  else if (provider === 'anthropic' && anthropicKey) apiKey = anthropicKey;
  else if ((provider === 'meta' || provider === 'groq' || provider === 'together') && metaKey) apiKey = metaKey;

  if (!apiKey) {
    throw new Error(`Missing API Key for AI Provider '${provider}'. Set ${provider.toUpperCase()}_API_KEY or AI_API_KEY.`);
  }

  const model = options.model || getEnv('AI_MODEL') || getEnv(`${provider.toUpperCase()}_MODEL`) || DEFAULT_MODELS[provider] || 'gemini-2.0-flash';
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 1024;

  if (provider === 'gemini' || provider === 'google') {
    return callGemini(options.systemPrompt, options.userPrompt, model, apiKey, temperature, maxTokens);
  } else if (provider === 'openai') {
    return callOpenAi(options.systemPrompt, options.userPrompt, model, apiKey, temperature, maxTokens);
  } else if (provider === 'meta' || provider === 'groq' || provider === 'together') {
    return callMetaOpenAiCompat(provider, options.systemPrompt, options.userPrompt, model, apiKey, temperature, maxTokens);
  } else {
    return callAnthropic(options.systemPrompt, options.userPrompt, model, apiKey, temperature, maxTokens);
  }
}

async function callGemini(
  systemPrompt: string | undefined,
  userPrompt: string,
  model: string,
  apiKey: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const modelName = model.replace(/^models\//, '');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const payload: any = {
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: userPrompt.includes('JSON') ? 'application/json' : 'text/plain',
    },
  };

  if (systemPrompt) {
    payload.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API returned HTTP ${res.status}: ${errText}`);
  }

  const data: any = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}

async function callOpenAi(
  systemPrompt: string | undefined,
  userPrompt: string,
  model: string,
  apiKey: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const messages: any[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: userPrompt });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API returned HTTP ${res.status}: ${errText}`);
  }

  const data: any = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callMetaOpenAiCompat(
  provider: string,
  systemPrompt: string | undefined,
  userPrompt: string,
  model: string,
  apiKey: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  let url = 'https://api.groq.com/openai/v1/chat/completions';
  if (provider === 'together') url = 'https://api.together.xyz/v1/chat/completions';

  const messages: any[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: userPrompt });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Meta (${provider}) API returned HTTP ${res.status}: ${errText}`);
  }

  const data: any = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callAnthropic(
  systemPrompt: string | undefined,
  userPrompt: string,
  model: string,
  apiKey: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const payload: any = {
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: userPrompt }],
  };
  if (systemPrompt) payload.system = systemPrompt;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API returned HTTP ${res.status}: ${errText}`);
  }

  const data: any = await res.json();
  const text = (data.content || []).map((c: any) => c.text || '').join('');
  return text;
}

export function cleanJson(text: string): string {
  let cleaned = text.trim().replace(/^```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    const match = cleaned.match(/(\[.*\]|\{.*\})/s);
    if (match) cleaned = match[1].trim();
  }
  return cleaned;
}
