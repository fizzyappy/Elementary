// Thin client for our own /api routes. Every call can fail (unconfigured
// deployment, rate limit, cold start), so errors carry enough detail for the
// UI to say something useful instead of a generic "oops".

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export function explainElement(element, grade) {
  return request('/api/explain', {
    method: 'POST',
    body: JSON.stringify({
      z: element.z,
      name: element.name,
      symbol: element.symbol,
      category: element.category,
      grade,
    }),
  });
}

export function generateQuiz(elements, grade) {
  return request('/api/quiz', {
    method: 'POST',
    body: JSON.stringify({ elements, grade }),
  });
}

export const savesApi = {
  list: () => request('/api/saves'),
  add: (symbol, name) =>
    request('/api/saves', { method: 'POST', body: JSON.stringify({ symbol, name }) }),
  remove: (id) => request(`/api/saves?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
