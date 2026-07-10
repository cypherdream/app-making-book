#!/usr/bin/env bash
# Real Postgres backup, using pg_dump against DATABASE_URL.
# Run manually, or on a schedule (see MONITORING.md for a free
# GitHub Actions cron that runs this and uploads the result).
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
OUT_DIR="$(dirname "$0")/../backups"
mkdir -p "$OUT_DIR"
OUT_FILE="$OUT_DIR/backup-$TIMESTAMP.sql.gz"

pg_dump "$DATABASE_URL" | gzip > "$OUT_FILE"
echo "Backup written to $OUT_FILE"

# Keep only the last 14 local backups so this doesn't grow unbounded.
ls -1t "$OUT_DIR"/backup-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm --
