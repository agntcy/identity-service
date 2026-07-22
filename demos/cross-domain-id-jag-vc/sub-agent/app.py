# Copyright 2026 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

"""Sub-Agent (mock) — Org B, spawned by Triage with narrowed badge.

Performs the bounded-privilege remediation action:
  20. RFC 8693 / jwt-bearer exchange (subject=Sarah, actor=sub-badge) → Keycloak B
  21. Use access token (carries gitea:write gitea:pr) for Gitea gateway calls
  22. Push fix file to feature branch → gitea-gateway (needs gitea:write)
  22b. Open PR → gitea-gateway (needs gitea:pr)
  23-24. OPA: delegation depth ✓  sub-scope ⊆ parent ✓  action ∈ intent ✓  → ALLOW (mocked)
  25. PR created ✓

The sub-badge carries a nested act-chain: Sarah → OpenCode → Triage → Sub-Agent.
Any hop deeper than the parent's delegation depth is refused by the policy layer.
"""

from __future__ import annotations

import os
import secrets

import httpx
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel

KC_B_URL = os.environ.get("KC_B_URL", "http://keycloak-b:8080").rstrip("/")
KC_B_REALM = os.environ.get("KC_B_REALM", "org-b")
SUB_AGENT_CLIENT_ID = os.environ.get("SUB_AGENT_CLIENT_ID", "sub-agent")
SUB_AGENT_CLIENT_SECRET = os.environ.get("SUB_AGENT_CLIENT_SECRET", "")
IDJAG_ISSUER_URL = os.environ.get("IDJAG_ISSUER_URL", "http://idjag-issuer:9000").rstrip("/")
GITEA_GATEWAY_URL = os.environ.get("GITEA_GATEWAY_URL", "http://gitea-gateway:9100").rstrip("/")
GITEA_ADMIN_USER = os.environ.get("GITEA_ADMIN_USER", "demo-admin")

KC_B_TOKEN_EP = f"{KC_B_URL}/realms/{KC_B_REALM}/protocol/openid-connect/token"

app = FastAPI(title="Sub-Agent (mock)", version="0.1.0")


class RunRequest(BaseModel):
    sub_badge: str
    repo: str = "demo-admin/payments-service"
    intent: str = "create-pr-fix"
    act_chain: list[str] = []
    ticket_id: str = ""


@app.get("/health")
def health():
    return {"status": "ok", "agent": "sub-agent", "realm": KC_B_REALM}


@app.get("/api/config")
def config():
    return {
        "kc_b": KC_B_URL, "kc_b_realm": KC_B_REALM,
        "sub_agent_client": SUB_AGENT_CLIENT_ID,
        "idjag_issuer": IDJAG_ISSUER_URL,
        "gitea_gateway": GITEA_GATEWAY_URL,
    }


def _ok(status: str) -> bool:
    return status in ("ok", "denied")


@app.post("/api/run")
async def run(body: RunRequest):
    """Drive steps 20-25: token exchange → push file → open PR."""
    steps: list[dict] = []

    # Parse owner/repo from the full_name passed by Triage
    parts = body.repo.split("/", 1)
    owner = parts[0] if len(parts) == 2 else GITEA_ADMIN_USER
    repo_slug = parts[1] if len(parts) == 2 else body.repo
    branch = f"sub-agent/fix-{secrets.token_hex(3)}"

    async with httpx.AsyncClient(timeout=20) as client:

        # ── Step 20: jwt-bearer exchange at Keycloak B ─────────────────────
        s: dict = {
            "id": "kc-b-exchange",
            "title": (
                "20. jwt-bearer exchange (subject=Sarah, actor_token=sub-badge) → Keycloak B"
                f"  [act_chain={body.act_chain}]"
            ),
            "detail": f"POST {KC_B_TOKEN_EP}  client={SUB_AGENT_CLIENT_ID}  scope=gitea:write gitea:pr",
        }
        try:
            r = await client.post(KC_B_TOKEN_EP, data={
                "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                "assertion": body.sub_badge,
                "client_id": SUB_AGENT_CLIENT_ID,
                "client_secret": SUB_AGENT_CLIENT_SECRET,
                "scope": "openid gitea:write gitea:pr",
            })
            if r.status_code == 200:
                access_token = r.json()["access_token"]
                s.update(status="ok", token_preview=access_token[:48] + "…", token=access_token)
            else:
                s.update(status="error", error=f"HTTP {r.status_code}: {r.text[:300]}")
                steps.append(s)
                return JSONResponse({"ok": False, "steps": steps})
        except Exception as exc:  # noqa: BLE001
            s.update(status="error", error=str(exc))
            steps.append(s)
            return JSONResponse({"ok": False, "steps": steps})
        steps.append(s)

        # ── Step 21: token carries gitea:write gitea:pr (no separate ID-JAG needed) ──
        steps.append({
            "id": "idjag-gitea",
            "title": "21. ID-JAG for Gitea API — access token from step 20 carries gitea:write gitea:pr",
            "status": "ok",
            "result": {
                "note": (
                    "The sub-badge was scoped to gitea:write gitea:pr when minted by Triage. "
                    "Keycloak B issued the access token with those scopes. "
                    "gitea-gateway validates this token directly — no additional ID-JAG needed."
                ),
            },
        })

        # ── Step 22: Push fix file to feature branch ───────────────────────
        s = {
            "id": "push-file",
            "title": f"22a. Push fix file to {branch} (needs gitea:write) → gitea-gateway",
            "detail": f"POST {GITEA_GATEWAY_URL}/api/gitea/push/{owner}/{repo_slug}",
        }
        try:
            r = await client.post(
                f"{GITEA_GATEWAY_URL}/api/gitea/push/{owner}/{repo_slug}",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if r.status_code in (200, 201):
                s.update(status="ok", result=r.json())
                # gateway returns the branch it used; prefer that over our generated name
                branch = r.json().get("pushed", {}).get("branch", branch)
            elif r.status_code == 403:
                s.update(status="denied", result=r.json())
            else:
                s.update(status="error", error=f"HTTP {r.status_code}: {r.text[:300]}")
        except Exception as exc:  # noqa: BLE001
            s.update(status="error", error=str(exc))
        steps.append(s)

        # ── Step 22b: Open PR ───────────────────────────────────────────────
        s = {
            "id": "open-pr",
            "title": f"22b. Open PR ({branch} → main, needs gitea:pr) → gitea-gateway",
            "detail": f"POST {GITEA_GATEWAY_URL}/api/gitea/pulls/{owner}/{repo_slug}",
        }
        try:
            r = await client.post(
                f"{GITEA_GATEWAY_URL}/api/gitea/pulls/{owner}/{repo_slug}",
                headers={"Authorization": f"Bearer {access_token}",
                         "Content-Type": "application/json"},
                json={
                    "head": branch,
                    "base": "main",
                    "title": (
                        f"fix: remediate {body.intent}"
                        f" [ticket={body.ticket_id or 'TRIAGE'}]"
                        f" [act-chain={' → '.join(body.act_chain)}]"
                    ),
                },
            )
            if r.status_code in (200, 201):
                s.update(status="ok", result=r.json())
            elif r.status_code == 403:
                s.update(status="denied", result=r.json())
            else:
                s.update(status="error", error=f"HTTP {r.status_code}: {r.text[:300]}")
        except Exception as exc:  # noqa: BLE001
            s.update(status="error", error=str(exc))
        steps.append(s)

        # ── Step 22c: Attempt a PR against the deny-listed repo — always
        # refused by gitea-gateway's policy layer, even though this same
        # access token just successfully opened a PR elsewhere with the
        # identical gitea:pr scope. Demonstrates: policy beats scope.
        s = {
            "id": "denied-pr-attempt",
            "title": "22c. Attempt PR on demo-protected (deny-listed — refused regardless of scope)",
            "detail": f"POST {GITEA_GATEWAY_URL}/api/gitea/pulls/{owner}/demo-protected",
        }
        try:
            r = await client.post(
                f"{GITEA_GATEWAY_URL}/api/gitea/pulls/{owner}/demo-protected",
                headers={"Authorization": f"Bearer {access_token}",
                         "Content-Type": "application/json"},
                json={
                    "head": branch,
                    "base": "main",
                    "title": "fix: attempted change to a protected repo (expected to be denied)",
                },
            )
            if r.status_code == 403:
                s.update(status="denied", result=r.json())
            elif r.status_code in (200, 201):
                s.update(
                    status="error",
                    error="expected 403 policy_deny but the PR succeeded — deny-list not enforced",
                    result=r.json(),
                )
            else:
                s.update(status="error", error=f"HTTP {r.status_code}: {r.text[:300]}")
        except Exception as exc:  # noqa: BLE001
            s.update(status="error", error=str(exc))
        steps.append(s)

        # ── Steps 23-24: OPA egress (mocked — ALLOW) ───────────────────────
        steps.append({
            "id": "opa-egress",
            "title": (
                "23-24. OPA: delegation depth ✓  sub-scope ⊆ parent ✓"
                "  action ∈ intent ✓  → ALLOW (mocked)"
            ),
            "status": "ok",
            "result": {
                "decision": "ALLOW",
                "delegation_depth": len(body.act_chain),
                "sub_scope_subset": True,
                "note": "mocked — real impl: Envoy+OPA at Org B ingress verifies depth + sub-scope",
            },
        })

    # ── Step 25: PR created summary ─────────────────────────────────────────
    pr_step = next((s for s in steps if s["id"] == "open-pr"), {})
    pr_url = pr_step.get("result", {}).get("pull_request", {}).get("html_url", "")
    steps.append({
        "id": "pr-created",
        "title": "25. PR created ✓ — causal audit: Sarah → OpenCode → Triage → Sub-Agent",
        "status": "ok" if _ok(pr_step.get("status", "error")) else "error",
        "result": {
            "pr_url": pr_url,
            "act_chain": body.act_chain,
            "ticket": body.ticket_id,
            "otel_note": "OpenTelemetry trace_id would link every hop in production",
        },
    })

    return JSONResponse({
        "ok": all(_ok(s.get("status", "error")) for s in steps),
        "steps": steps,
    })
