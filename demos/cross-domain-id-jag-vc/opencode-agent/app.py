# Copyright 2026 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

"""OpenCode Agent (mock) — Org A AI coding agent.

Drives Phase A + Discovery + Phase B of the cross-domain remediation sequence:
  Phase A (local, no cross-domain auth):
    1. Sarah signs in via OIDC password grant → Keycloak A (org-a realm)
    2. Mock: scan repo, find CVE, decide to remediate cross-domain
  Discovery + Identity:
    3-6. Resolve VC badge from AGNTCY identity node (mocked for now)
  Phase B (cross-domain begins):
    7. RFC 8693 exchange (subject=Sarah, actor_token=badge) → Keycloak A (mocked)
    8. Mint ID-JAG assertion for Org B triage-agent → idjag-issuer
   11. Redeem ID-JAG at Keycloak B → scoped access token (triage:create)
   13. Create remediation ticket → Triage agent (Org B)

Steps 9-10 (egress PDP/OPA) and 14-15 (ingress PDP) are skipped per demo scope.
"""

from __future__ import annotations

import os

import httpx
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel

KC_A_URL = os.environ.get("KC_A_URL", "http://keycloak-a:8080").rstrip("/")
KC_A_REALM = os.environ.get("KC_A_REALM", "org-a")
KC_B_URL = os.environ.get("KC_B_URL", "http://keycloak-b:8080").rstrip("/")
KC_B_REALM = os.environ.get("KC_B_REALM", "org-b")
OPENCODE_CLIENT_ID = os.environ.get("OPENCODE_CLIENT_ID", "opencode-agent")
OPENCODE_CLIENT_SECRET = os.environ.get("OPENCODE_CLIENT_SECRET", "")
TRIAGE_CLIENT_ID = os.environ.get("TRIAGE_CLIENT_ID", "triage-agent")
TRIAGE_CLIENT_SECRET = os.environ.get("TRIAGE_CLIENT_SECRET", "")
SARAH_USER = os.environ.get("SARAH_USER", "sarah")
SARAH_PASSWORD = os.environ.get("SARAH_PASSWORD", "")
SARAH_EMAIL = os.environ.get("SARAH_EMAIL", "sarah@org-a.example")
IDJAG_ISSUER_URL = os.environ.get("IDJAG_ISSUER_URL", "http://idjag-issuer:9000").rstrip("/")
IDENTITY_NODE_URL = os.environ.get("IDENTITY_NODE_URL", "http://identity-node:4000").rstrip("/")
TRIAGE_AGENT_URL = os.environ.get("TRIAGE_AGENT_URL", "http://triage-agent:8200").rstrip("/")
SCAN_REPO = os.environ.get("SCAN_REPO", "demo-admin/payments-service")

KC_A_TOKEN_EP = f"{KC_A_URL}/realms/{KC_A_REALM}/protocol/openid-connect/token"
KC_B_TOKEN_EP = f"{KC_B_URL}/realms/{KC_B_REALM}/protocol/openid-connect/token"
KC_B_ISSUER = f"{KC_B_URL}/realms/{KC_B_REALM}"

app = FastAPI(title="OpenCode Agent (mock)", version="0.1.0")


class RunRequest(BaseModel):
    repo: str = ""
    cve_override: str = ""


def _s(id: str, title: str, detail: str = "") -> dict:
    return {"id": id, "title": title, "detail": detail}


def _ok(status: str) -> bool:
    return status in ("ok", "denied")


@app.get("/health")
def health():
    return {"status": "ok", "agent": "opencode", "realm": KC_A_REALM}


@app.get("/api/config")
def config():
    return {
        "kc_a": KC_A_URL, "kc_a_realm": KC_A_REALM,
        "kc_b": KC_B_URL, "kc_b_realm": KC_B_REALM,
        "opencode_client": OPENCODE_CLIENT_ID,
        "triage_client": TRIAGE_CLIENT_ID,
        "idjag_issuer": IDJAG_ISSUER_URL,
        "identity_node": IDENTITY_NODE_URL,
        "triage_agent": TRIAGE_AGENT_URL,
    }


@app.post("/api/run")
async def run(body: RunRequest | None = None):
    """Drive the full Phase A + B sequence (steps 1-13)."""
    repo = (body.repo if body else "") or SCAN_REPO
    cve = (body.cve_override if body else "") or "CVE-2024-XXXX"
    steps: list[dict] = []

    async with httpx.AsyncClient(timeout=20) as client:

        # ── Step 1: Sarah signs in (OIDC password grant → Keycloak A) ──────
        s = _s("sarah-login",
               "1. Sarah signs in — OIDC password grant → Keycloak A (org-a)",
               f"POST {KC_A_TOKEN_EP}  client={OPENCODE_CLIENT_ID}  user={SARAH_USER}")
        try:
            r = await client.post(KC_A_TOKEN_EP, data={
                "grant_type": "password",
                "client_id": OPENCODE_CLIENT_ID,
                "client_secret": OPENCODE_CLIENT_SECRET,
                "username": SARAH_USER,
                "password": SARAH_PASSWORD,
                "scope": "openid profile email",
            })
            if r.status_code == 200:
                sarah_token = r.json()["access_token"]
                s.update(status="ok", token_preview=sarah_token[:48] + "…")
            else:
                s.update(status="error", error=f"HTTP {r.status_code}: {r.text[:300]}")
                steps.append(s)
                return JSONResponse({"ok": False, "steps": steps})
        except Exception as exc:  # noqa: BLE001
            s.update(status="error", error=str(exc))
            steps.append(s)
            return JSONResponse({"ok": False, "steps": steps})
        steps.append(s)

        # ── Step 2: Mock scan ───────────────────────────────────────────────
        s = _s("scan",
               f"2. Scan repo → {cve} found (HIGH), decide cross-domain remediation",
               f"mock scan of {repo}")
        s.update(status="ok", result={
            "repo": repo, "cve": cve, "severity": "HIGH",
            "description": "Dependency with known RCE vulnerability",
            "decision": "cross-domain-remediation → Org B Triage",
        })
        steps.append(s)

        # ── Steps 3-6: Badge resolution (mocked — real: call identity-node) ─
        s = _s("resolve-badge",
               "3-6. Resolve VC badge from AGNTCY identity node (mocked)",
               f"GET {IDENTITY_NODE_URL}/vc/{OPENCODE_CLIENT_ID}/.well-known/vcs.json  +  /vc/verify")
        s.update(status="ok", result={
            "badge": {
                "id": OPENCODE_CLIENT_ID,
                "caps": ["scan", "remediate", "delegate"],
                "delegating_user": SARAH_EMAIL,
                "intent": "cross-domain-remediation",
                "act_chain": [OPENCODE_CLIENT_ID],
            },
            "note": "mocked — real impl: POST /vc/verify against identity-node",
        })
        steps.append(s)

        # ── Step 7: RFC 8693 token exchange at Keycloak A (mocked) ─────────
        # Real impl: POST KC_A_TOKEN_EP with grant_type=token-exchange,
        # subject_token=sarah_token, actor_token=<opencode badge JWT>
        s = _s("kc-a-exchange",
               "7. RFC 8693 exchange (subject=Sarah, actor_token=badge) → Keycloak A (mocked)",
               f"POST {KC_A_TOKEN_EP}  grant_type=token-exchange  (mocked)")
        s.update(status="ok", result={
            "note": "mocked — real: grant_type=urn:ietf:params:oauth:grant-type:token-exchange in KC-A",
            "subject": SARAH_EMAIL,
            "actor": OPENCODE_CLIENT_ID,
        })
        steps.append(s)

        # ── Step 8: Mint ID-JAG assertion for Org B triage-agent ───────────
        s = _s("mint-idjag",
               "8. Mint ID-JAG assertion for Org B triage-agent (scoped to triage:create)",
               f"POST {IDJAG_ISSUER_URL}/mint  sub={SARAH_EMAIL}  aud={KC_B_ISSUER}  scope=triage:create")
        try:
            r = await client.post(f"{IDJAG_ISSUER_URL}/mint", json={
                "sub": SARAH_EMAIL,
                "aud": KC_B_ISSUER,
                "client_id": TRIAGE_CLIENT_ID,
                "act_chain": [OPENCODE_CLIENT_ID],
                "scope": "openid triage:create",
            })
            if r.status_code == 200:
                assertion = r.json()["assertion"]
                s.update(status="ok", token_preview=assertion[:48] + "…",
                         claims=r.json().get("claims", {}))
            else:
                s.update(status="error", error=f"HTTP {r.status_code}: {r.text[:300]}")
                steps.append(s)
                return JSONResponse({"ok": False, "steps": steps})
        except Exception as exc:  # noqa: BLE001
            s.update(status="error", error=str(exc))
            steps.append(s)
            return JSONResponse({"ok": False, "steps": steps})
        steps.append(s)

        # ── Step 11: Redeem ID-JAG at Keycloak B ───────────────────────────
        s = _s("kc-b-exchange",
               "11. Redeem ID-JAG at Keycloak B → scoped access token (triage:create, Sarah propagated)",
               f"POST {KC_B_TOKEN_EP}  grant_type=jwt-bearer  client={TRIAGE_CLIENT_ID}")
        try:
            r = await client.post(KC_B_TOKEN_EP, data={
                "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                "assertion": assertion,
                "client_id": TRIAGE_CLIENT_ID,
                "client_secret": TRIAGE_CLIENT_SECRET,
                "scope": "openid triage:create",
            })
            if r.status_code == 200:
                triage_token = r.json()["access_token"]
                s.update(status="ok", token_preview=triage_token[:48] + "…")
            else:
                s.update(status="error", error=f"HTTP {r.status_code}: {r.text[:300]}")
                steps.append(s)
                return JSONResponse({"ok": False, "steps": steps})
        except Exception as exc:  # noqa: BLE001
            s.update(status="error", error=str(exc))
            steps.append(s)
            return JSONResponse({"ok": False, "steps": steps})
        steps.append(s)

        # ── Step 13: Create ticket at Triage agent ──────────────────────────
        s = _s("create-ticket",
               "13. Create remediation ticket → Triage agent (Org B)  [access token + badge + intent]",
               f"POST {TRIAGE_AGENT_URL}/api/ticket  Bearer=triage_token")
        try:
            r = await client.post(
                f"{TRIAGE_AGENT_URL}/api/ticket",
                headers={"Authorization": f"Bearer {triage_token}",
                         "Content-Type": "application/json"},
                json={
                    "cve": cve,
                    "severity": "HIGH",
                    "repo": repo,
                    "intent": "create-pr-fix",
                    "delegating_agent": OPENCODE_CLIENT_ID,
                    "act_chain": [OPENCODE_CLIENT_ID],
                },
                timeout=60,
            )
            if r.status_code in (200, 201):
                s.update(status="ok", result=r.json())
            else:
                s.update(status="error", error=f"HTTP {r.status_code}: {r.text[:300]}")
        except Exception as exc:  # noqa: BLE001
            s.update(status="error", error=str(exc))
        steps.append(s)

    return JSONResponse({
        "ok": all(_ok(s.get("status", "error")) for s in steps),
        "steps": steps,
    })
