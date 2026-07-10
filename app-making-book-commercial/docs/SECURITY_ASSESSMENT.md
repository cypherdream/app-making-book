# Security self-assessment (not a third-party audit)

This is an honest internal accounting of what's implemented and what isn't —
written by the AI that built this code, not an independent auditor. Treat it
as a starting point for a real audit, not a substitute for one.

## What's implemented

| Area | Implementation | File |
|---|---|---|
| Password storage | bcrypt, cost factor 12 | `backend/src/routes/authRoutes.ts` |
| Session tokens | Short-lived (15min) access + 30-day refresh, revocable via `tokenVersion` | `backend/src/config/secrets.ts` |
| 2FA | TOTP (RFC 6238), free, no SMS | `backend/src/routes/authRoutes.ts` |
| Brute-force defense | Account lockout after 5 failed logins (15 min) + rate limiting | `backend/src/middleware/accountLockout.ts` |
| Input validation | zod schemas on every route accepting a body | `backend/src/validation/` |
| Security headers | helmet (HSTS, X-Frame-Options, etc.) | `backend/src/server.ts` |
| HTTPS enforcement | Redirects in production | `backend/src/middleware/security.ts` |
| SQL injection | Prisma parameterizes all queries — no raw SQL string concatenation anywhere in this codebase | throughout |
| Secret rotation | Dual-secret verification window | `backend/src/config/secrets.ts` |
| Account enumeration | Password reset always returns the same response whether the email exists or not | `backend/src/routes/verificationRoutes.ts` |
| Timing attacks on login | bcrypt.compare runs even for nonexistent users | `backend/src/routes/authRoutes.ts` |
| Dependency vulnerabilities | Automated: Dependabot (weekly) + `npm audit --audit-level=high` in CI | `.github/` |
| Dynamic vulnerability scanning | OWASP ZAP baseline scan (weekly) | `.github/workflows/zap-scan.yml` |
| Secret leaks in git history | gitleaks scan on every push | `.github/workflows/secret-scan.yml` |
| Admin authorization | Rechecked from DB on every request, not trusted from JWT claim | `backend/src/middleware/requireAdmin.ts` |
| Audit trail | Immutable log of every admin action | `backend/prisma/schema.prisma` (`AuditLog`) |

## What's explicitly NOT covered by automated tooling

Automated scanners (ZAP, npm audit, gitleaks) are good at finding known
vulnerability patterns and known-bad dependencies. They are **not** good at:

- **Business logic flaws** — e.g., "can user A see user B's data through some
  combination of legitimate-looking requests that no single scanner rule
  flags." This needs a human thinking adversarially about this specific app.
- **Authorization edge cases** — e.g., does every admin route actually check
  `requireAdmin`, or did one get added later and missed? (I've reviewed this
  manually as of this pass; a fresh set of eyes should re-check periodically,
  not just trust this document forever.)
- **Race conditions** — e.g., two simultaneous requests to the account
  deletion endpoint, or a TOCTOU issue in the rate limiter.
- **Social engineering / phishing resistance** — not a code property at all.

## Before a real penetration test

If/when you commission one, give the tester:
- This document, so they know what's already been checked and can focus
  elsewhere.
- `docs/openapi.yaml` — the full API surface.
- Read access to `backend/prisma/schema.prisma` — the tester should know the
  data model to reason about authorization boundaries.
- A staging environment, not production — never let a pentest run destructive
  tests (account deletion, rate-limit exhaustion) against real user data.

## Known accepted risks (documented, not hidden)

- **Tokens in localStorage, not httpOnly cookies**: makes tokens readable to
  any script that achieves XSS on the page. Mitigated by React's default
  auto-escaping (no `dangerouslySetInnerHTML` used in this codebase as of
  this pass — worth re-confirming if that changes) but not eliminated.
  Moving to httpOnly cookies is the documented next step in
  `web-learning-app/README.md`.
- **Free-tier hosting**: Render's free web service has no SLA and sleeps
  after 15 minutes idle. Acceptable for early-stage use; not acceptable once
  you have paying customers depending on uptime.
- **No WAF (Web Application Firewall)**: helmet + rate limiting + input
  validation cover a lot, but a dedicated WAF (e.g., Cloudflare, which has a
  free tier) adds a layer this setup doesn't currently have.
