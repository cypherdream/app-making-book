# app-making-book — Learn (standalone project)

This is the real, buildable version of the learning app — a proper Vite + React
project instead of a single-file browser artifact. It teaches the actual
`app-making-book` repository (Android/Kotlin + Node/Express/Prisma/JWT), lesson
by lesson, tied to real files.

## Why this exists

The chat-based artifact version could only ever be one file, and could only persist
data through the browser's artifact storage API (tied to your Claude.ai account, not
portable). This project fixes both:

- **Multiple files**, organized by responsibility (see structure below)
- **Real `localStorage` persistence** (this is a normal web page now, not a sandboxed
  artifact, so `localStorage` works as expected)
- **A real, runnable test suite** (Vitest) — something the artifact preview could
  never execute
- **A clean seam for a future backend** — see `src/services/storage.js`

## Setup

```bash
npm install
npm run dev       # http://localhost:5173
npm run test      # runs the Vitest suite
npm run build     # production build to dist/
```

## Project structure

```
src/
├── App.jsx                    Wires everything together
├── main.jsx                   Entry point
├── components/                Presentational pieces (Sidebar, LessonView, Quiz, ...)
├── hooks/                     usePersistentProgress, useKeyboardShortcuts, useSwipe
├── services/
│   └── storage.js             localStorage today; swap this for an API client later
├── data/
│   ├── lessons/*.json         One JSON file per lesson — edit content without touching code
│   ├── lessons.js             Loads the JSON files, defines achievements
│   ├── tracks.js               Android/Backend color scheme
│   └── beyondRepo.js          Honest notes on topics NOT in this repo
└── utils/
    ├── highlight.jsx          Small hand-rolled syntax highlighter
    └── streak.js              Pure function for daily-streak math (fully unit tested)
```

## Adding a lesson

Add a new `src/data/lessons/your-lesson.json` file matching the shape of the
existing ones, then import and add it to the `LESSONS` array in
`src/data/lessons.js`. No other file needs to change.

## Cloud sync (new)

`src/services/storage.js` now actually talks to a backend — specifically the
`backend/` API from the main `app-making-book` repo, which already has JWT auth,
bcrypt password hashing, and rate limiting.

- **Guest mode** (no account): works exactly as before, `localStorage` only.
- **Signed in**: progress reads/writes go to `PUT/GET /api/progress` (a new
  authenticated endpoint backed by a `Progress` table — one JSON blob per user),
  with `localStorage` kept as a fast cache and offline fallback.
- **Conflict handling**: last write wins. This is intentionally simple — true
  multi-device conflict resolution (merging concurrent edits) needs versioning
  this project doesn't have yet.

To try it: run the backend (`cd backend && npm run dev`), copy `.env.example` to
`.env` in this project, then `npm run dev` here. Use the "Sign in to sync" button
in the sidebar.

## Why this counts as real cloud sync and not a mock

- The `Progress` Prisma model and `/api/progress` routes are real, type-checked
  TypeScript, added to `backend/src/routes/progressRoutes.ts` and
  `backend/prisma/schema.prisma`.
- `requireAuth` middleware protects the endpoint — one user can never read or
  write another's progress via a guessed id, because the userId comes from the
  verified JWT, not the request.
- If the backend is unreachable, sync fails silently to the local cache instead
  of losing data or throwing an error the user can't do anything about.



## What's genuinely next (in order)

1. ~~Backend + cloud sync~~ — done (see above).
2. **Admin panel** — a simple authenticated page that lets you add/edit the JSON
   lesson files through a form instead of hand-editing them.
3. **Certificates, richer analytics, discussion** — all reasonable additions once
   there's a backend and real user accounts to attach them to.
4. **httpOnly cookie sessions** instead of a token in `localStorage`, for better
   XSS resistance — requires the backend to set cookies itself, which it
   currently doesn't.

## What this project intentionally does not include yet

- User accounts / login — no backend endpoint exists here to authenticate against
- Payments — needs a payment processor and server-side verification
- Video/audio lessons — needs media hosting
- A live Kotlin compiler — no browser runtime exists for Kotlin; a JS-only sandboxed
  playground is feasible as a future addition

## What's new in this pass

- **Real dark/light theme** — previously the toggle existed but changed nothing;
  every color was hardcoded. Now backed by CSS custom properties in `index.css`,
  actually switching backgrounds/text/borders. Code blocks intentionally stay
  dark in both themes (like most editors). One known limitation: this was
  verified by syntax-checking the JS with esbuild, not by rendering it in a real
  browser (no Tailwind/Vite build available in the sandbox this was built in) —
  worth a visual check before you trust it fully.
- **Certificates**: client-side Canvas-generated completion certificate,
  downloadable as PNG, zero backend cost.
- **Track filters** in the sidebar (All/Android/Backend).
- **Rule-based "recommended next lesson"** — see `src/utils/recommend.js` for why
  this isn't ML-based (no usage data yet to train on).
- **Self-hosted analytics wiring**: lesson views/completions and crash reports
  now actually call `src/services/analytics.js`.

## Accessibility fixes in this pass

- **Modal focus trapping** (`src/hooks/useFocusTrap.js`): previously a keyboard
  user could Tab straight out of an open modal (AuthModal, ShortcutsModal) into
  the page behind it. Now Tab/Shift+Tab cycle within the modal, and focus
  returns to whatever triggered it on close.
- Fixed a couple of remaining hardcoded `text-white` instances the first
  contrast pass missed (in `AuthModal.jsx`'s input fields).

## What's new in this pass

- **Fixed a real, serious bug**: `authService.js` was calling the backend's
  login endpoint expecting `{ token, user }`, but the backend has returned
  `{ accessToken, refreshToken, user }` (or a 2FA challenge) since an earlier
  pass — meaning login was silently broken on the frontend. Rewrote
  `authService.js`, `AuthModal.jsx` (now handles the 2FA code-entry step),
  and `storage.js`/`adminApi.js` (now auto-refresh an expired access token
  instead of failing) to match the real backend contract.
- **i18n scaffolding**: real `i18next` setup, English + Swahili translations
  for UI chrome (search, buttons, status text) — wired into `Sidebar.jsx` as
  the proof-of-pattern component. Lesson content itself is not translated —
  see backend README for why.
- **Visual admin dashboard** (`src/pages/AdminDashboard.jsx`): stat cards,
  an uptime/latency chart (recharts), rate-limit breakdown, and user ban/unban
  — the actual page for data that previously only existed as raw JSON from
  `GET /api/admin/dashboard`. Visible only to accounts with `isAdmin: true`.
- **Automated accessibility testing**: `e2e/accessibility.spec.js` runs
  axe-core (the same engine behind Lighthouse) against the default view, the
  auth modal, and light theme — real automated results, not just my manual
  contrast pass from earlier turns.
