# Architecture

Diagrams below use [Mermaid](https://mermaid.js.org) — they render directly
on GitHub, no image files or generator needed.

## System overview

```mermaid
graph TD
    A[Android App<br/>Kotlin/MVVM] -->|HTTPS + JWT| B[Backend API<br/>Express/TypeScript]
    W[Web Learning App<br/>React/Vite] -->|HTTPS + JWT| B
    B --> D[(PostgreSQL<br/>via Prisma)]
    B -.->|optional| R[(Redis<br/>cache)]
    B --> Q[Job Table<br/>background queue]
    Q --> WK[Worker Process]
    WK --> PUSH[Web Push<br/>VAPID]
    B -.->|optional| STRIPE[Stripe]
    B -.->|optional| EMAIL[Resend]
    B --> SOCK[Socket.io<br/>real-time]
    SOCK --> W
```

Dotted lines are optional integrations — the app works without them, just
with reduced features (no caching, no payments, no email) rather than
crashing. See each service file's "graceful no-op" comment for how that's
implemented (`src/services/cache.ts`, `src/services/email.ts`,
`src/routes/paymentRoutes.ts`).

## Auth flow (including 2FA)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Enter email + password
    F->>B: POST /api/auth/login
    B->>DB: Check password hash, lockout status
    alt 2FA enabled
        B-->>F: { twoFactorRequired: true, preAuthToken }
        U->>F: Enter 6-digit TOTP code
        F->>B: POST /api/auth/2fa/verify-login
        B->>DB: Verify TOTP, create Session
        B-->>F: { accessToken, refreshToken, user }
    else 2FA not enabled
        B->>DB: Create Session
        B-->>F: { accessToken, refreshToken, user }
    end
    F->>F: Store tokens, redirect to app

    Note over F,B: 15 minutes later — access token expires
    F->>B: Any request with expired access token
    B-->>F: 401
    F->>B: POST /api/auth/refresh (using refreshToken)
    B->>DB: Check Session not revoked, tokenVersion matches
    B-->>F: New accessToken
    F->>B: Retry original request
```

## Data flow: a lesson completion

```mermaid
sequenceDiagram
    participant U as User (web app)
    participant F as React app
    participant B as Backend
    participant DB as Database
    participant A as Analytics

    U->>F: Clicks "Mark lesson complete"
    F->>F: Update local state, save to localStorage
    F->>B: PUT /api/progress (if logged in)
    B->>DB: Upsert Progress row
    F->>A: POST /api/analytics/events (lesson_complete)
    A->>DB: Insert AnalyticsEvent
    Note over F: Certificate download unlocks if all lessons done
```

## Folder structure

```
android-app/    Kotlin — MainActivity, MainViewModel, UserRepository,
                data/local (Room), data/remote (Retrofit), di (Hilt)
backend/        TypeScript — src/routes (API endpoints), src/middleware
                (auth, security, rate limiting), src/services (cache, email,
                jobs — each with a graceful no-op fallback), prisma/schema.prisma
web-learning-app/  React — src/components, src/hooks, src/services,
                   src/data (lessons as JSON), src/pages (AdminDashboard)
```

## Why this shape

- **Two frontends, one backend**: Android and the web learning app are
  independent — neither knows the other exists. They both just call the same
  REST API. This means either could be replaced without touching the other.
- **Graceful degradation everywhere**: Redis, Stripe, email, and push
  notifications are all optional — the backend works without any of them
  configured, just with fewer features. This was a deliberate choice so the
  free-tier deployment path (see `DEPLOY_FREE.md`) doesn't require signing up
  for every optional service just to get the core app running.
- **Database-backed job queue instead of Redis/BullMQ**: keeps the free-tier
  deployment story simpler (one fewer service to provision) at the cost of
  polling-based latency (~5 seconds) instead of instant dispatch — a
  deliberate trade documented in `backend/src/worker.ts`.
