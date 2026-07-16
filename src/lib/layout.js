// Maps an atomic number to its cell in the standard 18-column layout.
// PubChem supplies the science; this file is pure presentation. Rows 1–7 are
// the main table, row 8 is a visual spacer, rows 9–10 hold the lanthanide and
// actinide series pulled out below the chart, as on a classroom wall poster.

export function gridPosition(z) {
  if (z === 1) return { row: 1, col: 1 };
  if (z === 2) return { row: 1, col: 18 };
  if (z <= 10) return { row: 2, col: z <= 4 ? z - 2 : z + 8 };
  if (z <= 18) return { row: 3, col: z <= 12 ? z - 10 : z };
  if (z <= 36) return { row: 4, col: z - 18 };
  if (z <= 54) return { row: 5, col: z - 36 };
  if (z <= 56) return { row: 6, col: z - 54 };
  if (z <= 71) return { row: 9, col: z - 54 }; // lanthanides: La 57 → col 3
  if (z <= 86) return { row: 6, col: z - 68 };
  if (z <= 88) return { row: 7, col: z - 86 };
  if (z <= 103) return { row: 10, col: z - 86 }; // actinides: Ac 89 → col 3
  return { row: 7, col: z - 100 };
}

// The two marker cells in the main table that point at the pulled-out rows.
export const SERIES_MARKERS = [
  { row: 6, col: 3, label: '57–71', category: 'Lanthanide' },
  { row: 7, col: 3, label: '89–103', category: 'Actinide' },
];
