# Monitoring, backup, and disaster recovery — what's real here, and what isn't

## Monitoring (free, self-hosted)

Two complementary checks, because neither alone tells the full story:

1. **Internal DB health check** — `backend/src/server.ts` pings the database every
   5 minutes and writes a row to `HealthCheck`. Visible on `GET /api/admin/dashboard`
   as `uptimePctLast50Checks`. Limitation: this only runs while the process is
   alive — it can't detect the whole server being down or asleep.
2. **External uptime ping** — `.github/workflows/uptime-check.yml` hits your real
   public `/health` URL every 15 minutes from GitHub's servers, completely
   outside your infrastructure. This is what catches "the whole thing is down."
   Set the `BACKEND_HEALTH_URL` repo secret to your deployed URL. GitHub emails
   the repo owner automatically when a scheduled workflow fails — that's your
   free alerting, no extra setup.

Caveat: GitHub only runs scheduled workflows on **private** repos if there's been
commit activity in the last 60 days. Public repos don't have that restriction.

This is genuinely free self-hosted monitoring. It is not Datadog/Grafana-grade
(no custom dashboards, no anomaly detection, no paging/on-call rotation) — those
need either a paid service or a lot more infrastructure than fits a project this
size right now.

## Backup

`backend/scripts/backup.sh` runs a real `pg_dump` and gzips it.
`.github/workflows/backup.yml` runs that daily and uploads the result as a
GitHub Actions artifact (kept 14 days free). Restore with
`backend/scripts/restore.sh`.

For longer retention than 14 days, add a step pushing the backup to Backblaze
B2 (free 10GB tier) — noted as a next step, not implemented here, since it needs
your own B2 account and credentials.

## Disaster recovery — the honest limits

A backup + restore script is the recovery *mechanism*, not a full DR plan. Real
disaster recovery for something people are paying for typically includes:

- A tested restore (have you actually run restore.sh against a fresh database
  and confirmed the app works? Do that once, don't assume it works.)
- A second region ready to take over if your primary region goes down — this
  needs a paid multi-region setup; Render/Neon's free tiers are single-region.
- A documented recovery time objective (how long can you be down?) and recovery
  point objective (how much data can you afford to lose? — with daily backups,
  the answer is "up to 24 hours of it").

None of that last group is built here. It's not a code problem — it's a decision
about how much downtime and data loss is acceptable, which only makes sense to
answer once there are real users depending on this.

## Disaster recovery runbook — concrete steps, not just principles

**If the database is corrupted or data was wrongly deleted:**
1. Stop the backend (`Ctrl+C` locally, or scale the Render service to 0 instances)
   to prevent further writes.
2. Find the most recent good backup: check GitHub Actions → `backup.yml` runs →
   download the `db-backup-*` artifact.
3. Run `DATABASE_URL=... ./backend/scripts/restore.sh path/to/backup.sql.gz`
   against a **new** Neon database first, not production — verify the data looks
   right before pointing production at it.
4. Update `DATABASE_URL` in Render's environment variables to the restored
   database, then restart the service.
5. Expected data loss: up to 24 hours (the backup interval) — this is the
   Recovery Point Objective this setup actually provides, not a lower number.

**If JWT_SECRET leaks (e.g., accidentally committed to git):**
1. Generate a new secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
2. Set `JWT_SECRET_PREVIOUS` to the old (leaked) value, `JWT_SECRET` to the new one.
3. Deploy immediately — this doesn't force-logout users (see `config/secrets.ts`),
   but the leaked secret can no longer be used to forge NEW tokens.
4. After 30 days (the refresh token lifetime), remove `JWT_SECRET_PREVIOUS` —
   any tokens signed with the leaked secret will have expired by then regardless.
5. If you suspect the leak was actively exploited (not just theoretical), also
   bump every user's `tokenVersion` via a one-off script, which immediately
   invalidates all existing sessions — more disruptive, use only if there's
   evidence of actual misuse.

**If the Render service won't start after a deploy:**
1. Check Render's build logs first — most failures are a missing environment
   variable or a Prisma migration that didn't run.
2. Roll back to the previous deploy from Render's dashboard (it keeps recent
   deploys) while you fix the issue — don't debug in production with users
   unable to log in.

**If you suspect a security incident (unauthorized admin access, mass data
scraping, etc.):**
1. Call `POST /api/auth/logout-all` for the affected account(s), or rotate
   `JWT_SECRET` entirely (see above) if it's broader than one account.
2. Check `GET /api/admin/audit-log` for what the compromised account actually did.
3. Check `RateLimitHit` and server logs for the source IP pattern.
4. This is where a real incident response plan (who to notify, whether you have
   legal disclosure obligations depending on what data was exposed) becomes a
   business/legal decision, not a code one — worth having a lawyer's input on
   this *before* you need it, not during an actual incident.

