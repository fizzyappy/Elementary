import { useEffect, useState } from 'react';
import { explainElement } from '../lib/api.js';
import { CATEGORY_COLORS } from '../lib/palette.js';

const kelvinToC = (k) => (k == null ? null : Math.round((k - 273.15) * 10) / 10);

function Fact({ label, children }) {
  return (
    <div className="fact">
      <span className="fact-label">{label}</span>
      <span className="fact-value">{children}</span>
    </div>
  );
}

export default function DetailPanel({ element, grade, onGradeChange, onClose, saved, onToggleSave }) {
  const [ai, setAi] = useState({ status: 'idle' }); // idle | loading | done | error

  // A new element resets the explanation; a new grade just invites a re-ask.
  useEffect(() => setAi({ status: 'idle' }), [element.z]);

  async function explain() {
    setAi({ status: 'loading' });
    try {
      const data = await explainElement(element, grade);
      setAi({ status: 'done', data });
    } catch (err) {
      setAi({
        status: 'error',
        message:
          err.status === 501
            ? 'AI is not set up on this deployment yet. Add a GEMINI_API_KEY — see the README.'
            : err.message,
      });
    }
  }

  return (
    <aside className="panel" aria-label={`Details for ${element.name}`}>
      <div className="panel-head">
        <div
          className="panel-symbol"
          style={{ background: CATEGORY_COLORS[element.category] }}
        >
          <span className="panel-symbol-z">{element.z}</span>
          {element.symbol}
        </div>
        <div className="panel-title">
          <h2>{element.name}</h2>
          <span className="panel-category">{element.category}</span>
        </div>
        <button
          className={saved ? 'btn btn-star saved' : 'btn btn-star'}
          onClick={() => onToggleSave(element)}
          aria-pressed={saved}
        >
          {saved ? '★ Saved' : '☆ Save'}
        </button>
        <button className="btn-close" onClick={onClose} aria-label="Close details">
          ×
        </button>
      </div>

      <section className="grade-lens">
        <div className="grade-lens-head">
          <h3>Explain it for grade {grade}</h3>
          <input
            type="range"
            min="1"
            max="8"
            value={grade}
            onChange={(e) => onGradeChange(Number(e.target.value))}
            aria-label="Reading level, grade 1 to 8"
          />
        </div>

        {ai.status === 'idle' && (
          <button className="btn btn-primary btn-wide" onClick={explain}>
            Explain {element.name}
          </button>
        )}
        {ai.status === 'loading' && (
          <p className="ai-loading" role="status">
            Writing a grade {grade} explanation<span className="dots" aria-hidden="true" />
          </p>
        )}
        {ai.status === 'done' && (
          <div className="ai-card">
            <p>{ai.data.explanation}</p>
            <p className="ai-line">
              <strong>Wow:</strong> {ai.data.wow}
            </p>
            <p className="ai-line">
              <strong>In your world:</strong> {ai.data.everyday}
            </p>
            {ai.data.grade !== grade && (
              <button className="btn btn-quiet" onClick={explain}>
                Rewrite for grade {grade}
              </button>
            )}
          </div>
        )}
        {ai.status === 'error' && (
          <div className="ai-error">
            <p>{ai.message}</p>
            <button className="btn btn-quiet" onClick={explain}>
              Try again
            </button>
          </div>
        )}
      </section>

      <section className="facts">
        <Fact label="Atomic mass">{element.mass} u</Fact>
        <Fact label="State at 25 °C">
          {element.state}
          {element.statePredicted ? ' (predicted)' : ''}
        </Fact>
        <Fact label="Melting point">
          {element.meltingPoint != null ? `${element.meltingPoint} K · ${kelvinToC(element.meltingPoint)} °C` : '—'}
        </Fact>
        <Fact label="Boiling point">
          {element.boilingPoint != null ? `${element.boilingPoint} K · ${kelvinToC(element.boilingPoint)} °C` : '—'}
        </Fact>
        <Fact label="Density">{element.density != null ? `${element.density} g/cm³` : '—'}</Fact>
        <Fact label="Electronegativity">{element.electronegativity ?? '—'}</Fact>
        <Fact label="Atomic radius">
          {element.atomicRadius != null ? `${element.atomicRadius} pm` : '—'}
        </Fact>
        <Fact label="Ionization energy">
          {element.ionizationEnergy != null ? `${element.ionizationEnergy} eV` : '—'}
        </Fact>
        <Fact label="Electron configuration">
          <code>{element.electronConfiguration || '—'}</code>
        </Fact>
        <Fact label="Oxidation states">{element.oxidationStates || '—'}</Fact>
        <Fact label="Discovered">{element.discovered}</Fact>
      </section>
    </aside>
  );
}
