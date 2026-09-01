#!/usr/bin/env bash
# Deploys the order API to /srv/curialy-api and restarts the service.
# Run from the repo root:  sudo server/deploy.sh
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST=/srv/curialy-api
SERVICE=curialy-api.service

if [[ $EUID -ne 0 ]]; then
  echo "must run as root" >&2
  exit 1
fi

id -u curialyapi >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin curialyapi

echo "==> installing dependencies"
su -s /bin/bash -c "cd '$SRC' && npm ci --omit=dev" "$(stat -c %U "$SRC")"

echo "==> syncing $DEST"
mkdir -p "$DEST"
rsync -a --delete \
  --exclude '.env' \
  "$SRC/src" "$SRC/assets" "$SRC/scripts" "$SRC/node_modules" \
  "$SRC/package.json" "$SRC/package-lock.json" "$SRC/schema.sql" \
  "$DEST/"

chown -R root:curialyapi "$DEST"
find "$DEST" -type d -exec chmod 750 {} +
find "$DEST" -type f -exec chmod 640 {} +

echo "==> restarting $SERVICE"
systemctl restart "$SERVICE"
systemctl is-active "$SERVICE"
# Node needs a moment to bind after systemd reports the unit active.
for _ in $(seq 1 15); do
  if curl -fsS --max-time 2 http://127.0.0.1:5052/api/health; then echo; exit 0; fi
  sleep 1
done
echo "health check never passed" >&2
exit 1
