"""Gitea gateway — enforces ID-JAG narrow scoping in front of Gitea.

The Receiving App presents the access token it obtained from Keycloak's ID-JAG
(jwt-bearer) exchange. This gateway:

  1. verifies the token (RS256 signature via Keycloak JWKS, issuer, expiry),
  2. enforces the required *narrow* scope for the operation
     (``gitea:read`` to list, ``gitea:write`` to create/push, ``gitea:pr`` to
     open pull requests),
  3. enforces a policy-level deny-list (GITEA_DENY_LIST) that blocks PR
     creation against certain repos regardless of scope — policy beats token,
  4. only then proxies to Gitea, using a server-side admin credential the
     caller never sees.

This is the "the token actually grants access to something" moment: a
read-only token can list repositories but is refused (HTTP 403) when it tries
to create one; a token with full scopes is still refused for deny-listed repos.
"""

from __future__ import annotations

import base64
import os
import secrets

import httpx
import jwt as pyjwt
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel

KEYCLOAK_URL = os.environ.get("KEYCLOAK_URL", "http://keycloak:8080").rstrip("/")
REALM = os.environ.get("KEYCLOAK_REALM", "cncf-demo")
ISSUER = os.environ.get("KEYCLOAK_ISSUER", f"{KEYCLOAK_URL}/realms/{REALM}")
JWKS_URL = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/certs"

GITEA_URL = os.environ.get("GITEA_URL", "http://gitea:3000").rstrip("/")
GITEA_ADMIN_USER = os.environ.get("GITEA_ADMIN_USER", "demo-admin")
GITEA_ADMIN_PASSWORD = os.environ.get("GITEA_ADMIN_PASSWORD", "")

READ_SCOPE = os.environ.get("GITEA_READ_SCOPE", "gitea:read")
WRITE_SCOPE = os.environ.get("GITEA_WRITE_SCOPE", "gitea:write")
PR_SCOPE = os.environ.get("GITEA_PR_SCOPE", "gitea:pr")

# Repos the gateway denies PR creation for regardless of token scope.
DENY_LIST: frozenset[str] = frozenset(
    r.strip() for r in os.environ.get("GITEA_DENY_LIST", "demo-protected").split(",") if r.strip()
)

app = FastAPI(title="CNCF Demo — Gitea Gateway", version="0.1.0")

# PyJWKClient caches keys and refreshes on unknown kid.
_jwks = pyjwt.PyJWKClient(JWKS_URL)


def _verify_token(authorization: str | None) -> dict:
    """Verify the bearer token and return its claims, or raise 401."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        signing_key = _jwks.get_signing_key_from_jwt(token)
        claims = pyjwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=ISSUER,
            # Keycloak access tokens are audience-multi; scope is what we gate on.
            options={"verify_aud": False},
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail=f"invalid token: {exc}") from exc
    return claims


def require_token(authorization: str | None = Header(default=None)) -> dict:
    return _verify_token(authorization)


def _scopes(claims: dict) -> set[str]:
    return set(str(claims.get("scope", "")).split())


def require_scope(claims: dict, needed: str) -> None:
    granted = _scopes(claims)
    if needed not in granted:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "insufficient_scope",
                "required": needed,
                "granted": sorted(granted),
                "message": f"token is missing the '{needed}' scope",
            },
        )


def _gitea_auth() -> tuple[str, str]:
    return (GITEA_ADMIN_USER, GITEA_ADMIN_PASSWORD)


class CreateRepo(BaseModel):
    name: str
    description: str = "Created via the ID-JAG demo gateway"
    private: bool = False


class OpenPR(BaseModel):
    head: str = "agent/feature-1"
    base: str = "main"
    title: str = "feat: agent-initiated changes via ID-JAG"


_AGENT_FILE_CONTENT = base64.b64encode(
    b"# Agent Work\n\nThis file was pushed by an AI coding agent using a "
    b"narrowly-scoped ID-JAG access token.\n\n"
    b"- Token scope: `gitea:write` (push only, no PR rights)\n"
    b"- Delegated by: the authenticated user via Cross-App Access\n"
).decode()


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/api/gitea/repos")
async def list_repos(claims: dict = Depends(require_token)):
    """List Gitea repositories. Requires the narrow ``gitea:read`` scope."""
    require_scope(claims, READ_SCOPE)
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"{GITEA_URL}/api/v1/repos/search",
            params={"limit": 50},
            auth=_gitea_auth(),
        )
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"gitea error: {r.text[:200]}")
    repos = [
        {
            "full_name": item.get("full_name"),
            "private": item.get("private"),
            "description": item.get("description"),
            "html_url": item.get("html_url"),
        }
        for item in r.json().get("data", [])
    ]
    return {"subject": claims.get("sub"), "scope": sorted(_scopes(claims)), "repos": repos}


@app.post("/api/gitea/repos")
async def create_repo(body: CreateRepo, claims: dict = Depends(require_token)):
    """Create a Gitea repository. Requires the ``gitea:write`` scope."""
    require_scope(claims, WRITE_SCOPE)
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"{GITEA_URL}/api/v1/user/repos",
            json={"name": body.name, "description": body.description,
                  "private": body.private, "auto_init": True},
            auth=_gitea_auth(),
        )
    if r.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail=f"gitea error: {r.text[:200]}")
    item = r.json()
    return {
        "subject": claims.get("sub"),
        "scope": sorted(_scopes(claims)),
        "created": {"full_name": item.get("full_name"), "html_url": item.get("html_url")},
    }


@app.post("/api/gitea/push/{owner}/{repo}")
async def push_file(owner: str, repo: str, claims: dict = Depends(require_token)):
    """Push AGENTS.md to a new feature branch. Requires ``gitea:write`` scope."""
    require_scope(claims, WRITE_SCOPE)
    # Randomized per push so repeat demo runs never collide with an existing branch.
    branch = f"agent/feature-{secrets.token_hex(3)}"
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"{GITEA_URL}/api/v1/repos/{owner}/{repo}/contents/AGENTS.md",
            json={
                "message": "feat: agent pushes AGENTS.md via ID-JAG scoped token",
                "content": _AGENT_FILE_CONTENT,
                "branch": "main",
                "new_branch": branch,
            },
            auth=_gitea_auth(),
        )
    if r.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail=f"gitea error: {r.text[:200]}")
    return {
        "subject": claims.get("sub"),
        "scope": sorted(_scopes(claims)),
        "pushed": {"branch": branch, "file": "AGENTS.md", "repo": f"{owner}/{repo}"},
    }


@app.post("/api/gitea/pulls/{owner}/{repo}")
async def open_pr(owner: str, repo: str, body: OpenPR, claims: dict = Depends(require_token)):
    """Open a pull request. Requires ``gitea:pr`` scope; deny-listed repos are always blocked."""
    require_scope(claims, PR_SCOPE)
    # Policy layer: deny-list blocks PRs to protected repos regardless of scope.
    if repo in DENY_LIST:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "policy_deny",
                "repo": repo,
                "reason": f"repo '{repo}' is deny-listed — policy blocks PR creation regardless of token scope",
            },
        )
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"{GITEA_URL}/api/v1/repos/{owner}/{repo}/pulls",
            json={"title": body.title, "head": body.head, "base": body.base},
            auth=_gitea_auth(),
        )
    if r.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail=f"gitea error: {r.text[:200]}")
    item = r.json()
    return {
        "subject": claims.get("sub"),
        "scope": sorted(_scopes(claims)),
        "pull_request": {
            "number": item.get("number"),
            "title": item.get("title"),
            "html_url": item.get("html_url"),
            "head": body.head,
            "base": body.base,
        },
    }
