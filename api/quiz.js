import { gemini, readBody, sendError, takeToken } from './_utils.js';

const cache = new Map();

function validate(out) {
  const qs = out?.questions;
  if (!Array.isArray(qs) || qs.length !== 5) return null;
  for (const q of qs) {
    if (typeof q.q !== 'string') return null;
    if (!Array.isArray(q.options) || q.options.length !== 4) return null;
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) return null;
    if (typeof q.why !== 'string') return null;
  }
  return qs;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST.' });
  }
  const { elements, grade } = readBody(req);
  if (!Array.isArray(elements) || elements.length < 4) {
    return res.status(400).json({ error: 'Send at least 4 elements.' });
  }
  const g = Math.min(8, Math.max(1, Number(grade) || 4));

  // Slim the payload server-side so a huge client request cannot inflate the
  // prompt. 24 elements is plenty of raw material for five questions.
  const pool = elements.slice(0, 24).map((e) => ({
    name: e.name,
    symbol: e.symbol,
    category: e.category,
    state: e.state,
    electronegativity: e.electronegativity,
  }));

  const cacheKey = g + ':' + pool.map((e) => e.symbol).sort().join(',');
  if (cache.has(cacheKey)) {
    return res.status(200).json({ questions: cache.get(cacheKey), source: 'ai' });
  }
  if (!takeToken()) {
    return res.status(429).json({ error: 'Too many requests. Wait a minute and try again.' });
  }

  const prompt = [
    `Write a 5-question multiple-choice quiz for a grade ${g} student`,
    'using only the elements in this list:',
    JSON.stringify(pool),
    'Return JSON with exactly one key "questions": an array of 5 items, each with',
    '"q" (the question), "options" (exactly 4 strings), "answer" (the index 0-3 of the correct option),',
    'and "why" (one plain sentence explaining the answer).',
    'Every question must be answerable from the list above. Vary the question styles.',
    'No markdown, no emoji.',
  ].join(' ');

  try {
    const out = await gemini(prompt);
    const questions = validate(out);
    if (!questions) throw new Error('AI returned an unexpected shape.');
    cache.set(cacheKey, questions);
    res.status(200).json({ questions, source: 'ai' });
  } catch (err) {
    sendError(res, err);
  }
}
