# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

RiverLab (德州扑克训练桌) — a Chinese (zh-CN) Texas Hold'em poker training app. The user ("Hero") plays 5-handed against four rule-based bots with distinct personalities (岩石/rock, 阿凌/balanced, 火花/aggro, 老K/calling-station). Every completed hand is graded A/B/C with coaching advice, and hands are grouped into training rounds that end with a coach report. All UI copy is Chinese — keep new strings in zh-CN to match.

The app is self-hosted on a plain Node.js server (no Cloudflare). vinext builds a standalone Node bundle (`next.config.ts` sets `output: "standalone"`), persisted data lives in a local SQLite database.

## Commands

Node >= 22.13.0 required.

- `npm run dev` — dev server with HMR (vinext = Cloudflare's Next.js-compatible CLI on Vite; here targeting Node).
- `npm run build` — production build; emits the self-hosting bundle at `dist/standalone/`.
- `npm start` — run the production server (`node --disable-warning=ExperimentalWarning dist/standalone/server.js`; `node:sqlite` is still experimental). Honors `PORT` (default 3000) and `HOST` (default 0.0.0.0). Run it from the repo root so `data/` resolves.
- `npm run lint` — oxlint (type-aware, `typeCheck: true`). HEAD currently has pre-existing errors in the generated shadcn files (`components/ui/*`, `hooks/use-mobile.ts`) plus a few in `components/poker-trainer.tsx` (react-compiler EffectSetState, jsx-a11y), so a nonzero exit is not necessarily caused by your change.
- `npm run format` — oxfmt (single quotes, print width 80; config in `.oxfmtrc.json`).
- Tests: `npx tsx tests/poker.test.ts`. There is no test script or framework — it is a flat `node:assert` script that prints "Poker engine checks passed" on success. Plain `node --experimental-strip-types` cannot run it (extensionless imports); `tsx` is only a transitive dependency.

## Architecture

### Poker engine — `lib/poker.ts`

Single source of truth for all game logic: pure, framework-free, imported by the client component, API routes, and tests. Blinds 5/10, starting stack 500 (`SMALL_BLIND`/`BIG_BLIND`/`STARTING_STACK`).

- Game flow: `createReadyGame()` → `startNextHand()` (rotates dealer, auto re-buys players under a big blind, posts blinds, deals) → `applyAction()` (immutable state transition; enforces min-raise, all-ins, side pots, uncalled-bet returns).
- `bestHand()` evaluates 7-card hands; `preflopStrength()`/postflop strength feed `chooseBotDecision()`, which uses a heuristic profile map keyed by `styleKey`. Bot randomness lives only there.
- Coaching is rule-based heuristics, not an LLM: `refreshHandAdvice()` re-grades a stored `HandRecord` against its actual position/action context, `evaluatePreflopDecision()` audits preflop choices, `generateRoundCoachReport()`/`completeTrainingRound()` summarize a round (VPIP/PFR are reported as observation stats only, never penalized).
- Any change to rules, evaluation, or grading must keep `tests/poker.test.ts` passing — it simulates 120 complete hands plus targeted edge cases (split pots, rebuys, stale-record re-grading).

### UI — `components/poker-trainer.tsx`

One large `'use client'` component owns the whole app (all presentational subcomponents live in the same file). `app/page.tsx` only renders it. Game state is React state; bot turns are driven by a `setTimeout` effect that calls `chooseBotDecision` + `applyAction`. Session identity comes from `localStorage` (key `riverlab-training-session`); hands and rounds are synced to the API on change.

### Persistence — `app/api/*` + `db/*`

Two route handlers (`GET/POST /api/hands`, `GET/POST /api/rounds`) validate payloads and delegate to `db/hands.ts` / `db/rounds.ts`. Storage is **SQLite via Node's built-in `node:sqlite`** (no native dependency) through a shared connection in `db/index.ts` (`getDb()`): the database file is created on first use at `data/riverlab.db` (override with `RIVERLAB_DB_PATH`), WAL mode, schema bootstrapped inline with `CREATE TABLE IF NOT EXISTS` — there is no migration tooling. Every row stores the full serialized record in `record_json`; list endpoints parse that JSON back (typed columns exist for indexing/filtering). `saveTrainingRound` uses a guarded upsert that never lets a stale write overwrite a `completed` round.

### Build/deploy wiring

- `vite.config.ts` wires the `vinext()` plugin plus Tailwind v4 via PostCSS — nothing else.
- `next.config.ts` sets `output: "standalone"`; `vinext build` then emits `dist/standalone/` (start with `node dist/standalone/server.js`, env: `PORT`, `HOST`).
- Path alias: `@/*` → repo root (tsconfig `paths`). UI components follow shadcn conventions (`components.json`, style `base-nova`, lucide icons).
- The SQLite data directory `/data` is gitignored; back it up separately if state matters.
