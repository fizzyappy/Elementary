// Deterministic quiz generator built from the element data itself.
// It runs when the AI route is unconfigured, rate-limited or down, so the
// quiz button always works — a demo should never depend on a third party
// being in a good mood.

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const pick = (arr, n) => shuffle(arr).slice(0, n);

// Each template returns a question or null if the pool can't support it.
const TEMPLATES = [
  function symbolQuestion(pool) {
    const opts = pick(pool, 4);
    if (opts.length < 4) return null;
    const target = opts[0];
    return {
      q: `Which element has the symbol ${target.symbol}?`,
      options: shuffleWithAnswer(opts.map((e) => e.name), target.name),
      why: `${target.symbol} stands for ${target.name}.`,
    };
  },
  function numberQuestion(pool) {
    const opts = pick(pool, 4);
    if (opts.length < 4) return null;
    const target = opts[0];
    return {
      q: `Which element has atomic number ${target.z}?`,
      options: shuffleWithAnswer(opts.map((e) => e.name), target.name),
      why: `${target.name} has ${target.z} protons, so its atomic number is ${target.z}.`,
    };
  },
  function categoryQuestion(pool) {
    const byCat = {};
    pool.forEach((e) => (byCat[e.category] = [...(byCat[e.category] || []), e]));
    const cats = Object.keys(byCat).filter((c) => byCat[c].length >= 1);
    if (cats.length < 2) return null;
    const cat = pick(cats, 1)[0];
    const target = pick(byCat[cat], 1)[0];
    const wrong = pick(pool.filter((e) => e.category !== cat), 3);
    if (wrong.length < 3) return null;
    return {
      q: `Which of these is a ${cat.toLowerCase()}?`,
      options: shuffleWithAnswer([target, ...wrong].map((e) => e.name), target.name),
      why: `${target.name} belongs to the ${cat.toLowerCase()} group.`,
    };
  },
  function electronegativityQuestion(pool) {
    const withEn = pool.filter((e) => e.electronegativity != null);
    if (withEn.length < 4) return null;
    const opts = pick(withEn, 4);
    const target = [...opts].sort((a, b) => b.electronegativity - a.electronegativity)[0];
    return {
      q: 'Which of these elements pulls hardest on shared electrons (highest electronegativity)?',
      options: shuffleWithAnswer(opts.map((e) => e.name), target.name),
      why: `${target.name} has the highest electronegativity of the four (${target.electronegativity}).`,
    };
  },
  function stateQuestion(pool) {
    const gases = pool.filter((e) => e.state === 'Gas');
    const nonGases = pool.filter((e) => e.state !== 'Gas');
    if (gases.length < 1 || nonGases.length < 3) return null;
    const target = pick(gases, 1)[0];
    const wrong = pick(nonGases, 3);
    return {
      q: 'Which of these elements is a gas at room temperature?',
      options: shuffleWithAnswer([target, ...wrong].map((e) => e.name), target.name),
      why: `${target.name} is a gas in its standard state.`,
    };
  },
];

function shuffleWithAnswer(options, answerText) {
  const shuffled = shuffle(options);
  return { list: shuffled, answer: shuffled.indexOf(answerText) };
}

export function buildLocalQuiz(pool) {
  const questions = [];
  const templates = shuffle(TEMPLATES);
  let i = 0;
  while (questions.length < 5 && i < templates.length * 3) {
    const t = templates[i % templates.length];
    const q = t(pool);
    i += 1;
    if (!q) continue;
    if (questions.some((existing) => existing.q === q.q)) continue;
    questions.push({
      q: q.q,
      options: q.options.list,
      answer: q.options.answer,
      why: q.why,
    });
  }
  return questions.length === 5 ? questions : null;
}
