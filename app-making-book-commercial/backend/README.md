# Backend — Node.js + Express + Prisma + Socket.io + JWT auth

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

Clicking that reads `render.yaml` in this folder automatically — you'll still
need to paste in your Neon `DATABASE_URL` and (optionally) other secrets in
Render's dashboard afterward; see `DEPLOY_FREE.md` at the repo root for the
full walkthrough.

## Setup

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET at minimum
npx prisma generate
npx prisma migrate dev --name init
npm run dev                 # http://localhost:3000
```

Optional features (each is a no-op until configured):
- Web Push: `npm run generate-vapid-keys`, put the output in `.env`.
- Stripe payments: create a free Stripe account (test mode), put your keys in `.env`.
- Error monitoring: set `SENTRY_DSN` and see the hook point in `src/middleware/errorHandler.ts`.

Promote your first admin user (there's no public "become admin" flow, on purpose):
```bash
npx ts-node prisma/seedAdmin.ts you@example.com
```

## API reference

| Endpoint | Method | Auth | Notes |
|---|---|---|---|
| `/health` | GET | — | Server status |
| `/api/auth/register` | POST | — | `{ name, email, password }` |
| `/api/auth/login` | POST | — | Returns `{ accessToken, refreshToken, user }` |
| `/api/auth/refresh` | POST | — | Exchange a refresh token for a new access token |
| `/api/auth/logout-all` | POST | Bearer | Revokes every issued token immediately |
| `/api/progress` | GET/PUT | Bearer | Cloud-synced learning-app state |
| `/api/users`, `/api/logs` | GET/POST | mixed | See inline route comments |
| `/api/admin/*` | GET/POST/PUT/DELETE | Bearer + admin | Dashboard, user bans, lesson CMS, audit log |
| `/api/analytics/events` | POST | optional | Self-hosted usage/crash events |
| `/api/push/*` | GET/POST | Bearer | Web Push subscribe/unsubscribe |
| `/api/payments/*` | POST | Bearer | Stripe checkout + billing portal |
| `/api/payments/webhook` | POST | Stripe signature | Updates `isPremium` from Stripe events |

## Docker

```bash
docker build -t app-making-book-backend .
```
Or use the root `docker-compose.yml` to run this alongside Postgres and the web app together.

## What's new in this pass

- **Security hardening**: helmet security headers, HTTPS enforcement in production,
  HPP protection, request body size limits, zod input validation on every route,
  account lockout after 5 failed logins (15 min), short-lived (15 min) access tokens
  + 30-day refresh tokens, and `tokenVersion`-based revocation so "sign out
  everywhere" actually invalidates existing tokens instantly.
- **Admin dashboard + lesson CMS** (`/api/admin/*`): user list/ban/unban, lesson
  create/update/delete/publish, dashboard summary counts — all behind `requireAdmin`,
  which re-checks the database on every request rather than trusting a JWT claim.
- **Audit logging**: every admin action writes an immutable `AuditLog` row.
- **Self-hosted analytics** (`/api/analytics/events`): no third-party analytics SaaS.
- **Web Push notifications** (`/api/push/*`): free, self-hosted via VAPID keys.
- **Stripe payment scaffolding**: real checkout + billing portal + webhook code,
  inactive until you add your own Stripe keys.
- **Docker + render.yaml**: containerized, plus a one-click Render free-tier deploy.

## What wasn't added, and why

- Real crash/error monitoring (Sentry etc.) — the hook point exists, but turning it
  on needs your own free Sentry account and the SDK installed.
- A true ML recommendation engine — with 8 lessons and no real usage data yet,
  there's nothing to train on. See `web-learning-app/src/utils/recommend.js` for
  the honest rule-based version this project uses instead.

## What's new in this second security/feature pass

- **2FA (TOTP)**: `/api/auth/2fa/setup`, `/2fa/enable`, `/2fa/disable`, and a real
  2-step login flow (`/api/auth/login` returns `twoFactorRequired` + a 5-minute
  pre-auth token; `/api/auth/2fa/verify-login` completes it). Free — no SMS
  provider, just `otplib` + any authenticator app.
- **Session/device management**: every login now creates a `Session` row with a
  device label and IP. `GET /api/auth/sessions` lists them, `DELETE
  /api/auth/sessions/:id` revokes one device without logging out everywhere else.
- **Account deletion** (`DELETE /api/auth/account`, password-confirmed) and
  **GDPR-style export** (`GET /api/auth/account/export`) — offered before deletion,
  not just after.
- **Rate-limit visibility**: every 429 now logs a `RateLimitHit` row;
  `GET /api/admin/rate-limit-hits` breaks it down by route.
- **Self-hosted monitoring**: an internal DB health-check loop (every 5 min) plus
  `.github/workflows/uptime-check.yml`, a free external ping via GitHub Actions —
  see the root `MONITORING.md` for what this can and can't catch.
- **Real backup/restore**: `scripts/backup.sh` (pg_dump), `scripts/restore.sh`,
  and `.github/workflows/backup.yml` running it daily for free.

## What wasn't added in this pass, and why

- SMS-based verification — every SMS provider charges per message, with no
  sustainable free tier (unlike TOTP 2FA, which is genuinely free).
- Multi-region deployment / DB replication / true horizontal scaling — Render
  and Neon's free tiers are single-instance/single-region by design; this needs
  a paid plan, not more code.
- A full disaster-recovery plan beyond backup/restore — see MONITORING.md for
  exactly what's missing and why it's a decision, not a coding task.

## What's new in this third pass

- **Secret rotation** (`src/config/secrets.ts`): supports `JWT_SECRET_PREVIOUS`
  during a rotation window, so rotating your JWT secret no longer means
  force-logging-out every user immediately.
- **Automated security scanning**: `.github/dependabot.yml` (weekly dependency
  PRs, free) + `npm audit --audit-level=high` in CI. This is the free,
  automated substitute for regular pentesting — not equivalent to a real
  human penetration test, which finds logic/design flaws a scanner can't.
- **Redis cache** (`src/services/cache.ts`): real no-op fallback if
  `REDIS_URL` isn't set — nothing breaks without it, just runs uncached.
  Free option: Upstash (10k commands/day, no card).
- **DB-backed job queue** (`Job` model + `src/worker.ts`): no Redis/BullMQ
  needed. Run with `npm run worker`. Wired to a real caller —
  `POST /api/admin/users/:id/notify` queues a push notification instead of
  sending it inline.
- **Load testing**: `load-tests/basic-load.js` using k6 (free, open source).
  See `load-tests/README.md` for honest limits — 10 concurrent users for 2
  minutes tells you about obvious bottlenecks, not real capacity at scale.

## What wasn't added, and why

- Real penetration testing — automated scanning (above) is the free
  substitute; an actual pentest means hiring a firm or learning OWASP testing
  methodology yourself, neither of which is a code change.
- Database replication / automatic failover — Neon and Render's free tiers
  are single-instance; this needs a paid plan.

## What's new in this fourth pass

- **Email verification + password reset**: real routes in
  `src/routes/verificationRoutes.ts`, using Resend (free: 3,000/month, 100/day
  cap, no card). Without `RESEND_API_KEY` set, emails log to the console
  instead of sending — nothing crashes, you just don't get real emails until
  you add a key.
- **Real API documentation**: `docs/openapi.yaml`, served interactively at
  `/api/docs` via Swagger UI — you can execute real requests from the browser,
  not just read a README table. I found and fixed a YAML syntax bug in this
  spec (unquoted `{...}` in a description being parsed as a flow mapping)
  before shipping it — validated by actually parsing the file, not assumed.
- **Stronger automated security scanning**: added a weekly OWASP ZAP baseline
  scan (`.github/workflows/zap-scan.yml`) on top of `npm audit` — ZAP actually
  probes the running app for real vulnerabilities, not just known dependency
  CVEs. Still not a substitute for a human penetration test.
- **Found and fixed a real bug**: the frontend's `authService.js` was still
  expecting the backend's old `{ token, user }` login response — broken since
  the 2FA/session rework earlier. Login has been silently broken on the
  frontend since then. Rewrote it to match the actual current response shapes
  (access/refresh tokens, 2FA challenge), plus added automatic token refresh
  on a 401 so a 15-minute access token expiry doesn't silently break sync.

## What wasn't added, and why

- Full lesson-content translation — the i18n scaffolding in
  `web-learning-app` is real and wired (English + Swahili for UI chrome), but
  translating all 8 lessons' technical content needs a human review pass, not
  a bulk translation I should just generate and call done.
