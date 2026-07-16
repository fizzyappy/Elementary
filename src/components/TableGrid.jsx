import { gridPosition, SERIES_MARKERS } from '../lib/layout.js';
import { CATEGORY_COLORS } from '../lib/palette.js';

export default function TableGrid({
  elements,
  matches,
  lens,
  scale,
  selectedZ,
  onSelect,
  onSeriesMarker,
  isSaved,
}) {
  const matchSet = new Set(matches.map((e) => e.z));

  return (
    <div className="table-scroll">
      <div className="table-grid" role="grid" aria-label="Periodic table of elements">
        {elements.map((el) => {
          const { row, col } = gridPosition(el.z);
          const dimmed = !matchSet.has(el.z);
          const selected = el.z === selectedZ;

          let bg = CATEGORY_COLORS[el.category];
          let ink = 'var(--ink)';
          let noData = false;
          if (lens) {
            const heat = scale.color(el);
            if (heat) {
              bg = heat.bg;
              ink = heat.ink;
            } else {
              noData = true;
              bg = 'var(--nodata)';
            }
          }

          const classes = [
            'tile',
            dimmed && 'tile-dim',
            selected && 'tile-selected',
            noData && 'tile-nodata',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={el.z}
              className={classes}
              style={{ gridRow: row, gridColumn: col, '--tile-bg': bg, '--tile-ink': ink }}
              onClick={() => onSelect(el.z)}
              aria-label={`${el.name}, element ${el.z}, ${el.category}`}
            >
              <span className="tile-z">{el.z}</span>
              {isSaved(el.symbol) && <span className="tile-star" aria-hidden="true">★</span>}
              <span className="tile-symbol">{el.symbol}</span>
              <span className="tile-name">{el.name}</span>
            </button>
          );
        })}

        {SERIES_MARKERS.map((m) => (
          <button
            key={m.label}
            className="tile tile-marker"
            style={{ gridRow: m.row, gridColumn: m.col }}
            onClick={() => onSeriesMarker(m.category)}
            aria-label={`Elements ${m.label}, the ${m.category.toLowerCase()} series`}
          >
            <span className="marker-label">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
