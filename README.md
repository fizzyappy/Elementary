# Elementary

An interactive periodic table that explains every element at the reading level you pick, from grade 1 to grade 8.

**Live demo:** _(add your Vercel URL here)_

Built as the technical assessment for the Experihub internship (Option B). The brief asked for a public API, a usable interface and one interactive feature. I treated it as a feature spec for the actual product instead: if Experihub shipped a periodic table to a 10-year-old tomorrow, this is roughly what v0 should look like.

## What it does

- Renders all 118 elements, fetched live from PubChem's periodic table API.
- Search by name, symbol or atomic number. Filter by category or state. Sortable list view.
- **Property lenses** — recolor the entire chart by electronegativity, atomic radius or ionization energy to see periodic trends at a glance.
- **Grade Lens** — pick a grade from 1 to 8 and Gemini rewrites the element's explanation at that reading level, with one "wow" fact and one everyday connection.
- **Quiz me** — generates a 5-question quiz from whatever elements are currently on screen. Falls back to a deterministic offline generator if the AI route is down or unconfigured, so the button always works.
- **Saved elements** — persisted to Airtable when configured, localStorage otherwise. The UI tells you which mode is live.

## Stack

React 18 + Vite on the frontend, Node serverless functions (Vercel) on the backend, PubChem for data, Gemini for language, Airtable for persistence. No UI framework, no state library — the app doesn't need them, and every dependency is one more thing to explain in a code review.

## Architecture

```
 Browser ──────────────► PubChem PUG REST (public, CORS-enabled, no secrets)
    │
    ├──► /api/explain ──► Gemini   (grade-level explanations)
    ├──► /api/quiz ─────► Gemini   (quiz generation, validated server-side)
    └──► /api/saves ────► Airtable (saved elements)
```

The rule that decides what goes through the backend: **proxy only what holds a secret.** PubChem is public and CORS-enabled, so the browser talks to it directly and caches the payload in localStorage for a week — reloads are instant and we stay far inside PubChem's rate limits. Gemini and Airtable calls carry keys, so they live behind serverless routes with per-instance response caching and a token-bucket rate limit guarding the free-tier quota.

## Decisions worth explaining

- **AI output is never trusted.** Both AI routes require strict JSON (shape-validated server-side). If validation fails, the quiz route returns an error and the client switches to the offline generator. A demo shouldn't depend on a third party being in a good mood.
- **Explanations are cached per (element, grade).** They're deterministic enough that regenerating them wastes quota and adds latency.
- **The layout map is code, not data.** PubChem supplies the science; the 18-column grid position of each element is presentation, computed from the atomic number in ~15 lines.
- **Graceful degradation over hard requirements.** No Gemini key → explanations explain how to add one, quizzes go offline. No Airtable → saves go to localStorage. `npm run dev` without any env vars still gives you a fully working table.
- **Accessibility is table stakes for an education product.** Every tile is a real button with a label, focus states are visible, reduced motion is respected, and the body face is Atkinson Hyperlegible — a typeface designed for early readers.

## Run it locally

```bash
npm install
npm run dev          # table, lenses, search, offline quiz — no keys needed
```

For the AI and Airtable routes, use the Vercel dev server:

```bash
cp .env.example .env # add your keys
npx vercel dev
```

## Environment variables

| Variable           | Required | Purpose                                       |
| ------------------ | -------- | --------------------------------------------- |
| `GEMINI_API_KEY`   | no       | Grade Lens explanations and AI quizzes         |
| `GEMINI_MODEL`     | no       | Defaults to `gemini-2.5-flash`                 |
| `AIRTABLE_TOKEN`   | no       | Persistent saves (falls back to localStorage)  |
| `AIRTABLE_BASE_ID` | no       | Airtable base containing a `Saves` table       |
| `AIRTABLE_TABLE`   | no       | Defaults to `Saves`                            |

The Airtable table needs two single-line text fields: `Symbol` and `Name`.

## If this were a real feature

Where I'd take it next, in order: per-student profiles so the grade level follows the learner instead of the session; quiz results written back to Airtable to give teachers a mastery view; a compounds mode using PubChem's compound endpoints ("what do H and O make?"); and streaming the Gemini responses so explanations appear word by word for younger kids.
