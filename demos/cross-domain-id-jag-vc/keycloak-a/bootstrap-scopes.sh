#!/usr/bin/env bash
# Copyright 2026 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

# Registers cross-domain scopes in Org A (org-a realm).
# OpenCode requests triage:create when minting the ID-JAG assertion for Org B.
set -euo pipefail

KC="${KC_URL:-http://keycloak-a:8080}"
REALM="${KC_REALM:-org-a}"
ADMIN="${KC_ADMIN:-admin}"
ADMIN_PW="${KC_ADMIN_PASSWORD:?KC_ADMIN_PASSWORD required}"
CLIENT_ID="${REQUESTER_CLIENT:-opencode-agent}"
KCADM=/opt/keycloak/bin/kcadm.sh

echo "[kc-a-init] waiting for Keycloak A at ${KC} ..."
for i in $(seq 1 60); do
  if "$KCADM" config credentials --server "$KC" --realm master \
       --user "$ADMIN" --password "$ADMIN_PW" >/dev/null 2>&1; then
    echo "[kc-a-init] authenticated to Keycloak A admin"
    break
  fi
  sleep 3
done

create_scope() {
  local name="$1" desc="$2"
  if "$KCADM" get client-scopes -r "$REALM" --fields name --format csv --noquotes 2>/dev/null | grep -qx "$name"; then
    echo "[kc-a-init] scope '$name' already exists"
  else
    echo "[kc-a-init] creating scope '$name'"
    "$KCADM" create client-scopes -r "$REALM" \
      -s name="$name" \
      -s description="$desc" \
      -s protocol=openid-connect \
      -s 'attributes."include.in.token.scope"=true' \
      -s 'attributes."display.on.consent.screen"=false'
  fi
}

assign_optional() {
  local scope_name="$1"
  local cid sid
  cid=$("$KCADM" get clients -r "$REALM" -q clientId="$CLIENT_ID" --fields id --format csv --noquotes | head -n1)
  sid=$("$KCADM" get client-scopes -r "$REALM" --fields id,name --format csv --noquotes \
        | grep ",${scope_name}$" | cut -d, -f1 | head -n1)
  if [ -z "$cid" ] || [ -z "$sid" ]; then
    echo "[kc-a-init] ERROR: could not resolve client ($cid) or scope ($scope_name -> $sid)"
    return 1
  fi
  echo "[kc-a-init] assigning optional scope '$scope_name' to '$CLIENT_ID'"
  "$KCADM" update "clients/${cid}/optional-client-scopes/${sid}" -r "$REALM" >/dev/null 2>&1 || true
}

create_scope "triage:create" "Cross-domain scope: create remediation tickets in Org B Triage"
assign_optional "triage:create"

echo "[kc-a-init] done."
