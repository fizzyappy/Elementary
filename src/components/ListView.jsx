import { useMemo, useState } from 'react';

const COLUMNS = [
  { key: 'z', label: '#', numeric: true },
  { key: 'symbol', label: 'Symbol' },
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'mass', label: 'Mass (u)', numeric: true },
  { key: 'electronegativity', label: 'Electronegativity', numeric: true },
  { key: 'atomicRadius', label: 'Radius (pm)', numeric: true },
  { key: 'ionizationEnergy', label: 'Ionization (eV)', numeric: true },
  { key: 'state', label: 'State' },
  { key: 'discovered', label: 'Discovered' },
];

export default function ListView({ matches, selectedZ, onSelect }) {
  const [sortKey, setSortKey] = useState('z');
  const [sortDir, setSortDir] = useState(1);

  const sorted = useMemo(() => {
    const col = COLUMNS.find((c) => c.key === sortKey);
    return [...matches].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      // Nulls always sink to the bottom regardless of direction.
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (col.numeric) return (av - bv) * sortDir;
      return String(av).localeCompare(String(bv)) * sortDir;
    });
  }, [matches, sortKey, sortDir]);

  function handleSort(key) {
    if (key === sortKey) {
      setSortDir((d) => -d);
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  if (matches.length === 0) {
    return <p className="empty-note">No elements match. Clear a filter or change your search.</p>;
  }

  return (
    <div className="list-scroll">
      <table className="list-table">
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.key}>
                <button className="sort-btn" onClick={() => handleSort(c.key)}>
                  {c.label}
                  {sortKey === c.key && <span aria-hidden="true">{sortDir === 1 ? ' ↑' : ' ↓'}</span>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((el) => (
            <tr
              key={el.z}
              className={el.z === selectedZ ? 'row-selected' : ''}
              onClick={() => onSelect(el.z)}
            >
              {COLUMNS.map((c) => (
                <td key={c.key} className={c.numeric ? 'td-num' : ''}>
                  {el[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
