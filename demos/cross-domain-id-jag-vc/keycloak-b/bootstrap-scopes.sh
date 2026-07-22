#!/usr/bin/env bash
# Copyright 2026 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

# Registers scopes in Org B (org-b realm):
#   triage:create — create tickets (triage-agent receives from Org A)
#   gitea:read    — narrow read scope for Gitea
#   gitea:write   — narrow write scope for Gitea
#   gitea:pr      — PR creation scope for Gitea (sub-agent only)
# Assigns each as optional scope on the appropriate receiving client.
set -euo pipefail

KC="${KC_URL:-http://keycloak-b:8080}"
REALM="${KC_REALM:-org-b}"
ADMIN="${KC_ADMIN:-admin}"
ADMIN_PW="${KC_ADMIN_PASSWORD:?KC_ADMIN_PASSWORD required}"
KCADM=/opt/keycloak/bin/kcadm.sh

echo "[kc-b-init] waiting for Keycloak B at ${KC} ..."
for i in $(seq 1 60); do
  if "$KCADM" config credentials --server "$KC" --realm master \
       --user "$ADMIN" --password "$ADMIN_PW" >/dev/null 2>&1; then
    echo "[kc-b-init] authenticated to Keycloak B admin"
    break
  fi
  sleep 3
done

create_scope() {
  local name="$1" desc="$2"
  if "$KCADM" get client-scopes -r "$REALM" --fields name --format csv --noquotes 2>/dev/null | grep -qx "$name"; then
    echo "[kc-b-init] scope '$name' already exists"
  else
    echo "[kc-b-init] creating scope '$name'"
    "$KCADM" create client-scopes -r "$REALM" \
      -s name="$name" \
      -s description="$desc" \
      -s protocol=openid-connect \
      -s 'attributes."include.in.token.scope"=true' \
      -s 'attributes."display.on.consent.screen"=false'
  fi
}

assign_optional() {
  local client_id="$1" scope_name="$2"
  local cid sid
  cid=$("$KCADM" get clients -r "$REALM" -q clientId="$client_id" --fields id --format csv --noquotes | head -n1)
  sid=$("$KCADM" get client-scopes -r "$REALM" --fields id,name --format csv --noquotes \
        | grep ",${scope_name}$" | cut -d, -f1 | head -n1)
  if [ -z "$cid" ] || [ -z "$sid" ]; then
    echo "[kc-b-init] WARN: could not resolve client=$client_id or scope=$scope_name"
    return 0
  fi
  echo "[kc-b-init] assigning optional scope '$scope_name' to '$client_id'"
  "$KCADM" update "clients/${cid}/optional-client-scopes/${sid}" -r "$REALM" >/dev/null 2>&1 || true
}

# Create all scopes
create_scope "triage:create" "Create remediation tickets in Org B Triage (cross-domain from Org A)"
create_scope "gitea:read"    "Read-only access to Gitea repositories"
create_scope "gitea:write"   "Write access to Gitea repositories (push files/branches)"
create_scope "gitea:pr"      "Pull-request creation access to Gitea repositories"

# triage-agent receives triage:create from cross-domain Org A agents
assign_optional "triage-agent" "triage:create"

# sub-agent gets write+PR scopes for Gitea (bounded sub-scope of parent badge)
assign_optional "sub-agent" "gitea:read"
assign_optional "sub-agent" "gitea:write"
assign_optional "sub-agent" "gitea:pr"

echo "[kc-b-init] done."
