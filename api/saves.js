// Saved elements, persisted to an Airtable base.
// If Airtable env vars are missing the route answers 501 and the client
// falls back to localStorage, so the feature degrades instead of breaking.

const TOKEN = process.env.AIRTABLE_TOKEN;
const BASE = process.env.AIRTABLE_BASE_ID;
const TABLE = process.env.AIRTABLE_TABLE || 'Saves';

function airtableUrl(path = '') {
  return `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}${path}`;
}

async function airtable(path, options = {}) {
  const res = await fetch(airtableUrl(path), {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    throw new Error(`Airtable responded ${res.status}: ${detail}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  if (!TOKEN || !BASE) {
    return res.status(501).json({ error: 'not-configured' });
  }

  try {
    if (req.method === 'GET') {
      const data = await airtable('?sort%5B0%5D%5Bfield%5D=Symbol');
      const saves = data.records.map((r) => ({
        id: r.id,
        symbol: r.fields.Symbol,
        name: r.fields.Name,
      }));
      return res.status(200).json({ saves });
    }

    if (req.method === 'POST') {
      const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
      const { symbol, name } = body;
      if (!symbol || !name) {
        return res.status(400).json({ error: 'symbol and name are required.' });
      }
      const data = await airtable('', {
        method: 'POST',
        body: JSON.stringify({ records: [{ fields: { Symbol: symbol, Name: name } }] }),
      });
      const r = data.records[0];
      return res.status(200).json({ id: r.id, symbol: r.fields.Symbol, name: r.fields.Name });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id || new URL(req.url, 'http://x').searchParams.get('id');
      if (!id) return res.status(400).json({ error: 'id is required.' });
      await airtable(`/${id}`, { method: 'DELETE' });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Use GET, POST or DELETE.' });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
