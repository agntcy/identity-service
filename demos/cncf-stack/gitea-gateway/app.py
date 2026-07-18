"""Gitea gateway — enforces ID-JAG narrow scoping in front of Gitea.

The Receiving App presents the access token it obtained from Keycloak's ID-JAG
(jwt-bearer) exchange. This gateway:

  1. verifies the token (RS256 signature via Keycloak JWKS, issuer, expiry),
  2. enforces the required *narrow* scope for the operation
     (``gitea:read`` to list, ``gitea:write`` to create),
  3. only then proxies to Gitea, using a server-side admin credential the
     caller never sees.

This is the "the token actually grants access to something" moment: a
read-only token can list repositories but is refused (HTTP 403) when it tries
to create one.
"""

from __future__ import annotations

import os

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
