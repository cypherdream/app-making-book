# app-making-book — everything in one place

Three pieces of one project, in one zip:

android-app/        Kotlin Android app (MVVM, Hilt, Room, Retrofit)
backend/             Node/TypeScript API (Express, Prisma, JWT auth, Socket.io)
web-learning-app/    React/Vite app that teaches this codebase, with real login + cloud sync

Each folder has its own README with exact setup steps. Start with backend/ —
both the Android app and the web app talk to it.

## Security, admin, and commercial features (this pass)

Real code, verified to compile/bundle — see backend/README.md and
web-learning-app/README.md for full detail:

- Security hardening: helmet, HTTPS enforcement, account lockout, short-lived
  tokens with revocation, zod validation, HPP protection, body size limits
- Admin dashboard + lesson CMS + audit logs (`backend/src/routes/adminRoutes.ts`)
- Self-hosted analytics and crash reporting (no third-party SaaS)
- Full PWA: manifest, offline-capable service worker, installable
- Web Push notifications (free, VAPID-based, no Firebase)
- Stripe payment integration (checkout, billing portal, webhook) — code is real,
  inactive until you add your own Stripe keys
- Docker + docker-compose for the whole stack, plus `render.yaml` for one-click
  free-tier deploy
- Playwright E2E tests, WCAG contrast fixes (computed and verified, not assumed)
- Rule-based lesson recommendations, track filters, richer search

Deliberately not built: a real ML recommendation engine (no usage data to train
on yet), full professional translations (needs human translators), connected
error-monitoring dashboard (needs your own free Sentry account).

## Is this commercial-ready?

Closer than it was, but the remaining gap is now mostly in the **Business**
column, not the code:

**Done, real, verified (esbuild-checked)**: 2FA, session/device management,
account deletion + GDPR export, secret rotation, automated dependency
scanning (Dependabot + `npm audit` in CI), Redis caching with graceful
fallback, a DB-backed job queue, load testing, backup/restore automation,
self-hosted + external monitoring, admin dashboard + lesson CMS + audit logs,
Stripe integration code, a real (not fake) dark/light theme, modal focus
trapping, WCAG contrast fixes. See `backend/README.md` and
`web-learning-app/README.md` for the full list per pass.

**Still needed, and it's on you, not more code**:
- A real domain (~$10-15/year — the one hosting cost that isn't free anywhere)
- A lawyer's actual review of `legal/PRIVACY_POLICY_DRAFT.md` and
  `legal/TERMS_OF_SERVICE_DRAFT.md` — honest, codebase-accurate drafts,
  not legal advice
- Your own Stripe, Resend/email, and Upstash accounts if you want payments,
  email verification, and caching actually turned on
- A real penetration test if you want more than automated scanning
- Deciding what "acceptable downtime" and "acceptable data loss" mean for your
  business — see `MONITORING.md`'s disaster-recovery section

None of that last group is solvable by writing more code — they're business
and legal decisions that only make sense once real users exist.

## Production polish (this pass)

- `LICENSE` (proprietary by default — see the file for why, and how to switch
  to MIT/Apache/AGPL if you actually want this open source),
  `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`
- `docs/ARCHITECTURE.md` — real Mermaid diagrams (system overview, auth flow
  including 2FA, a lesson-completion data flow), renders directly on GitHub
- `docs/SECURITY_ASSESSMENT.md` — an honest self-assessment of what's
  implemented vs. what needs a real human (business logic, authorization
  edge cases) rather than a fake "audit passed" report
- Real interactive API docs at `/api/docs` (Swagger UI, from `docs/openapi.yaml`)
- API versioning (`/api/v1/*`, with `/api/*` kept as an alias, not a duplicate
  implementation)
- Self-hosted Prometheus-format metrics at `/metrics` (token-protected)
- ESLint + Prettier in both projects, husky + lint-staged + commitlint
  (Conventional Commits enforced) at the repo root
- Weekly OWASP ZAP scan + gitleaks secret scanning, on top of the existing
  Dependabot + `npm audit`
- Onboarding tour and a real billing page (Stripe Checkout + Customer Portal,
  wired to the payment routes built earlier)
- Automated accessibility testing (axe-core via Playwright) and i18n
  scaffolding (English + Swahili UI chrome)

**Two more real bugs found and fixed while building this, not invented**:
the login response never included `isPremium`, so the new billing UI would
have shown the wrong plan for every premium user; and `commitlint.config.js`
used ESM `export default` syntax in a CommonJS-context root package.json,
which would have failed on the first commit.

## App Builder engine (new direction, proof of concept)

A working prototype of a different product built on top of this codebase: an
AI-assisted app generator (prompt → JSON → real generated code), not an
extension of the learning platform. Full plan and honest scope boundaries in
`backend/src/builder/README.md` — short version:

- **Real and tested**: `POST /api/builder/interpret` (Groq's free tier turns
  a prompt into a validated JSON spec — the LLM is schema-constrained and can
  never output code) and `POST /api/builder/generate` (deterministically
  turns that spec into a downloadable zip of real Prisma models, Express+zod
  CRUD routes, and React components). I ran this end-to-end during
  development against a school-app example and independently verified the
  actual generated files compile against this backend's real
  `prisma.ts`/`middleware/auth.ts` — see the builder README for the output.
- **Honest roadmap for the rest**: the original spec's 20 templates, 14
  modules, Android/Next.js/NestJS generators, asset generation, plugin SDK,
  and marketplace are a multi-quarter effort, not something to fake as done
  in one pass. Phased breakdown with effort estimates in
  `backend/src/builder/README.md`.

## Deliberately not built this pass, and why

- **GraphQL API** — would mean maintaining a second, parallel API surface
  indefinitely. That's a real architecture commitment, not a quick add; worth
  doing only if you have a concrete reason REST isn't working.
- **Kubernetes manifests** — this whole project is architected around free
  single-instance hosting (see `DEPLOY_FREE.md`). K8s manifests would be
  premature until you've actually outgrown that, at which point they should
  be written against your real target cluster, not speculatively now.
- **Deeper Android features** (offline sync improvements, widgets, more
  animations) — I don't have an Android SDK/emulator in this environment to
  verify changes compile, and the Android module hasn't been touched since
  earlier in this conversation. I'd want to confirm the existing code still
  builds in Android Studio before adding more to it blind.
- **Referral system** — a real business feature that needs product decisions
  (reward structure, fraud prevention) before it's just a coding task.

## What's needed before this can be a commercial launch (not code — real-world steps)

1. Deploy backend/ somewhere real (Render, Railway, Fly.io) with a paid Postgres
   database and a real domain + HTTPS certificate.
2. Google Play Developer account ($25 one-time) and/or Apple Developer account
   ($99/year) — required to publish android-app/, and to sign it with a real
   release certificate instead of a debug key.
3. A Stripe (or similar) account with your real business/bank details, if you
   plan to charge for anything.
4. A lawyer or at least careful self-review of Privacy Policy / Terms of
   Service against your actual jurisdiction and what data you actually collect.
5. Point android-app/'s release BASE_URL and web-learning-app/'s VITE_API_URL
   at the real deployed backend from step 1, and remove
   android:usesCleartextTraffic from AndroidManifest.xml once it's https://.

None of that can be done by writing more code — it needs your accounts, your
business identity, and your decisions about what to charge and where to host.
