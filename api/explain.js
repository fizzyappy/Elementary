import { gemini, readBody, sendError, takeToken } from './_utils.js';

// Explanations are deterministic enough to cache per (element, grade).
// The cache lives per warm instance, which is fine: it exists to absorb
// repeat clicks, not to be a distributed cache.
const cache = new Map();

const BANDS = {
  low: 'Use very short sentences and only everyday words. 60 words maximum.',
  mid: 'Use simple sentences. You may mention atoms and metals. 90 words maximum.',
  high: 'You may mention electrons, reactions and compounds. Be precise. 120 words maximum.',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST.' });
  }
  const { z, name, symbol, category, grade } = readBody(req);
  if (!z || !name) {
    return res.status(400).json({ error: 'z and name are required.' });
  }
  const g = Math.min(8, Math.max(1, Number(grade) || 4));
  const cacheKey = `${z}:${g}`;
  if (cache.has(cacheKey)) {
    return res.status(200).json(cache.get(cacheKey));
  }
  if (!takeToken()) {
    return res.status(429).json({ error: 'Too many requests. Wait a minute and try again.' });
  }

  const band = g <= 2 ? BANDS.low : g <= 5 ? BANDS.mid : BANDS.high;
  const prompt = [
    `You write for school students. Explain the chemical element ${name}`,
    `(symbol ${symbol}, a ${category}) to a student in grade ${g}.`,
    band,
    'Return JSON with exactly these keys:',
    '"explanation": the explanation described above.',
    '"wow": one genuinely surprising fact about this element, one sentence.',
    '"everyday": one place this student meets the element in daily life, one sentence.',
    'Rules: plain sentences only. No markdown, no emoji. Do not mention grades or reading levels.',
  ].join(' ');

  try {
    const out = await gemini(prompt);
    if (!out.explanation || !out.wow || !out.everyday) {
      throw new Error('AI returned an unexpected shape.');
    }
    const payload = {
      explanation: String(out.explanation),
      wow: String(out.wow),
      everyday: String(out.everyday),
      grade: g,
    };
    cache.set(cacheKey, payload);
    res.status(200).json(payload);
  } catch (err) {
    sendError(res, err);
  }
}
