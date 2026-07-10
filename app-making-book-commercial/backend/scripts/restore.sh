#!/usr/bin/env bash
# Restores a backup produced by backup.sh. DESTRUCTIVE — this replaces
# whatever's currently in the target database.
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ] || [ -z "${1:-}" ]; then
  echo "Usage: DATABASE_URL=... ./restore.sh path/to/backup.sql.gz" >&2
  exit 1
fi

echo "This will OVERWRITE the database at DATABASE_URL. Type 'yes' to continue:"
read -r CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

gunzip -c "$1" | psql "$DATABASE_URL"
echo "Restore complete."
