// Color is the interface here, so it is defined in one place.
// Category colors are chalk-bright pastels that keep dark text readable;
// property lenses swap the whole chart to a single sequential scale so
// magnitude reads at a glance.

export const CATEGORY_COLORS = {
  'Alkali metal': '#F2A0A0',
  'Alkaline earth metal': '#F6C177',
  'Transition metal': '#9FC6E8',
  'Post-transition metal': '#ACC7B4',
  Metalloid: '#CBBFEA',
  Nonmetal: '#A9DCC3',
  Halogen: '#F5E27D',
  'Noble gas': '#D8B4E2',
  Lanthanide: '#F5B8D0',
  Actinide: '#E2A98F',
};

export const CATEGORIES = Object.keys(CATEGORY_COLORS);

export const LENSES = {
  electronegativity: {
    key: 'electronegativity',
    label: 'Electronegativity',
    unit: 'Pauling scale',
    hint: 'how strongly an atom pulls on shared electrons',
  },
  atomicRadius: {
    key: 'atomicRadius',
    label: 'Atomic radius',
    unit: 'pm',
    hint: 'how big the atom is',
  },
  ionizationEnergy: {
    key: 'ionizationEnergy',
    label: 'Ionization energy',
    unit: 'eV',
    hint: 'energy needed to pull one electron away',
  },
};

const STOPS = ['#F3F0FB', '#8E7BE0', '#2E2060'];

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

// t in [0, 1] → color along the three-stop scale.
export function heatColor(t) {
  const stops = STOPS.map(hexToRgb);
  const [r, g, b] =
    t <= 0.5 ? mix(stops[0], stops[1], t * 2) : mix(stops[1], stops[2], (t - 0.5) * 2);
  return `rgb(${r}, ${g}, ${b})`;
}

// Returns a function element → {bg, ink, t} for the chosen lens,
// scaled to the min/max actually present in the data.
export function lensScale(elements, key) {
  const values = elements.map((e) => e[key]).filter((v) => v != null);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return {
    min,
    max,
    color(el) {
      const v = el[key];
      if (v == null) return null; // caller renders a "no data" tile
      const t = (v - min) / span;
      return { bg: heatColor(t), ink: t > 0.55 ? '#F6F4FF' : '#22302B', t };
    },
  };
}
