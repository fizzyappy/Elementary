import { useEffect, useMemo, useState } from 'react';
import ControlBar from './components/ControlBar.jsx';
import DetailPanel from './components/DetailPanel.jsx';
import ListView from './components/ListView.jsx';
import QuizModal from './components/QuizModal.jsx';
import SavesDrawer from './components/SavesDrawer.jsx';
import TableGrid from './components/TableGrid.jsx';
import { useSaves } from './hooks/useSaves.js';
import { lensScale } from './lib/palette.js';
import { loadElements } from './lib/pubchem.js';

export default function App() {
  const [elements, setElements] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(new Set());
  const [phase, setPhase] = useState(null);
  const [lens, setLens] = useState(null);
  const [view, setView] = useState('chart');
  const [selectedZ, setSelectedZ] = useState(null);
  const [grade, setGrade] = useState(4);
  const [quizOpen, setQuizOpen] = useState(false);
  const [savesOpen, setSavesOpen] = useState(false);

  const { saves, mode, isSaved, toggle } = useSaves();

  useEffect(() => {
    loadElements().then(setElements).catch((err) => setLoadError(err.message));
  }, []);

  // Esc closes whatever is on top: quiz, drawer, then the detail panel.
  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return;
      if (quizOpen) setQuizOpen(false);
      else if (savesOpen) setSavesOpen(false);
      else setSelectedZ(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [quizOpen, savesOpen]);

  const matches = useMemo(() => {
    if (!elements) return [];
    const q = query.trim().toLowerCase();
    return elements.filter((el) => {
      if (categoryFilter.size > 0 && !categoryFilter.has(el.category)) return false;
      if (phase && el.state !== phase) return false;
      if (!q) return true;
      return (
        el.name.toLowerCase().includes(q) ||
        el.symbol.toLowerCase() === q ||
        String(el.z) === q
      );
    });
  }, [elements, query, categoryFilter, phase]);

  const scale = useMemo(
    () => (elements && lens ? lensScale(elements, lens) : null),
    [elements, lens]
  );

  const selected = useMemo(
    () => (elements && selectedZ ? elements.find((e) => e.z === selectedZ) : null),
    [elements, selectedZ]
  );

  function toggleCategory(cat) {
    setCategoryFilter((prev) => {
      if (cat === null) return new Set();
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  if (loadError) {
    return (
      <div className="load-screen">
        <p>Couldn't reach PubChem to load the element data.</p>
        <p className="empty-note">{loadError}</p>
        <button className="btn btn-primary" onClick={() => location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  if (!elements) {
    return (
      <div className="load-screen" role="status">
        <p className="ai-loading">
          Loading 118 elements from PubChem<span className="dots" aria-hidden="true" />
        </p>
      </div>
    );
  }

  return (
    <div className={selected ? 'app has-panel' : 'app'}>
      <header className="header">
        <div className="brand">
          <h1>Elementary</h1>
          <p className="tagline">The periodic table, explained for every grade.</p>
        </div>
        <input
          className="search"
          type="search"
          placeholder="Search name, symbol or number…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search elements"
        />
      </header>

      <ControlBar
        lens={lens}
        onLensChange={setLens}
        scale={scale}
        categoryFilter={categoryFilter}
        onToggleCategory={toggleCategory}
        phase={phase}
        onPhaseChange={setPhase}
        view={view}
        onViewChange={setView}
        onOpenQuiz={() => setQuizOpen(true)}
        onOpenSaves={() => setSavesOpen(true)}
        savesCount={saves.length}
        shownCount={matches.length}
        totalCount={elements.length}
      />

      <main>
        {view === 'chart' ? (
          <TableGrid
            elements={elements}
            matches={matches}
            lens={lens}
            scale={scale}
            selectedZ={selectedZ}
            onSelect={setSelectedZ}
            onSeriesMarker={toggleCategory}
            isSaved={isSaved}
          />
        ) : (
          <ListView matches={matches} selectedZ={selectedZ} onSelect={setSelectedZ} />
        )}
      </main>

      <footer className="footer">
        <p>
          Element data fetched live from PubChem (NIH). Explanations and quizzes written by
          Gemini. Built as an engineering demo — see the README for architecture notes.
        </p>
      </footer>

      {selected && (
        <DetailPanel
          element={selected}
          grade={grade}
          onGradeChange={setGrade}
          onClose={() => setSelectedZ(null)}
          saved={isSaved(selected.symbol)}
          onToggleSave={toggle}
        />
      )}

      {quizOpen &&
        (matches.length >= 4 ? (
          <QuizModal pool={matches} grade={grade} onClose={() => setQuizOpen(false)} />
        ) : (
          <div className="overlay" onClick={() => setQuizOpen(false)}>
            <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>Quiz</h2>
                <button className="btn-close" onClick={() => setQuizOpen(false)} aria-label="Close">
                  ×
                </button>
              </div>
              <p className="empty-note">
                A quiz needs at least four elements on screen. Clear a filter or widen your
                search, then try again.
              </p>
            </div>
          </div>
        ))}

      {savesOpen && (
        <SavesDrawer
          saves={saves}
          mode={mode}
          elements={elements}
          onJump={(z) => {
            setSelectedZ(z);
            setSavesOpen(false);
          }}
          onRemove={toggle}
          onClose={() => setSavesOpen(false)}
        />
      )}
    </div>
  );
}
