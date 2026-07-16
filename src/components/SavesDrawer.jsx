export default function SavesDrawer({ saves, mode, elements, onJump, onRemove, onClose }) {
  const bySymbol = new Map(elements.map((e) => [e.symbol, e]));

  return (
    <div className="overlay" onClick={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Saved elements"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>Saved elements</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close saved elements">
            ×
          </button>
        </div>

        <p className="saves-mode">
          {mode === 'airtable' ? 'Synced to Airtable' : 'Saved on this device'}
        </p>

        {saves.length === 0 ? (
          <p className="empty-note">
            Nothing saved yet. Open an element and press Save to keep it here.
          </p>
        ) : (
          <ul className="saves-list">
            {saves.map((s) => {
              const el = bySymbol.get(s.symbol);
              return (
                <li key={s.id}>
                  <button className="saves-jump" onClick={() => el && onJump(el.z)}>
                    <b>{s.symbol}</b> {s.name}
                  </button>
                  <button
                    className="btn-close"
                    onClick={() => el && onRemove(el)}
                    aria-label={`Remove ${s.name} from saved`}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </div>
  );
}
