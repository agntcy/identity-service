"""Unit tests for the Gitea gateway.

These focus on the security contract the demo depends on: the token is verified
(RS256 via JWKS, issuer, expiry) and the *narrow* scope is enforced before any
call reaches Gitea. Gitea itself is mocked with respx.
"""

import time
import types

import httpx
import jwt as pyjwt
import pytest
import respx
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient

import app as gw

client = TestClient(gw.app)

_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_PRIV_PEM = _KEY.private_bytes(
    serialization.Encoding.PEM,
    serialization.PrivateFormat.PKCS8,
    serialization.NoEncryption(),
)
_PUB_PEM = _KEY.public_key().public_bytes(
    serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
)


@pytest.fixture(autouse=True)
def _patch_jwks(monkeypatch):
    """Return our test public key for any token, mimicking a JWKS lookup."""
    fake = types.SimpleNamespace(
        get_signing_key_from_jwt=lambda token: types.SimpleNamespace(key=_PUB_PEM)
    )
    monkeypatch.setattr(gw, "_jwks", fake)


def _token(scope="gitea:read", iss=None, exp_delta=300) -> str:
    now = int(time.time())
    payload = {
        "iss": iss or gw.ISSUER,
        "sub": "user@example.com",
        "iat": now,
        "exp": now + exp_delta,
        "scope": scope,
    }
    return pyjwt.encode(payload, _PRIV_PEM, algorithm="RS256")


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_healthz():
    assert client.get("/healthz").json() == {"status": "ok"}


def test_list_requires_bearer_token():
    assert client.get("/api/gitea/repos").status_code == 401


def test_list_rejects_garbage_token():
    assert client.get("/api/gitea/repos", headers=_auth("not-a-jwt")).status_code == 401


def test_list_rejects_wrong_issuer():
    tok = _token(scope="gitea:read", iss="http://evil/realms/other")
    assert client.get("/api/gitea/repos", headers=_auth(tok)).status_code == 401


def test_list_rejects_expired_token():
    tok = _token(scope="gitea:read", exp_delta=-10)
    assert client.get("/api/gitea/repos", headers=_auth(tok)).status_code == 401


def test_list_denied_without_read_scope():
    tok = _token(scope="openid profile")
    r = client.get("/api/gitea/repos", headers=_auth(tok))
    assert r.status_code == 403
    assert r.json()["detail"]["required"] == "gitea:read"


@respx.mock
def test_list_ok_with_read_scope():
    respx.get(f"{gw.GITEA_URL}/api/v1/repos/search").mock(
        return_value=httpx.Response(200, json={"data": [
            {"full_name": "demo/payments", "private": False, "description": "d", "html_url": "u"},
        ]})
    )
    tok = _token(scope="openid gitea:read")
    r = client.get("/api/gitea/repos", headers=_auth(tok))
    assert r.status_code == 200
    body = r.json()
    assert body["repos"][0]["full_name"] == "demo/payments"
    assert "gitea:read" in body["scope"]


def test_create_denied_without_write_scope():
    """The narrow-scoping payoff: a read-only token cannot create a repo."""
    tok = _token(scope="openid gitea:read")
    r = client.post("/api/gitea/repos", headers=_auth(tok), json={"name": "x"})
    assert r.status_code == 403
    assert r.json()["detail"]["required"] == "gitea:write"


@respx.mock
def test_create_ok_with_write_scope():
    route = respx.post(f"{gw.GITEA_URL}/api/v1/user/repos").mock(
        return_value=httpx.Response(201, json={"full_name": "demo/new", "html_url": "u"})
    )
    tok = _token(scope="openid gitea:read gitea:write")
    r = client.post("/api/gitea/repos", headers=_auth(tok), json={"name": "new"})
    assert r.status_code == 200
    assert r.json()["created"]["full_name"] == "demo/new"
    assert route.called
