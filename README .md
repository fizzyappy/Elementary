# Elementary

**Live:** https://elementary-iota.vercel.app/ · **Repo:** github.com/fizzyappy/Elementary

An interactive periodic table that explains every element at the reading level you pick, from grade 1 to grade 8. Built for the Experihub technical assessment (Option B).

## Built with

- **JavaScript** (ES modules) across the whole stack
- **React 18 + Vite** — component UI and build tooling
- **Node.js** — serverless API functions in `/api`; the layer that holds every secret key
- **REST APIs** — live element data from PubChem (NIH); Airtable REST for persistence
- **Google Gemini (AI API)** — grade-level explanations and quiz generation, validated server-side with an offline fallback
- **Airtable** — saved-elements store (falls back to localStorage when unconfigured)
- **Git + GitHub** — version control
- **Vercel** — serverless hosting, auto-redeploys on every push

## What it does

- Renders all 118 elements, fetched live from PubChem's periodic table API
- Search by name, symbol or atomic number; filter by category or state; sortable list view
- **Property lenses** — recolor the whole chart by electronegativity, atomic radius or ionization energy to see periodic trends at a glance
- **Grade Lens** — pick a grade from 1 to 8 and Gemini rewrites the element's explanation at that level, with one "wow" fact and one everyday connection
- **Quiz me** — generates a 5-question quiz from the elements currently on screen; switches to a deterministic offline generator if the AI is down or unconfigured, so the button always works
- **Saved elements** — synced to Airtable when configured, localStorage otherwise; the UI shows which mode is live

## Architecture

```
 Browser ──────────────► PubChem PUG REST (public, CORS-enabled, no secrets)
    │
    ├──► /api/explain ──► Gemini   (grade-level explanations)
    ├──► /api/quiz ─────► Gemini   (quiz generation, validated server-side)
    └──► /api/saves ────► Airtable (saved elements)
```

One rule decides what goes through the backend: **proxy only what holds a secret.** PubChem is public and CORS-enabled, so the browser fetches it directly and caches the payload in localStorage for a week — proxying it would add latency for no security gain. Gemini and Airtable calls carry keys, so they run behind Node serverless routes with per-instance response caching and a token-bucket rate limit guarding the free-tier quota.

## Decisions worth explaining

- **AI output is never trusted.** Both AI routes force JSON output and validate the exact shape server-side. If validation fails, the quiz falls back to the offline generator — a demo shouldn't depend on a third party being in a good mood.
- **The layout map is code, not data.** PubChem supplies the chemistry; each element's position in the 18-column grid is a ~15-line function of its atomic number, spot-checked against 13 known positions.
- **Graceful degradation over hard requirements.** No Gemini key → quizzes go offline and explanations say how to add one. No Airtable → saves use localStorage. `npm run dev` with zero env vars still gives a fully working table.
- **Accessibility is table stakes for an education product.** Every tile is a real button with a label, focus states are visible, reduced motion is respected, and the body font (Atkinson Hyperlegible) is designed for early readers.

## Run locally

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

| Variable           | Required | Purpose                                        |
| ------------------ | -------- | ---------------------------------------------- |
| `GEMINI_API_KEY`   | no       | Grade Lens explanations and AI quizzes          |
| `GEMINI_MODEL`     | no       | Defaults to `gemini-3.5-flash`                  |
| `AIRTABLE_TOKEN`   | no       | Persistent saves (falls back to localStorage)   |
| `AIRTABLE_BASE_ID` | no       | Airtable base containing a `Saves` table        |
| `AIRTABLE_TABLE`   | no       | Defaults to `Saves`                             |

The Airtable table needs two single-line text fields: `Symbol` and `Name`.

## If this were a real feature

Where I'd take it next, in order: per-student profiles so the grade level follows the learner instead of the session; quiz results written back to Airtable for a teacher mastery view; a compounds mode using PubChem's compound endpoints ("what do H and O make?"); and streaming the Gemini responses so explanations appear word by word for younger kids.
