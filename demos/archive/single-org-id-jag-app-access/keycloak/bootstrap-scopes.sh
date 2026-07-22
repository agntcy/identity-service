#!/usr/bin/env bash
# Registers the narrow "gitea:read" / "gitea:write" client scopes in the
# cncf-demo realm and assigns them as OPTIONAL scopes to the Receiving App.
#
# Run after Keycloak has imported the realm (see the kc-init service). It uses
# kcadm.sh and is idempotent — re-running is safe.
set -euo pipefail

KC="${KC_URL:-http://keycloak:8080}"
REALM="${KC_REALM:-cncf-demo}"
ADMIN="${KC_ADMIN:-admin}"
ADMIN_PW="${KC_ADMIN_PASSWORD:?KC_ADMIN_PASSWORD required}"
CLIENT_ID="${RECEIVER_CLIENT:-receiving-app}"
KCADM=/opt/keycloak/bin/kcadm.sh

echo "[kc-init] waiting for Keycloak at ${KC} ..."
for i in $(seq 1 60); do
  if "$KCADM" config credentials --server "$KC" --realm master \
       --user "$ADMIN" --password "$ADMIN_PW" >/dev/null 2>&1; then
    echo "[kc-init] authenticated to Keycloak admin"
    break
  fi
  sleep 3
done

create_scope() {
  local name="$1" desc="$2"
  if "$KCADM" get client-scopes -r "$REALM" --fields name --format csv --noquotes 2>/dev/null | grep -qx "$name"; then
    echo "[kc-init] client scope '$name' already exists"
  else
    echo "[kc-init] creating client scope '$name'"
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
    echo "[kc-init] ERROR: could not resolve client ($cid) or scope ($scope_name -> $sid)"
    return 1
  fi
  echo "[kc-init] assigning optional scope '$scope_name' to '$CLIENT_ID'"
  "$KCADM" update "clients/${cid}/optional-client-scopes/${sid}" -r "$REALM" >/dev/null 2>&1 || true
}

create_scope "gitea:read"  "Read-only access to Gitea repositories"
create_scope "gitea:write" "Write access to Gitea repositories (create/push)"
create_scope "gitea:pr"    "Pull-request access to Gitea repositories (open PRs)"
assign_optional "gitea:read"
assign_optional "gitea:write"
assign_optional "gitea:pr"

echo "[kc-init] done."
