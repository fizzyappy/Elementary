// Shared helpers for the serverless functions.
// Anything that touches a secret lives behind these routes; the browser never
// sees an API key.

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

// Simple token bucket, refilled once a minute. It only guards a single warm
// instance, but on a demo deployment one instance is the realistic case and
// it keeps a stray loop from burning the free-tier quota.
const bucket = { tokens: 20, refilledAt: Date.now() };

export function takeToken() {
  const now = Date.now();
  if (now - bucket.refilledAt > 60_000) {
    bucket.tokens = 20;
    bucket.refilledAt = now;
  }
  if (bucket.tokens <= 0) return false;
  bucket.tokens -= 1;
  return true;
}

export function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try {
    return JSON.parse(req.body || '{}');
  } catch {
    return {};
  }
}

export async function gemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    const err = new Error('AI is not configured on this deployment.');
    err.code = 'NOT_CONFIGURED';
    throw err;
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const res = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        responseMimeType: 'application/json',
      },
    }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    throw new Error(`Gemini responded ${res.status}: ${detail}`);
  }
  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text || '')
    .join('');
  return JSON.parse(text);
}

export function sendError(res, err) {
  const status = err.code === 'NOT_CONFIGURED' ? 501 : 502;
  res.status(status).json({ error: err.message });
}
