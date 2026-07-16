import { useEffect, useRef, useState } from 'react';
import { generateQuiz } from '../lib/api.js';
import { buildLocalQuiz } from '../lib/quizLocal.js';

export default function QuizModal({ pool, grade, onClose }) {
  const [state, setState] = useState({ status: 'loading' });
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const dialogRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      // Try the AI route first; fall back to the offline generator so the
      // quiz always opens, even on an unconfigured deployment.
      try {
        const { questions } = await generateQuiz(pool, grade);
        if (alive) setState({ status: 'ready', questions, source: 'ai' });
      } catch {
        const questions = buildLocalQuiz(pool);
        if (!alive) return;
        if (questions) setState({ status: 'ready', questions, source: 'local' });
        else setState({ status: 'error' });
      }
    })();
    return () => {
      alive = false;
    };
  }, [pool, grade]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, [state.status]);

  function pick(i) {
    if (picked !== null) return;
    setPicked(i);
    if (i === state.questions[index].answer) setScore((s) => s + 1);
  }

  function next() {
    setPicked(null);
    setIndex((i) => i + 1);
  }

  function restart() {
    setIndex(0);
    setPicked(null);
    setScore(0);
  }

  const finished = state.status === 'ready' && index >= state.questions.length;
  const q = state.status === 'ready' && !finished ? state.questions[index] : null;

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Element quiz"
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>Quiz</h2>
          {state.status === 'ready' && (
            <span className="quiz-source">
              {state.source === 'ai' ? `AI quiz · grade ${grade}` : 'Practice quiz (offline)'}
            </span>
          )}
          <button className="btn-close" onClick={onClose} aria-label="Close quiz">
            ×
          </button>
        </div>

        {state.status === 'loading' && (
          <p className="ai-loading" role="status">
            Building your quiz<span className="dots" aria-hidden="true" />
          </p>
        )}

        {state.status === 'error' && (
          <p className="empty-note">
            Couldn't build a quiz from the current selection. Clear some filters and try again.
          </p>
        )}

        {q && (
          <>
            <p className="quiz-progress">
              Question {index + 1} of {state.questions.length}
            </p>
            <p className="quiz-q">{q.q}</p>
            <div className="quiz-options">
              {q.options.map((opt, i) => {
                let cls = 'quiz-option';
                if (picked !== null) {
                  if (i === q.answer) cls += ' correct';
                  else if (i === picked) cls += ' wrong';
                  else cls += ' faded';
                }
                return (
                  <button key={i} className={cls} onClick={() => pick(i)} disabled={picked !== null}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className="quiz-why">
                <p>{picked === q.answer ? 'Correct.' : 'Not quite.'} {q.why}</p>
                <button className="btn btn-primary" onClick={next}>
                  {index + 1 === state.questions.length ? 'See score' : 'Next question'}
                </button>
              </div>
            )}
          </>
        )}

        {finished && (
          <div className="quiz-done">
            <p className="quiz-score">
              {score} / {state.questions.length}
            </p>
            <p>
              {score === 5
                ? 'Perfect. You know this chart.'
                : score >= 3
                  ? 'Solid. A couple more tries and you own it.'
                  : 'Good start. Open a few elements and quiz again.'}
            </p>
            <div className="quiz-actions">
              <button className="btn btn-primary" onClick={restart}>
                Try again
              </button>
              <button className="btn btn-quiet" onClick={onClose}>
                Back to the chart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
