# Copyright 2026 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

# assisted-by claude code claude-sonnet-4-6
"""Cross-Domain AI Agent Remediation Demo — orchestration backend.

Drives a 25-step sequence that spans Org A (Keycloak-A, OpenCode/Sarah) and
Org B (Keycloak-B, Triage Agent, Sub-Agent) via ID-JAG assertions and A2A badges
issued by identity-node.

Endpoints
---------
GET  /                  — serve index.html
GET  /api/health        — liveness probe
GET  /api/config        — all service URLs / client IDs
POST /api/run           — run the full sequence end-to-end
POST /api/step/{id}     — run a single named step (step-through mode)
"""

from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# ── Configuration ─────────────────────────────────────────────────────────────
KC_A_URL = os.environ.get("KC_A_URL", "http://keycloak-a:8080").rstrip("/")
KC_A_REALM = os.environ.get("KC_A_REALM", "org-a")
KC_B_URL = os.environ.get("KC_B_URL", "http://keycloak-b:8080").rstrip("/")
KC_B_REALM = os.environ.get("KC_B_REALM", "org-b")

OPENCODE_CLIENT_ID = os.environ.get("OPENCODE_CLIENT_ID", "opencode-agent")
OPENCODE_CLIENT_SECRET = os.environ.get("OPENCODE_CLIENT_SECRET", "")
TRIAGE_CLIENT_ID = os.environ.get("TRIAGE_CLIENT_ID", "triage-agent")
TRIAGE_CLIENT_SECRET = os.environ.get("TRIAGE_CLIENT_SECRET", "")

SARAH_USER = os.environ.get("SARAH_USER", "sarah")
SARAH_PASSWORD = os.environ.get("SARAH_PASSWORD", "sarah")
SARAH_EMAIL = os.environ.get("SARAH_EMAIL", "sarah@org-a.example")

IDJAG_ISSUER_URL = os.environ.get("IDJAG_ISSUER_URL", "http://idjag-issuer:9000").rstrip("/")
IDENTITY_NODE_URL = os.environ.get("IDENTITY_NODE_URL", "http://identity-node:4000").rstrip("/")
TRIAGE_AGENT_URL = os.environ.get("TRIAGE_AGENT_URL", "http://triage-agent:8200").rstrip("/")
DIR_APISERVER_URL = os.environ.get("DIR_APISERVER_URL", "")  # e.g. "dir-apiserver:8888"

# CIMD — org-a's local trust authority, backed by a Vault transit signing key
# (see identity-node-init.py for the registration bootstrap this depends on).
VAULT_ADDR = os.environ.get("VAULT_ADDR", "http://identity-vault:8200").rstrip("/")
VAULT_TOKEN = os.environ.get("VAULT_TOKEN", "")
VAULT_KEY_NAME = os.environ.get("VAULT_KEY_NAME", "org-a-issuer")
ORG_A_COMMON_NAME = os.environ.get("ORG_A_COMMON_NAME", "org-a")

SCAN_REPO = os.environ.get("SCAN_REPO", "demo-admin/payments-service")

KC_A_ISSUER = f"{KC_A_URL}/realms/{KC_A_REALM}"
KC_B_ISSUER = f"{KC_B_URL}/realms/{KC_B_REALM}"
KC_A_TOKEN_URL = f"{KC_A_ISSUER}/protocol/openid-connect/token"
KC_B_TOKEN_URL = f"{KC_B_ISSUER}/protocol/openid-connect/token"

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Cross-Domain Demo", version="0.1.0")


# ── Pydantic models for step-through bodies ───────────────────────────────────

class ScanBody(BaseModel):
    cve: str = "CVE-2024-12345"


class CimdGenerateBody(BaseModel):
    sub: str = "triage-agent"


class CimdResolveBody(BaseModel):
    id: str = "AGNTCY-triage-agent"


class KcAExchangeBody(BaseModel):
    token: str  # Sarah's KC-A token (unused — mocked)


class MintIdjagBody(BaseModel):
    sarah_email: str = SARAH_EMAIL


class KcBExchangeBody(BaseModel):
    assertion: str  # ID-JAG JWT from mint step


class CreateTicketBody(BaseModel):
    triage_token: str
    cve: str = "CVE-2024-12345"
    repo: str = SCAN_REPO


class RunBody(BaseModel):
    cve: str = "CVE-2024-12345"
    repo: str = SCAN_REPO


class DirPushBody(BaseModel):
    cve: str = "CVE-2024-12345"
    repo: str = SCAN_REPO


class DirSearchBody(BaseModel):
    agent_name: str = "triage-agent"


# ── Step helpers ──────────────────────────────────────────────────────────────

def _step(
    step_id: str,
    title: str,
    *,
    status: str = "ok",
    detail: str = "",
    result: Any = None,
    error: str = "",
) -> dict:
    s: dict = {"id": step_id, "title": title, "status": status}
    if detail:
        s["detail"] = detail
    if result is not None:
        s["result"] = result
    if error:
        s["error"] = error
    return s


# ── Step implementations ───────────────────────────────────────────────────────

async def _login(client: httpx.AsyncClient) -> dict:
    """Step 1 — KC-A password grant for Sarah (opencode-agent client)."""
    try:
        r = await client.post(
            KC_A_TOKEN_URL,
            data={
                "grant_type": "password",
                "client_id": OPENCODE_CLIENT_ID,
                "client_secret": OPENCODE_CLIENT_SECRET,
                "username": SARAH_USER,
                "password": SARAH_PASSWORD,
                "scope": "openid",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if r.status_code == 200:
            data = r.json()
            token = data["access_token"]
            return _step(
                "sarah-login",
                "1. Sarah logs in → KC-A issues access token (opencode-agent client)",
                detail=f"POST {KC_A_TOKEN_URL}  grant=password  client={OPENCODE_CLIENT_ID}",
                result={"token_preview": token[:48] + "…", "token": token, "token_type": data.get("token_type", "Bearer")},
                status="ok",
            )
        return _step(
            "sarah-login",
            "1. Sarah logs in → KC-A",
            status="error",
            error=f"HTTP {r.status_code}: {r.text[:300]}",
        )
    except Exception as exc:  # noqa: BLE001
        return _step("sarah-login", "1. Sarah logs in → KC-A", status="error", error=str(exc))


def _scan(cve: str) -> dict:
    """Step 2 — Synthetic CVE scan (mock; no network call needed)."""
    return _step(
        "scan",
        f"2. Scan detects {cve} in {SCAN_REPO}",
        detail=f"repo={SCAN_REPO}  severity=HIGH  cve={cve}",
        result={"cve": cve, "severity": "HIGH", "repo": SCAN_REPO, "note": "mocked scanner"},
        status="ok",
    )


OASF_SCHEMA_VERSION = "1.1.0"


async def _dir_push_turn(cve: str, repo: str) -> dict:
    """Step 3 — Push per-turn record to AGNTCY Directory Node → CID."""
    if not DIR_APISERVER_URL:
        return _step(
            "dir-push",
            "3. Directory: push turn record (skipped — DIR_APISERVER_URL not set)",
            status="ok",
            result={"cid": "", "note": "directory not configured"},
        )
    try:
        import grpc
        from datetime import datetime, timezone
        from agntcy.dir.core.v1 import record_pb2
        from agntcy.dir.store.v1 import store_service_pb2_grpc
        from google.protobuf import struct_pb2
        import asyncio

        record_dict = {
            "name": "opencode-agent",
            "version": "0.1.0",
            "schema_version": OASF_SCHEMA_VERSION,
            "description": f"OpenCode agent turn: {cve} in {repo}",
            "authors": ["cross-domain-demo"],
            "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "skills": [
                {"name": "cybersecurity/vulnerability_management/dependency_security", "id": 100304},
                {"name": "software_engineering/code_quality/code_review", "id": 60701},
            ],
            "domains": [
                {"name": "technology/security", "id": 107},
            ],
            "annotations": {"cve": cve, "repo": repo, "turn": "remediation"},
        }
        record_data = struct_pb2.Struct()
        record_data.update(record_dict)
        record = record_pb2.Record(data=record_data)

        def _push():
            channel = grpc.insecure_channel(DIR_APISERVER_URL)
            stub = store_service_pb2_grpc.StoreServiceStub(channel)
            refs = list(stub.Push(iter([record])))
            channel.close()
            return refs

        refs = await asyncio.get_event_loop().run_in_executor(None, _push)
        cid = refs[0].cid if refs else ""
        return _step(
            "dir-push",
            "3. Directory: push OpenCode turn record → CID",
            detail=f"gRPC Push({DIR_APISERVER_URL})  schema_version={OASF_SCHEMA_VERSION}  cve={cve}  repo={repo}",
            status="ok",
            result={"cid": cid, "schema_version": OASF_SCHEMA_VERSION, "agent": "opencode-agent", "record": record_dict},
        )
    except Exception as exc:  # noqa: BLE001
        return _step("dir-push", "3. Directory: push turn record", status="error", error=str(exc))


async def _dir_search(agent_name: str = "triage-agent") -> dict:
    """Step 4 — Search AGNTCY Directory for triage-agent OASF record."""
    if not DIR_APISERVER_URL:
        return _step(
            "dir-search",
            "4. Directory: search for triage-agent (skipped — DIR_APISERVER_URL not set)",
            status="ok",
            result={"found": False, "cid": "", "note": "directory not configured"},
        )
    try:
        import grpc
        from agntcy.dir.search.v1 import search_service_pb2, search_service_pb2_grpc
        import asyncio

        req = search_service_pb2.SearchRecordsRequest(
            queries=[search_service_pb2.RecordQuery(
                type=search_service_pb2.RECORD_QUERY_TYPE_NAME,
                value=agent_name,
            )],
            limit=5,
        )

        def _search():
            channel = grpc.insecure_channel(DIR_APISERVER_URL)
            stub = search_service_pb2_grpc.SearchServiceStub(channel)
            results = list(stub.SearchRecords(req))
            channel.close()
            return results

        results = await asyncio.get_event_loop().run_in_executor(None, _search)
        found = len(results) > 0
        record_name = ""
        record_dict: dict = {}
        if found:
            from google.protobuf.json_format import MessageToDict
            record_dict = MessageToDict(results[0].record.data)
            record_name = record_dict.get("name", "")
        return _step(
            "dir-search",
            f"4. Directory: search for {agent_name} → {'found' if found else 'not found'}",
            detail=f"gRPC SearchRecords({DIR_APISERVER_URL})  name={agent_name}",
            status="ok",
            result={"found": found, "record_name": record_name, "count": len(results), "record": record_dict},
        )
    except Exception as exc:  # noqa: BLE001
        return _step("dir-search", f"4. Directory: search for {agent_name}", status="error", error=str(exc))


# ── CIMD — Vault-backed local trust authority (org-a) ─────────────────────────
#
# identity-node's real REST API needs a self-issued "proof" JWT to call
# /v1alpha1/id/generate or /v1alpha1/id/resolve: iss=agntcy:org-a, a sub_jwk
# claim, signed by the SAME keypair org-a registered at bootstrap time
# (identity-node-init.py). The private key never leaves Vault — every proof
# is signed via Vault's /transit/sign API.

_org_a_jwk_cache: dict | None = None


def _b64url(data: bytes) -> str:
    import base64
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


async def _vault_get_org_a_jwk(client: httpx.AsyncClient) -> dict:
    """Fetch (and cache) org-a's public key from Vault transit, as a JWK."""
    global _org_a_jwk_cache
    if _org_a_jwk_cache is not None:
        return _org_a_jwk_cache

    import base64

    r = await client.get(
        f"{VAULT_ADDR}/v1/transit/keys/{VAULT_KEY_NAME}",
        headers={"X-Vault-Token": VAULT_TOKEN},
    )
    r.raise_for_status()
    keys = r.json()["data"]["keys"]
    latest_version = max(keys, key=int)
    pem = keys[latest_version]["public_key"]

    lines = [ln for ln in pem.strip().splitlines() if "BEGIN" not in ln and "END" not in ln]
    der = base64.b64decode("".join(lines))

    def read_len(data: bytes, off: int) -> tuple[int, int]:
        first = data[off]
        if first & 0x80 == 0:
            return first, off + 1
        n = first & 0x7F
        return int.from_bytes(data[off + 1:off + 1 + n], "big"), off + 1 + n

    def read_tlv(data: bytes, off: int) -> tuple[int, bytes, int]:
        length, val_off = read_len(data, off + 1)
        return data[off], data[val_off:val_off + length], val_off + length

    _, outer_seq, _ = read_tlv(der, 0)
    _, _alg_id, off2 = read_tlv(outer_seq, 0)
    _, bitstring, _ = read_tlv(outer_seq, off2)
    inner = bitstring[1:]  # drop "unused bits" byte
    _, rsa_pub_seq, _ = read_tlv(inner, 0)
    _, n_bytes, off3 = read_tlv(rsa_pub_seq, 0)
    _, e_bytes, _ = read_tlv(rsa_pub_seq, off3)

    def strip_leading_zero(b: bytes) -> bytes:
        return b[1:] if len(b) > 1 and b[0] == 0 else b

    kid = f"{VAULT_KEY_NAME}-v1"
    _org_a_jwk_cache = {
        "kty": "RSA",
        "n": _b64url(strip_leading_zero(n_bytes)),
        "e": _b64url(strip_leading_zero(e_bytes)),
        "alg": "RS256",
        "use": "sig",
        "kid": kid,
    }
    return _org_a_jwk_cache


async def _vault_sign_rs256(client: httpx.AsyncClient, signing_input: str) -> str:
    """Sign `signing_input` (RS256/PKCS1v15/SHA-256) via Vault transit — key never leaves Vault."""
    import base64

    input_b64 = base64.b64encode(signing_input.encode()).decode()
    r = await client.post(
        f"{VAULT_ADDR}/v1/transit/sign/{VAULT_KEY_NAME}",
        json={"input": input_b64, "hash_algorithm": "sha2-256", "signature_algorithm": "pkcs1v15"},
        headers={"X-Vault-Token": VAULT_TOKEN},
    )
    r.raise_for_status()
    vault_sig = r.json()["data"]["signature"]  # "vault:v1:<base64-std>"
    sig_bytes = base64.b64decode(vault_sig.split(":", 2)[2])
    return _b64url(sig_bytes)


async def _build_proof_jwt(client: httpx.AsyncClient, sub: str) -> str:
    """Self-issued proof JWT: iss=agntcy:org-a, sub=<agent>, signed via Vault."""
    import json
    import time
    import uuid

    jwk = await _vault_get_org_a_jwk(client)
    header = {"alg": "RS256", "typ": "JWT", "kid": jwk["kid"]}
    now = int(time.time())
    payload = {
        "iss": f"agntcy:{ORG_A_COMMON_NAME}",
        "sub": sub,
        "aud": [sub],
        "exp": now + 3600,
        "iat": now,
        "jti": str(uuid.uuid4()),
        "sub_jwk": jwk,
    }
    header_b64 = _b64url(json.dumps(header, separators=(",", ":")).encode())
    payload_b64 = _b64url(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{header_b64}.{payload_b64}"
    signature = await _vault_sign_rs256(client, signing_input)
    return f"{signing_input}.{signature}"


async def _cimd_generate_id(client: httpx.AsyncClient, sub: str = "triage-agent") -> dict:
    """Step 5 — Generate a CIMD id for triage-agent under org-a's trust authority.

    Vault self-signs a proof JWT (iss=agntcy:org-a, sub=triage-agent);
    identity-node verifies it against org-a's registered public key and mints
    an id of the form AGNTCY-<sub>, idempotent via ERROR_REASON_ID_ALREADY_REGISTERED.
    """
    url = f"{IDENTITY_NODE_URL}/v1alpha1/id/generate"
    try:
        proof_jwt = await _build_proof_jwt(client, sub)
        r = await client.post(url, json={
            "issuer": {"organization": ORG_A_COMMON_NAME, "commonName": ORG_A_COMMON_NAME},
            "proof": {"type": "JWT", "proofValue": proof_jwt},
        })
        if r.status_code == 200:
            data = r.json()
            rm = data.get("resolverMetadata", {})
            return _step(
                "cimd-generate-id",
                f"5. CIMD: generate id for {sub} (Vault-signed proof, org-a trust authority)",
                detail=f"POST {url}  iss=agntcy:{ORG_A_COMMON_NAME}  sub={sub}",
                status="ok",
                result={"id": rm.get("id", ""), "controller": rm.get("controller", "")},
            )
        if r.status_code == 400 and "ID_ALREADY_REGISTERED" in r.text:
            existing_id = f"AGNTCY-{sub}"
            return _step(
                "cimd-generate-id",
                f"5. CIMD: generate id for {sub} (already registered — reusing)",
                detail=f"POST {url}  iss=agntcy:{ORG_A_COMMON_NAME}  sub={sub}",
                status="ok",
                result={"id": existing_id, "note": "already registered"},
            )
        return _step(
            "cimd-generate-id",
            f"5. CIMD: generate id for {sub}",
            status="error",
            error=f"HTTP {r.status_code}: {r.text[:300]}",
        )
    except Exception as exc:  # noqa: BLE001
        return _step("cimd-generate-id", f"5. CIMD: generate id for {sub}", status="error", error=str(exc))


async def _cimd_resolve_id(client: httpx.AsyncClient, cimd_id: str) -> dict:
    """Step 6 — Resolve the CIMD id back to its ResolverMetadata (VerificationMethod JWK)."""
    url = f"{IDENTITY_NODE_URL}/v1alpha1/id/resolve"
    try:
        r = await client.post(url, json={"id": cimd_id})
        if r.status_code == 200:
            data = r.json()
            rm = data.get("resolverMetadata", {})
            vm = (rm.get("verificationMethod") or [{}])[0]
            return _step(
                "cimd-resolve-id",
                f"6. CIMD: resolve id {cimd_id} → ResolverMetadata",
                detail=f"POST {url}  id={cimd_id}",
                status="ok",
                result={
                    "id": rm.get("id", ""),
                    "controller": rm.get("controller", ""),
                    "verification_method_id": vm.get("id", ""),
                    "public_key_kid": (vm.get("publicKeyJwk") or {}).get("kid", ""),
                },
            )
        return _step(
            "cimd-resolve-id",
            f"6. CIMD: resolve id {cimd_id}",
            status="error",
            error=f"HTTP {r.status_code}: {r.text[:300]}",
        )
    except Exception as exc:  # noqa: BLE001
        return _step("cimd-resolve-id", f"6. CIMD: resolve id {cimd_id}", status="error", error=str(exc))


async def _kc_a_exchange(_client: httpx.AsyncClient) -> dict:
    """Step 7 — RFC 8693 token exchange at KC-A (mocked)."""
    return _step(
        "kc-a-exchange",
        "7. KC-A: RFC 8693 token exchange — Sarah token → opencode-agent actor token",
        detail="mocked — real impl: token-exchange grant at KC-A",
        status="ok",
        result={"note": "mocked; real: POST KC_A_TOKEN_URL grant_type=urn:ietf:params:oauth:grant-type:token-exchange"},
    )


async def _mint_idjag(client: httpx.AsyncClient, sarah_email: str) -> dict:
    """Step 8 — Mint an ID-JAG assertion at idjag-issuer."""
    url = f"{IDJAG_ISSUER_URL}/mint"
    payload = {
        "sub": sarah_email,
        "aud": KC_B_ISSUER,
        "client_id": TRIAGE_CLIENT_ID,
        "act_chain": [OPENCODE_CLIENT_ID],
        "scope": "openid triage:create",
    }
    try:
        r = await client.post(url, json=payload)
        if r.status_code == 200:
            data = r.json()
            assertion: str = data.get("assertion", "")
            return _step(
                "mint-idjag",
                "8. Mint ID-JAG assertion → idjag-issuer (act_chain: opencode-agent → triage-agent)",
                detail=f"POST {url}  sub={sarah_email}  aud={KC_B_ISSUER}  scope=openid triage:create",
                status="ok",
                result={
                    "assertion_preview": assertion[:48] + "…" if assertion else "",
                    "assertion": assertion,
                    "claims": data.get("claims", {}),
                },
            )
        return _step(
            "mint-idjag",
            "8. Mint ID-JAG assertion",
            status="error",
            error=f"HTTP {r.status_code}: {r.text[:300]}",
        )
    except Exception as exc:  # noqa: BLE001
        return _step("mint-idjag", "8. Mint ID-JAG assertion", status="error", error=str(exc))


async def _kc_b_exchange(client: httpx.AsyncClient, assertion: str) -> dict:
    """Step 9 — KC-B jwt-bearer grant to get triage-agent access token."""
    try:
        r = await client.post(
            KC_B_TOKEN_URL,
            data={
                "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                "assertion": assertion,
                "client_id": TRIAGE_CLIENT_ID,
                "client_secret": TRIAGE_CLIENT_SECRET,
                "scope": "triage:create",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if r.status_code == 200:
            data = r.json()
            token: str = data["access_token"]
            step = _step(
                "kc-b-exchange",
                "9. KC-B: jwt-bearer exchange — ID-JAG assertion → triage-agent access token",
                detail=f"POST {KC_B_TOKEN_URL}  grant=jwt-bearer  client={TRIAGE_CLIENT_ID}  scope=triage:create",
                status="ok",
                result={
                    "token_preview": token[:48] + "…",
                    "token": token,
                    "token_type": data.get("token_type", "Bearer"),
                    "scope": data.get("scope", ""),
                },
            )
            step["_token"] = token  # used internally to chain into create-ticket (assertions are single-use)
            return step
        return _step(
            "kc-b-exchange",
            "9. KC-B: jwt-bearer exchange",
            status="error",
            error=f"HTTP {r.status_code}: {r.text[:300]}",
        )
    except Exception as exc:  # noqa: BLE001
        return _step("kc-b-exchange", "9. KC-B: jwt-bearer exchange", status="error", error=str(exc))


async def _create_ticket(
    client: httpx.AsyncClient,
    triage_token: str,
    cve: str,
    repo: str,
) -> list[dict]:
    """Step 10+ — POST /api/ticket to triage-agent; flatten all nested steps.

    Returns a list of dicts: the create-ticket wrapper step followed by every
    sub-step from the triage-agent response (including sub-agent steps).
    """
    url = f"{TRIAGE_AGENT_URL}/api/ticket"
    wrapper = _step(
        "create-ticket",
        f"10. Send remediation ticket → triage-agent (cve={cve}, repo={repo})",
        detail=f"POST {url}",
    )
    try:
        r = await client.post(
            url,
            json={
                "cve": cve,
                "severity": "HIGH",
                "repo": repo,
                "intent": "create-pr-fix",
                "delegating_agent": OPENCODE_CLIENT_ID,
                "act_chain": [OPENCODE_CLIENT_ID],
            },
            headers={"Authorization": f"Bearer {triage_token}"},
            timeout=90,
        )
        if r.status_code in (200, 201):
            triage_data = r.json()
            ticket_id = triage_data.get("ticket_id", "")
            wrapper["status"] = "ok" if triage_data.get("ok") else "error"
            wrapper["result"] = {"ticket_id": ticket_id, "ok": triage_data.get("ok")}

            # Flatten triage-agent steps
            nested_steps: list[dict] = []
            for ts in triage_data.get("steps", []):
                nested_steps.append(ts)
                # Also flatten sub-agent steps from spawn-sub-agent result
                if ts.get("id") == "spawn-sub-agent" and isinstance(ts.get("result"), dict):
                    for ss in ts["result"].get("steps", []):
                        nested_steps.append(ss)

            return [wrapper] + nested_steps
        wrapper["status"] = "error"
        wrapper["error"] = f"HTTP {r.status_code}: {r.text[:300]}"
        return [wrapper]
    except Exception as exc:  # noqa: BLE001
        wrapper["status"] = "error"
        wrapper["error"] = str(exc)
        return [wrapper]


# ── Full run ──────────────────────────────────────────────────────────────────

@app.post("/api/run")
async def run_all(body: RunBody) -> JSONResponse:
    """Run the complete cross-domain remediation sequence."""
    steps: list[dict] = []

    async with httpx.AsyncClient(timeout=30) as client:
        # 1. Sarah login
        login_step = await _login(client)
        steps.append(login_step)
        if login_step["status"] != "ok":
            return JSONResponse({"ok": False, "steps": steps})
        sarah_token: str = login_step["result"]["token_preview"]  # preview only in result
        # Re-fetch full token (re-run login for the actual token value)
        try:
            r = await client.post(
                KC_A_TOKEN_URL,
                data={
                    "grant_type": "password",
                    "client_id": OPENCODE_CLIENT_ID,
                    "client_secret": OPENCODE_CLIENT_SECRET,
                    "username": SARAH_USER,
                    "password": SARAH_PASSWORD,
                    "scope": "openid",
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            sarah_token = r.json()["access_token"]
        except Exception:  # noqa: BLE001
            pass

        # 2. Scan
        steps.append(_scan(body.cve))

        # 3. Push turn record to directory
        dir_push_step = await _dir_push_turn(body.cve, body.repo)
        steps.append(dir_push_step)

        # 4. Search directory for triage-agent
        dir_search_step = await _dir_search("triage-agent")
        steps.append(dir_search_step)

        # 5. CIMD: generate id for triage-agent (Vault-signed proof, org-a trust authority)
        generate_step = await _cimd_generate_id(client, "triage-agent")
        steps.append(generate_step)
        cimd_id: str = (generate_step.get("result") or {}).get("id", "AGNTCY-triage-agent")

        # 6. CIMD: resolve id back to its ResolverMetadata
        steps.append(await _cimd_resolve_id(client, cimd_id))

        # 7. KC-A exchange (mocked)
        steps.append(await _kc_a_exchange(client))

        # 8. Mint ID-JAG assertion
        mint_step = await _mint_idjag(client, SARAH_EMAIL)
        steps.append(mint_step)
        if mint_step["status"] != "ok":
            return JSONResponse({"ok": False, "steps": steps})
        # Retrieve full assertion (stored in result→assertion_preview is truncated; re-mint)
        assertion = ""
        try:
            r2 = await client.post(f"{IDJAG_ISSUER_URL}/mint", json={
                "sub": SARAH_EMAIL,
                "aud": KC_B_ISSUER,
                "client_id": TRIAGE_CLIENT_ID,
                "act_chain": [OPENCODE_CLIENT_ID],
                "scope": "openid triage:create",
            })
            assertion = r2.json().get("assertion", "")
        except Exception:  # noqa: BLE001
            pass

        # 9. KC-B jwt-bearer exchange (assertions are single-use — one call only)
        exchange_step = await _kc_b_exchange(client, assertion)
        triage_token = exchange_step.pop("_token", "")
        steps.append(exchange_step)
        if exchange_step["status"] != "ok":
            return JSONResponse({"ok": False, "steps": steps})

        # 10+. Create ticket + all nested steps
        ticket_steps = await _create_ticket(client, triage_token, body.cve, body.repo)
        steps.extend(ticket_steps)

    all_ok = all(s.get("status") in ("ok", "denied") for s in steps)
    return JSONResponse({"ok": all_ok, "steps": steps})


# ── Individual step endpoints (step-through mode) ─────────────────────────────

@app.post("/api/step/sarah-login")
async def step_sarah_login() -> JSONResponse:
    async with httpx.AsyncClient(timeout=30) as client:
        return JSONResponse(await _login(client))


@app.post("/api/step/scan")
async def step_scan(body: ScanBody) -> JSONResponse:
    return JSONResponse(_scan(body.cve))


@app.post("/api/step/cimd-generate-id")
async def step_cimd_generate_id(body: CimdGenerateBody) -> JSONResponse:
    async with httpx.AsyncClient(timeout=30) as client:
        return JSONResponse(await _cimd_generate_id(client, body.sub))


@app.post("/api/step/cimd-resolve-id")
async def step_cimd_resolve_id(body: CimdResolveBody) -> JSONResponse:
    async with httpx.AsyncClient(timeout=30) as client:
        return JSONResponse(await _cimd_resolve_id(client, body.id))


@app.post("/api/step/kc-a-exchange")
async def step_kc_a_exchange(body: KcAExchangeBody) -> JSONResponse:
    async with httpx.AsyncClient(timeout=30) as client:
        return JSONResponse(await _kc_a_exchange(client))


@app.post("/api/step/mint-idjag")
async def step_mint_idjag(body: MintIdjagBody) -> JSONResponse:
    async with httpx.AsyncClient(timeout=30) as client:
        return JSONResponse(await _mint_idjag(client, body.sarah_email))


@app.post("/api/step/kc-b-exchange")
async def step_kc_b_exchange(body: KcBExchangeBody) -> JSONResponse:
    async with httpx.AsyncClient(timeout=30) as client:
        return JSONResponse(await _kc_b_exchange(client, body.assertion))


@app.post("/api/step/dir-push")
async def step_dir_push(body: DirPushBody) -> JSONResponse:
    return JSONResponse(await _dir_push_turn(body.cve, body.repo))


@app.post("/api/step/dir-search")
async def step_dir_search(body: DirSearchBody) -> JSONResponse:
    return JSONResponse(await _dir_search(body.agent_name))


@app.post("/api/step/create-ticket")
async def step_create_ticket(body: CreateTicketBody) -> JSONResponse:
    async with httpx.AsyncClient(timeout=90) as client:
        ticket_steps = await _create_ticket(client, body.triage_token, body.cve, body.repo)
    return JSONResponse({"steps": ticket_steps})


# ── Utility endpoints ─────────────────────────────────────────────────────────

@app.get("/api/health")
def health() -> JSONResponse:
    return JSONResponse({"status": "ok"})


@app.get("/api/config")
def config() -> JSONResponse:
    return JSONResponse({
        "kc_a_url": KC_A_URL,
        "kc_a_realm": KC_A_REALM,
        "kc_a_issuer": KC_A_ISSUER,
        "kc_b_url": KC_B_URL,
        "kc_b_realm": KC_B_REALM,
        "kc_b_issuer": KC_B_ISSUER,
        "opencode_client_id": OPENCODE_CLIENT_ID,
        "triage_client_id": TRIAGE_CLIENT_ID,
        "sarah_user": SARAH_USER,
        "sarah_email": SARAH_EMAIL,
        "idjag_issuer_url": IDJAG_ISSUER_URL,
        "identity_node_url": IDENTITY_NODE_URL,
        "triage_agent_url": TRIAGE_AGENT_URL,
        "dir_apiserver_url": DIR_APISERVER_URL or "not configured",
        "org_a_common_name": ORG_A_COMMON_NAME,
        "vault_key_name": VAULT_KEY_NAME,
        "scan_repo": SCAN_REPO,
    })


# ── Static files & SPA root ───────────────────────────────────────────────────

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def index() -> FileResponse:
    return FileResponse("static/index.html")
