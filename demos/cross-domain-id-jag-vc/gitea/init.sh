#!/bin/sh
# Copyright 2026 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

# Bootstraps Gitea for the cross-domain remediation demo.
# Seeds the admin user and the target repositories.
set -eu

CONF=/data/gitea/conf/app.ini
GITEA_URL="${GITEA_INTERNAL_URL:-http://gitea:3000}"
ADMIN_USER="${GITEA_ADMIN_USER:-demo-admin}"
ADMIN_PW="${GITEA_ADMIN_PASSWORD:?GITEA_ADMIN_PASSWORD required}"
ADMIN_EMAIL="${GITEA_ADMIN_EMAIL:-admin@example.com}"

echo "[gitea-init] waiting for Gitea config at ${CONF} ..."
for i in $(seq 1 60); do
  [ -f "$CONF" ] && break
  sleep 2
done

echo "[gitea-init] ensuring admin user '${ADMIN_USER}' exists"
if gitea admin user list --config "$CONF" 2>/dev/null | awk '{print $2}' | grep -qx "$ADMIN_USER"; then
  echo "[gitea-init] admin user already present"
else
  for i in $(seq 1 5); do
    if gitea admin user create --admin --username "$ADMIN_USER" \
         --password "$ADMIN_PW" --email "$ADMIN_EMAIL" \
         --must-change-password=false --config "$CONF" 2>&1; then
      break
    fi
    echo "[gitea-init] create retry $i ..."; sleep 3
  done
fi

echo "[gitea-init] waiting for Gitea API ..."
AUTH="Authorization: Basic $(printf '%s' "${ADMIN_USER}:${ADMIN_PW}" | base64)"
for i in $(seq 1 60); do
  if wget -q -O- --header="$AUTH" "${GITEA_URL}/api/v1/version" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

seed_repo() {
  name="$1"; desc="$2"
  if wget -q -O- --header="$AUTH" "${GITEA_URL}/api/v1/repos/${ADMIN_USER}/${name}" >/dev/null 2>&1; then
    echo "[gitea-init] repo '${name}' already exists"
    return
  fi
  echo "[gitea-init] creating repo '${name}'"
  wget -q -O- --header="Content-Type: application/json" --header="$AUTH" \
    --post-data="{\"name\":\"${name}\",\"private\":false,\"auto_init\":true,\"description\":\"${desc}\"}" \
    "${GITEA_URL}/api/v1/user/repos" >/dev/null 2>&1 || echo "[gitea-init] WARN: could not create ${name}"
}

# Target repo for sub-agent's PR (the "remediation" resource)
seed_repo "payments-service" "Payments microservice — target for CVE remediation PRs (cross-domain demo)"
# Protected repo: gateway deny-list blocks PR creation regardless of scope
seed_repo "demo-protected"   "Protected repo — deny-listed at gateway; agents cannot PR here"

echo "[gitea-init] done."
