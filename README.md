# UW Course Builder

Static planner for University of Waterloo **Faculty of Mathematics Honours majors (2026/27 calendar)**: the
Bachelor of Computer Science with its eight CS specializations, the Bachelor of Mathematics majors, and Computing
and Financial Management. It audits a plan against the major and degree-level requirements, classifies every
course as *must take / required (one of) / counts toward / free elective / blocked*, and validates a term-by-term
plan (co-op work terms included). Completed terms can be imported from a Quest Unofficial Transcript or
Unofficial Grade Report (PDF or pasted text), parsed entirely in the browser.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · TanStack Router/Table/Virtual · zustand ·
dnd-kit · React Flow + ELK (web worker) · Vitest · Playwright.

## Data

| Source | Used for | Key |
|---|---|---|
| Kuali catalog API behind the official Undergraduate Calendar (`uwaterloocm.kuali.co`, catalog `67e557ed6ed2fe2bd3a38956`) | courses, prerequisites/antirequisites, program pages | none |
| [UW Open Data API v3](https://openapi.data.uwaterloo.ca/api-docs/) | offering history of past terms (F/W/S), faculty of each course | `UW_API_KEY` |

The snapshot lives in `public/data/catalog.json` (committed). Requirements are encoded in `src/requirements/`
(`majors.ts` is the registry; degree-level rules in `bcs.ts`, `bmath.ts`, `math-faculty.ts`) and cross-checked
against the major, degree-level and specialization pages by `pnpm data:validate`. New majors start from
`pnpm tsx scripts/gen-program.ts <kuali-pid> <id> "<short name>"`, which drafts a module from the calendar
page; rules it cannot express are left as `MANUAL:` notes for review.

## Commands

```sh
pnpm install
pnpm dev              # http://localhost:5173
pnpm test             # parser + engine unit tests
pnpm build            # vite build + type check
pnpm test:e2e         # Playwright smoke test against the production build

# Refresh the data snapshot (raw responses cached in data/raw/)
echo UW_API_KEY=... > .env.local
pnpm data             # kuali → opendata → build-dataset → validate
```

## Deploy

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on push to `main`, and refreshes the data
weekly. Add the Open Data key as the repository secret `UW_API_KEY`; it is only used at build time and never
shipped to the browser. The app uses hash routing, so any static host works.

## Caveats

Unofficial planning aid — the Undergraduate Calendar and academic advisors take precedence. Grades, averages and
free-text requisites are flagged for manual checking, not evaluated. Calendar rules the requirement model cannot
express exactly are approximated and marked "Check manually" in the audit. Sharing one course between two
specializations is allowed by the engine but not verified against the calendar. Problems can be reported from the
bug icon in the header or on each audit card (GitHub issue forms: data, requirement, algorithm, UI, feature).

Course requirements follow the 2026/27 calendar. For the BCS major the non-math elective rule is selectable: the 2026/27
Elective Requirement (by faculty, ≥1.0 unit at the 200-level) or the Breadth & Depth requirement of 2025/26 and
earlier calendars (Humanities / Social / Pure / Pure-or-Applied Sciences by subject, plus depth). By default it
follows the 1A term. "Substantial math or CS content" exclusions for Breadth & Depth are not detected.
