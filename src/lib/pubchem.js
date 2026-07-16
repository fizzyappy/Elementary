// All element data comes from PubChem's periodic table endpoint at runtime.
// It is public, unauthenticated and CORS-enabled, so the browser fetches it
// directly; proxying it through our backend would add latency for nothing.
// The payload rarely changes, so it is cached in localStorage for a week —
// reloads are instant and we stay well inside PubChem's rate limits.

const SOURCE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON';
const CACHE_KEY = 'elementary:elements:v1';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const num = (s) => (s === '' || s == null ? null : Number(s));

function normalize(payload) {
  const cols = payload.Table.Columns.Column;
  return payload.Table.Row.map(({ Cell }) => {
    const raw = Object.fromEntries(cols.map((c, i) => [c, Cell[i]]));
    return {
      z: Number(raw.AtomicNumber),
      symbol: raw.Symbol,
      name: raw.Name,
      mass: num(raw.AtomicMass),
      electronConfiguration: raw.ElectronConfiguration,
      electronegativity: num(raw.Electronegativity),
      atomicRadius: num(raw.AtomicRadius),
      ionizationEnergy: num(raw.IonizationEnergy),
      electronAffinity: num(raw.ElectronAffinity),
      oxidationStates: raw.OxidationStates,
      state: raw.StandardState.replace('Expected to be a ', ''),
      statePredicted: raw.StandardState.startsWith('Expected'),
      meltingPoint: num(raw.MeltingPoint),
      boilingPoint: num(raw.BoilingPoint),
      density: num(raw.Density),
      category: raw.GroupBlock,
      discovered: raw.YearDiscovered,
    };
  });
}

export async function loadElements() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.at < MAX_AGE_MS && cached.elements?.length === 118) {
      return cached.elements;
    }
  } catch {
    // A broken cache entry just means we fetch fresh.
  }

  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`PubChem responded ${res.status}`);
  const elements = normalize(await res.json());

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), elements }));
  } catch {
    // Storage full or blocked — caching is an optimization, not a requirement.
  }
  return elements;
}
