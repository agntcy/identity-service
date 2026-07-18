"""Unit tests for the CNCF demo web app.

The three-hop /api/run orchestration is exercised with respx, mocking the
outbound calls to Keycloak (token endpoint) and the ID-JAG issuer, so the
tests are fast and require no running stack.
"""

import time

import httpx
import jwt as pyjwt
import respx
from fastapi.testclient import TestClient

import app as webapp

client = TestClient(webapp.app)


def _jwt(**claims) -> str:
    payload = {"iat": int(time.time()), "exp": int(time.time()) + 300, **claims}
    return pyjwt.encode(payload, "test-secret", algorithm="HS256")


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_config_uses_renamed_defaults():
    cfg = client.get("/api/config").json()
    assert cfg["user_client"] == "requesting-app"
    assert cfg["backend_client"] == "receiving-app"
    assert cfg["demo_user"] == "user"
    assert cfg["subject"] == "user@example.com"
    assert cfg["realm"] == "cncf-demo"


def test_index_served():
    r = client.get("/")
    assert r.status_code == 200
    assert "Cross-App Access" in r.text


def test_decode_valid_and_invalid():
    ok = webapp._decode(_jwt(sub="user@example.com"))
    assert ok["claims"]["sub"] == "user@example.com"
    assert ok["header"]["alg"] == "HS256"
    assert "error" in webapp._decode("not-a-jwt")


@respx.mock
def test_run_happy_path():
    login = _jwt(sub="uid-123", azp="requesting-app", preferred_username="user")
    exchanged = _jwt(sub="uid-123", azp="receiving-app", preferred_username="user")
    mint_assertion = _jwt(sub="user@example.com", aud=webapp.REALM_ISSUER, azp="receiving-app")

    # Steps 1 and 3 both POST the token endpoint (password grant, then jwt-bearer).
    respx.post(webapp.TOKEN_ENDPOINT).mock(
        side_effect=[
            httpx.Response(200, json={"access_token": login}),
            httpx.Response(200, json={"access_token": exchanged}),
        ]
    )
    respx.post(f"{webapp.ISSUER_URL}/mint").mock(
        return_value=httpx.Response(200, json={"assertion": mint_assertion, "claims": {}})
    )

    data = client.post("/api/run").json()
    assert data["ok"] is True
    assert [s["id"] for s in data["steps"]] == ["login", "mint", "exchange"]
    assert all(s["status"] == "ok" for s in data["steps"])
    assert data["steps"][2]["decoded"]["claims"]["azp"] == "receiving-app"


@respx.mock
def test_run_stops_when_login_fails():
    respx.post(webapp.TOKEN_ENDPOINT).mock(
        return_value=httpx.Response(401, json={"error": "invalid_grant"})
    )
    data = client.post("/api/run").json()
    assert data["ok"] is False
    assert len(data["steps"]) == 1
    assert data["steps"][0]["id"] == "login"
    assert data["steps"][0]["status"] == "error"


@respx.mock
def test_run_stops_when_mint_fails():
    respx.post(webapp.TOKEN_ENDPOINT).mock(
        return_value=httpx.Response(200, json={"access_token": _jwt(sub="uid")})
    )
    respx.post(f"{webapp.ISSUER_URL}/mint").mock(return_value=httpx.Response(500, text="boom"))

    data = client.post("/api/run").json()
    assert data["ok"] is False
    assert [s["id"] for s in data["steps"]] == ["login", "mint"]
    assert data["steps"][1]["status"] == "error"


@respx.mock
def test_run_stops_when_exchange_fails():
    respx.post(webapp.TOKEN_ENDPOINT).mock(
        side_effect=[
            httpx.Response(200, json={"access_token": _jwt(sub="uid")}),
            httpx.Response(400, json={"error": "invalid_grant"}),
        ]
    )
    respx.post(f"{webapp.ISSUER_URL}/mint").mock(
        return_value=httpx.Response(200, json={"assertion": _jwt(sub="user@example.com"), "claims": {}})
    )

    data = client.post("/api/run").json()
    assert data["ok"] is False
    assert [s["id"] for s in data["steps"]] == ["login", "mint", "exchange"]
    assert data["steps"][2]["status"] == "error"
