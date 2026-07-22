"""CNCF demo web app — drives the ID-JAG (Cross-App Access) sequence.

Cross-App Access lets the **Requesting App** obtain access to the
**Receiving App** on behalf of a signed-in user, without the Receiving App
ever seeing the user's password.

All three hops run server-side so the browser never talks to Keycloak or the
issuer directly (no CORS):

  1. Requesting App login — OIDC password grant against Keycloak (cncf-demo realm)
  2. Mint ID-JAG          — request a signed assertion (for the Receiving App) from the issuer
  3. Receiving App exchange — present the assertion to Keycloak's receiving-app token
                          endpoint via the jwt-bearer grant -> access token
  4. Read Gitea           — call the gitea-gateway to LIST repos (needs gitea:read)
  5. Write Gitea          — call the gitea-gateway to CREATE a repo (needs gitea:write)
  6. Agent push           — AI agent pushes AGENTS.md to a feature branch (needs gitea:write)
  7. Agent open PR        — AI agent opens a PR on the new repo (needs gitea:pr)
  8. Agent PR (protected) — AI agent tries a PR on demo-protected; gateway deny-list blocks it
                            regardless of scope — policy beats token

The requested scope is chosen by the caller. A read-only scope causes the write
hop to be refused (HTTP 403). With write scope but no gitea:pr, the PR step is
refused. With all scopes, the protected-repo step is still refused by the
gateway's deny-list — demonstrating that policy enforcement is a layer above
token scope.

Each hop is exposed both as part of /api/run (the whole sequence at once) and
as an individual /api/step/<id> endpoint, so the UI can either animate the
sequence or let the presenter step through it one hop at a time.
"""

from __future__ import annotations

import os
import secrets

import httpx
import jwt as pyjwt
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles

KEYCLOAK_URL = os.environ.get("KEYCLOAK_URL", "http://keycloak:8080").rstrip("/")
REALM = os.environ.get("KEYCLOAK_REALM", "cncf-demo")
USER_CLIENT_ID = os.environ.get("USER_CLIENT_ID", "requesting-app")
USER_CLIENT_SECRET = os.environ.get("USER_CLIENT_SECRET", "")
BACKEND_CLIENT_ID = os.environ.get("BACKEND_CLIENT_ID", "receiving-app")
BACKEND_CLIENT_SECRET = os.environ.get("BACKEND_CLIENT_SECRET", "")
DEMO_USER = os.environ.get("DEMO_USER", "user")
DEMO_PASSWORD = os.environ.get("DEMO_PASSWORD", "")
SUBJECT = os.environ.get("IDJAG_SUBJECT", "user@example.com")
ISSUER_URL = os.environ.get("IDJAG_ISSUER_URL", "http://idjag-issuer:9000").rstrip("/")
GATEWAY_URL = os.environ.get("GITEA_GATEWAY_URL", "http://gitea-gateway:9100").rstrip("/")
GITEA_ADMIN_USER = os.environ.get("GITEA_ADMIN_USER", "demo-admin")

TOKEN_ENDPOINT = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token"
REALM_ISSUER = f"{KEYCLOAK_URL}/realms/{REALM}"

# The scope requested through the whole chain. Read-only is the default so the
# write hop demonstrates the gateway refusing an out-of-scope operation.
DEFAULT_SCOPE = "openid gitea:read"


def _default_repo_name() -> str:
    # Unique per call so repeated demo runs don't collide on an existing repo.
    return f"created-by-idjag-{secrets.token_hex(3)}"

app = FastAPI(title="CNCF Demo — ID-JAG", version="0.1.0")

_STATIC = os.path.join(os.path.dirname(__file__), "static")


def _decode(token: str) -> dict:
    try:
        header = pyjwt.get_unverified_header(token)
        claims = pyjwt.decode(token, options={"verify_signature": False})
        return {"header": header, "claims": claims}
    except Exception as exc:  # noqa: BLE001
        return {"error": f"could not decode: {exc}"}


# --- individual hops -------------------------------------------------------
# Each returns a "step" dict with status ok/error. On success it also carries
# the raw `token` (the access token, or the assertion for the mint step) so the
# next hop / the caller can reuse it.


async def _login(client: httpx.AsyncClient) -> dict:
    step = {
        "id": "login",
        "title": "1. Requesting App — user sign-in (OIDC password grant)",
        "detail": f"POST {TOKEN_ENDPOINT}  (client={USER_CLIENT_ID}, user={DEMO_USER})",
    }
    try:
        r = await client.post(
            TOKEN_ENDPOINT,
            data={
                "grant_type": "password",
                "client_id": USER_CLIENT_ID,
                "client_secret": USER_CLIENT_SECRET,
                "username": DEMO_USER,
                "password": DEMO_PASSWORD,
                "scope": "openid profile email",
            },
        )
        if r.status_code != 200:
            step.update(status="error", error=f"HTTP {r.status_code}: {r.text[:300]}")
            return step
        token = r.json()["access_token"]
        step.update(status="ok", token=token, decoded=_decode(token))
    except Exception as exc:  # noqa: BLE001
        step.update(status="error", error=str(exc))
    return step


async def _mint(client: httpx.AsyncClient, scope: str = DEFAULT_SCOPE) -> dict:
    step = {
        "id": "mint",
        "title": "2. Mint ID-JAG assertion (for the Receiving App)",
        "detail": f"POST {ISSUER_URL}/mint  (sub={SUBJECT}, aud={REALM_ISSUER}, scope={scope})",
    }
    try:
        r = await client.post(
            f"{ISSUER_URL}/mint",
            json={
                # Subject = the end user; actor = the Requesting App acting
                # on the user's behalf (RFC 8693 `act`). client_id must match
                # the client that presents the assertion (the Receiving App).
                "sub": SUBJECT,
                "aud": REALM_ISSUER,
                "client_id": BACKEND_CLIENT_ID,
                "act_chain": [USER_CLIENT_ID],
                "scope": scope,
            },
        )
        if r.status_code != 200:
            step.update(status="error", error=f"HTTP {r.status_code}: {r.text[:300]}")
            return step
        assertion = r.json()["assertion"]
        step.update(status="ok", token=assertion, decoded=_decode(assertion))
    except Exception as exc:  # noqa: BLE001
        step.update(status="error", error=str(exc))
    return step


async def _exchange(client: httpx.AsyncClient, assertion: str, scope: str = DEFAULT_SCOPE) -> dict:
    step = {
        "id": "exchange",
        "title": "3. Receiving App — exchange (Keycloak ID-JAG / jwt-bearer)",
        "detail": f"POST {TOKEN_ENDPOINT}  (grant_type=jwt-bearer, client={BACKEND_CLIENT_ID}, scope={scope})",
    }
    if not assertion:
        step.update(status="error", error="no assertion provided (run the mint step first)")
        return step
    try:
        r = await client.post(
            TOKEN_ENDPOINT,
            data={
                "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                "assertion": assertion,
                "client_id": BACKEND_CLIENT_ID,
                "client_secret": BACKEND_CLIENT_SECRET,
                "scope": scope,
            },
        )
        if r.status_code != 200:
            step.update(status="error", error=f"HTTP {r.status_code}: {r.text[:300]}")
            return step
        token = r.json()["access_token"]
        step.update(status="ok", token=token, decoded=_decode(token))
    except Exception as exc:  # noqa: BLE001
        step.update(status="error", error=str(exc))
    return step


async def _gitea_list(client: httpx.AsyncClient, access_token: str) -> dict:
    step = {
        "id": "gitea-list",
        "title": "4. Receiving App reads Gitea (needs gitea:read)",
        "detail": f"GET {GATEWAY_URL}/api/gitea/repos  (Bearer access token)",
    }
    if not access_token:
        step.update(status="error", error="no access token (run the exchange step first)")
        return step
    try:
        r = await client.get(
            f"{GATEWAY_URL}/api/gitea/repos",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if r.status_code == 200:
            step.update(status="ok", result=r.json())
        elif r.status_code == 403:
            step.update(status="denied", result=r.json())
        else:
            step.update(status="error", error=f"HTTP {r.status_code}: {r.text[:300]}")
    except Exception as exc:  # noqa: BLE001
        step.update(status="error", error=str(exc))
    return step


async def _agent_push(client: httpx.AsyncClient, access_token: str, owner: str, repo: str) -> dict:
    step = {
        "id": "agent-push",
        "title": "6. AI agent pushes file to feature branch (needs gitea:write)",
        "detail": f"POST {GATEWAY_URL}/api/gitea/push/{owner}/{repo}  (Bearer access token)",
    }
    if not access_token:
        step.update(status="error", error="no access token (run the exchange step first)")
        return step
    if not owner or not repo:
        step.update(status="denied", result={"error": "no repository to push to (create step was denied)"})
        return step
    try:
        r = await client.post(
            f"{GATEWAY_URL}/api/gitea/push/{owner}/{repo}",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if r.status_code in (200, 201):
            step.update(status="ok", result=r.json())
        elif r.status_code == 403:
            step.update(status="denied", result=r.json())
        else:
            step.update(status="error", error=f"HTTP {r.status_code}: {r.text[:300]}")
    except Exception as exc:  # noqa: BLE001
        step.update(status="error", error=str(exc))
    return step


async def _agent_pr(
    client: httpx.AsyncClient, access_token: str, owner: str, repo: str, branch: str
) -> dict:
    step = {
        "id": "agent-pr",
        "title": "7. AI agent opens PR (needs gitea:pr)",
        "detail": (
            f"POST {GATEWAY_URL}/api/gitea/pulls/{owner}/{repo}"
            f"  head={branch or 'agent/feature-1'}  (Bearer access token)"
        ),
    }
    if not access_token:
        step.update(status="error", error="no access token (run the exchange step first)")
        return step
    if not owner or not repo:
        step.update(status="denied", result={"error": "no repository available (create step was denied)"})
        return step
    try:
        r = await client.post(
            f"{GATEWAY_URL}/api/gitea/pulls/{owner}/{repo}",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "head": branch or "agent/feature-1",
                "base": "main",
                "title": "feat: agent-initiated changes via ID-JAG",
            },
        )
        if r.status_code in (200, 201):
            step.update(status="ok", result=r.json())
        elif r.status_code == 403:
            step.update(status="denied", result=r.json())
        else:
            step.update(status="error", error=f"HTTP {r.status_code}: {r.text[:300]}")
    except Exception as exc:  # noqa: BLE001
        step.update(status="error", error=str(exc))
    return step


async def _agent_pr_deny(client: httpx.AsyncClient, access_token: str, owner: str) -> dict:
    protected = "demo-protected"
    step = {
        "id": "agent-pr-deny",
        "title": "8. AI agent PR to protected repo — policy deny (deny-list beats scope)",
        "detail": (
            f"POST {GATEWAY_URL}/api/gitea/pulls/{owner}/{protected}"
            "  (Bearer — gateway deny-list blocks regardless of scope)"
        ),
    }
    if not access_token:
        step.update(status="error", error="no access token (run the exchange step first)")
        return step
    try:
        r = await client.post(
            f"{GATEWAY_URL}/api/gitea/pulls/{owner}/{protected}",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "head": "agent/feature-1",
                "base": "main",
                "title": "feat: agent tries to PR to protected repo",
            },
        )
        if r.status_code in (200, 201):
            step.update(status="ok", result=r.json())
        elif r.status_code == 403:
            step.update(status="denied", result=r.json())
        else:
            step.update(status="error", error=f"HTTP {r.status_code}: {r.text[:300]}")
    except Exception as exc:  # noqa: BLE001
        step.update(status="error", error=str(exc))
    return step


async def _gitea_create(client: httpx.AsyncClient, access_token: str, name: str) -> dict:
    step = {
        "id": "gitea-create",
        "title": "5. Receiving App writes to Gitea (needs gitea:write)",
        "detail": f"POST {GATEWAY_URL}/api/gitea/repos  name={name}  (Bearer access token)",
    }
    if not access_token:
        step.update(status="error", error="no access token (run the exchange step first)")
        return step
    try:
        r = await client.post(
            f"{GATEWAY_URL}/api/gitea/repos",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"name": name},
        )
        if r.status_code in (200, 201):
            step.update(status="ok", result=r.json())
        elif r.status_code == 403:
            # Narrow scoping payoff: a read-only token is refused here.
            step.update(status="denied", result=r.json())
        else:
            step.update(status="error", error=f"HTTP {r.status_code}: {r.text[:300]}")
    except Exception as exc:  # noqa: BLE001
        step.update(status="error", error=str(exc))
    return step


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/config")
def config():
    return {
        "keycloak": KEYCLOAK_URL,
        "realm": REALM,
        "user_client": USER_CLIENT_ID,
        "backend_client": BACKEND_CLIENT_ID,
        "demo_user": DEMO_USER,
        "subject": SUBJECT,
        "issuer": ISSUER_URL,
        "gateway": GATEWAY_URL,
        "default_scope": DEFAULT_SCOPE,
        "gitea_admin_user": GITEA_ADMIN_USER,
    }


def _ok(status: str) -> bool:
    # "denied" (a 403 from the gateway) is an expected outcome for narrow
    # scoping, not a failure of the sequence.
    return status in ("ok", "denied")


class RunRequest(BaseModel):
    scope: str = DEFAULT_SCOPE
    repo_name: str = ""


@app.post("/api/run")
async def run(body: RunRequest | None = None):
    """Run the full sequence, stopping only at an unexpected failure."""
    scope = body.scope if body else DEFAULT_SCOPE
    repo_name = (body.repo_name if body else "") or _default_repo_name()
    steps: list[dict] = []
    async with httpx.AsyncClient(timeout=15) as client:
        login = await _login(client)
        steps.append(login)
        if login["status"] != "ok":
            return JSONResponse({"ok": False, "steps": steps})

        mint = await _mint(client, scope)
        steps.append(mint)
        if mint["status"] != "ok":
            return JSONResponse({"ok": False, "steps": steps})

        exchange = await _exchange(client, mint.get("token", ""), scope)
        steps.append(exchange)
        if exchange["status"] != "ok":
            return JSONResponse({"ok": False, "steps": steps})

        access_token = exchange.get("token", "")
        gitea_list = await _gitea_list(client, access_token)
        steps.append(gitea_list)

        gitea_create = await _gitea_create(client, access_token, repo_name)
        steps.append(gitea_create)

        # Parse owner/repo from the created repo's full_name (e.g. "demo-admin/repo-name").
        full_name = (
            gitea_create.get("result", {}).get("created", {}).get("full_name", "")
            if gitea_create["status"] == "ok"
            else ""
        )
        parts = full_name.split("/", 1) if "/" in full_name else []
        repo_owner = parts[0] if len(parts) == 2 else ""
        repo_slug = parts[1] if len(parts) == 2 else ""

        agent_push = await _agent_push(client, access_token, repo_owner, repo_slug)
        steps.append(agent_push)
        pushed_branch = (
            agent_push.get("result", {}).get("pushed", {}).get("branch", "agent/feature-1")
            if agent_push["status"] == "ok"
            else "agent/feature-1"
        )

        agent_pr = await _agent_pr(client, access_token, repo_owner, repo_slug, pushed_branch)
        steps.append(agent_pr)

        agent_pr_deny = await _agent_pr_deny(client, access_token, GITEA_ADMIN_USER)
        steps.append(agent_pr_deny)

        return JSONResponse({"ok": all(_ok(s["status"]) for s in steps), "steps": steps})


class MintRequest(BaseModel):
    scope: str = DEFAULT_SCOPE


class ExchangeRequest(BaseModel):
    assertion: str
    scope: str = DEFAULT_SCOPE


class GiteaRequest(BaseModel):
    access_token: str
    repo_name: str = ""


class AgentPushRequest(BaseModel):
    access_token: str
    repo_full_name: str = ""  # "owner/repo"


class AgentPRRequest(BaseModel):
    access_token: str
    repo_full_name: str = ""  # "owner/repo"
    branch_name: str = "agent/feature-1"


class AgentPRDenyRequest(BaseModel):
    access_token: str
    repo_owner: str = ""  # falls back to GITEA_ADMIN_USER


@app.post("/api/step/login")
async def step_login():
    async with httpx.AsyncClient(timeout=15) as client:
        step = await _login(client)
    return JSONResponse({"ok": step["status"] == "ok", "step": step})


@app.post("/api/step/mint")
async def step_mint(body: MintRequest | None = None):
    scope = body.scope if body else DEFAULT_SCOPE
    async with httpx.AsyncClient(timeout=15) as client:
        step = await _mint(client, scope)
    return JSONResponse({"ok": step["status"] == "ok", "step": step})


@app.post("/api/step/exchange")
async def step_exchange(body: ExchangeRequest):
    async with httpx.AsyncClient(timeout=15) as client:
        step = await _exchange(client, body.assertion, body.scope)
    return JSONResponse({"ok": step["status"] == "ok", "step": step})


@app.post("/api/step/gitea-list")
async def step_gitea_list(body: GiteaRequest):
    async with httpx.AsyncClient(timeout=15) as client:
        step = await _gitea_list(client, body.access_token)
    return JSONResponse({"ok": _ok(step["status"]), "step": step})


@app.post("/api/step/gitea-create")
async def step_gitea_create(body: GiteaRequest):
    name = body.repo_name or _default_repo_name()
    async with httpx.AsyncClient(timeout=15) as client:
        step = await _gitea_create(client, body.access_token, name)
    return JSONResponse({"ok": _ok(step["status"]), "step": step})


@app.post("/api/step/agent-push")
async def step_agent_push(body: AgentPushRequest):
    parts = body.repo_full_name.split("/", 1) if "/" in body.repo_full_name else []
    owner, repo = (parts[0], parts[1]) if len(parts) == 2 else ("", "")
    async with httpx.AsyncClient(timeout=15) as client:
        step = await _agent_push(client, body.access_token, owner, repo)
    return JSONResponse({"ok": _ok(step["status"]), "step": step})


@app.post("/api/step/agent-pr")
async def step_agent_pr(body: AgentPRRequest):
    parts = body.repo_full_name.split("/", 1) if "/" in body.repo_full_name else []
    owner, repo = (parts[0], parts[1]) if len(parts) == 2 else ("", "")
    async with httpx.AsyncClient(timeout=15) as client:
        step = await _agent_pr(client, body.access_token, owner, repo, body.branch_name)
    return JSONResponse({"ok": _ok(step["status"]), "step": step})


@app.post("/api/step/agent-pr-deny")
async def step_agent_pr_deny(body: AgentPRDenyRequest):
    owner = body.repo_owner or GITEA_ADMIN_USER
    async with httpx.AsyncClient(timeout=15) as client:
        step = await _agent_pr_deny(client, body.access_token, owner)
    return JSONResponse({"ok": _ok(step["status"]), "step": step})


@app.get("/")
def index():
    return FileResponse(os.path.join(_STATIC, "index.html"))


app.mount("/static", StaticFiles(directory=_STATIC), name="static")
