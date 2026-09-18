#!/bin/bash
# Pushes local code straight to the live server over SSH — no GitHub involved.
#
# Usage:
#   ./deploy.sh         Dry run — shows what WOULD change, touches nothing
#   ./deploy.sh --live  Actually copies the files
#
# Excludes anything the admin panel manages live on the server (data/*.json,
# images/, blog & resource markdown, the real admin/config.php with your
# production password hash) so a deploy can never clobber server-side content
# with a stale local copy. Never deletes files on the server that aren't
# present locally — this only ever adds/updates.

set -euo pipefail
cd "$(dirname "$0")"

REMOTE_HOST="root@soniapolis.com"
REMOTE_PATH="/var/www/iSonia/"

DRY_RUN="--dry-run"
if [ "${1:-}" = "--live" ]; then
  DRY_RUN=""
fi

if [ -n "$DRY_RUN" ]; then
  echo "── DRY RUN — nothing will be changed. Run with --live to actually deploy. ──"
fi

rsync -avz $DRY_RUN \
  --exclude '.git/' \
  --exclude '.DS_Store' \
  --exclude '.claude/' \
  --exclude 'node_modules/' \
  --exclude 'deploy.sh' \
  --exclude 'admin/config.local.php' \
  --exclude 'admin/config.php' \
  --exclude 'data/' \
  --exclude 'images/' \
  --exclude 'creations/blogs/*.md' \
  --exclude 'creations/blogs/backups/' \
  --exclude 'navigation/resources/markdown/' \
  ./ "$REMOTE_HOST:$REMOTE_PATH"

if [ -n "$DRY_RUN" ]; then
  echo
  echo "── That was a dry run. Review the list above, then run: ./deploy.sh --live ──"
fi
