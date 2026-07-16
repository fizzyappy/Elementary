import { CATEGORIES, CATEGORY_COLORS, LENSES } from '../lib/palette.js';

export default function ControlBar({
  lens,
  onLensChange,
  scale,
  categoryFilter,
  onToggleCategory,
  phase,
  onPhaseChange,
  view,
  onViewChange,
  onOpenQuiz,
  onOpenSaves,
  savesCount,
  shownCount,
  totalCount,
}) {
  return (
    <div className="controls">
      <div className="controls-row">
        <div className="segmented" role="group" aria-label="Color the chart by">
          <button
            className={lens === null ? 'seg-btn active' : 'seg-btn'}
            onClick={() => onLensChange(null)}
          >
            Categories
          </button>
          {Object.values(LENSES).map((l) => (
            <button
              key={l.key}
              className={lens === l.key ? 'seg-btn active' : 'seg-btn'}
              onClick={() => onLensChange(l.key)}
            >
              {l.label}
            </button>
          ))}
        </div>

        <select
          className="phase-select"
          value={phase || ''}
          onChange={(e) => onPhaseChange(e.target.value || null)}
          aria-label="Filter by state at room temperature"
        >
          <option value="">All states</option>
          <option value="Solid">Solids</option>
          <option value="Liquid">Liquids</option>
          <option value="Gas">Gases</option>
        </select>

        <div className="segmented" role="group" aria-label="View">
          <button
            className={view === 'chart' ? 'seg-btn active' : 'seg-btn'}
            onClick={() => onViewChange('chart')}
          >
            Chart
          </button>
          <button
            className={view === 'list' ? 'seg-btn active' : 'seg-btn'}
            onClick={() => onViewChange('list')}
          >
            List
          </button>
        </div>

        <div className="controls-spacer" />

        <button className="btn btn-quiet" onClick={onOpenSaves}>
          Saved{savesCount > 0 ? ` (${savesCount})` : ''}
        </button>
        <button className="btn btn-primary" onClick={onOpenQuiz}>
          Quiz me
        </button>
      </div>

      <div className="controls-row legend-row">
        {lens === null ? (
          <>
            {CATEGORIES.map((cat) => {
              const active = categoryFilter.size === 0 || categoryFilter.has(cat);
              return (
                <button
                  key={cat}
                  className={active ? 'chip' : 'chip chip-off'}
                  onClick={() => onToggleCategory(cat)}
                  aria-pressed={categoryFilter.has(cat)}
                >
                  <span className="chip-swatch" style={{ background: CATEGORY_COLORS[cat] }} />
                  {cat}
                </button>
              );
            })}
            {categoryFilter.size > 0 && (
              <button className="chip chip-clear" onClick={() => onToggleCategory(null)}>
                Clear filter
              </button>
            )}
          </>
        ) : (
          <div className="gradient-legend">
            <span className="legend-value">{scale.min}</span>
            <span className="gradient-bar" aria-hidden="true" />
            <span className="legend-value">{scale.max}</span>
            <span className="legend-note">
              {LENSES[lens].unit} — {LENSES[lens].hint}. Hatched tiles have no measured value.
            </span>
          </div>
        )}
        <div className="controls-spacer" />
        <span className="shown-count" aria-live="polite">
          {shownCount === totalCount ? `${totalCount} elements` : `${shownCount} of ${totalCount} shown`}
        </span>
      </div>
    </div>
  );
}
