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


def _mock_core(login_azp="requesting-app", exchange_azp="receiving-app"):
    """Mock the login, mint and exchange hops (token endpoint + issuer)."""
    login = _jwt(sub="uid-123", azp=login_azp, preferred_username="user")
    exchanged = _jwt(sub="uid-123", azp=exchange_azp, preferred_username="user")
    mint_assertion = _jwt(sub="user@example.com", aud=webapp.REALM_ISSUER, azp="receiving-app")
    respx.post(webapp.TOKEN_ENDPOINT).mock(
        side_effect=[
            httpx.Response(200, json={"access_token": login}),
            httpx.Response(200, json={"access_token": exchanged}),
        ]
    )
    respx.post(f"{webapp.ISSUER_URL}/mint").mock(
        return_value=httpx.Response(200, json={"assertion": mint_assertion, "claims": {}})
    )


@respx.mock
def test_run_happy_path_read_write():
    _mock_core()
    respx.get(f"{webapp.GATEWAY_URL}/api/gitea/repos").mock(
        return_value=httpx.Response(200, json={"repos": [{"full_name": "demo/x"}], "scope": ["gitea:read", "gitea:write"]})
    )
    respx.post(f"{webapp.GATEWAY_URL}/api/gitea/repos").mock(
        return_value=httpx.Response(201, json={"created": {"full_name": "demo/new"}})
    )

    data = client.post("/api/run", json={"scope": "openid gitea:read gitea:write"}).json()
    assert data["ok"] is True
    assert [s["id"] for s in data["steps"]] == ["login", "mint", "exchange", "gitea-list", "gitea-create"]
    assert all(s["status"] == "ok" for s in data["steps"])
    assert data["steps"][2]["decoded"]["claims"]["azp"] == "receiving-app"


@respx.mock
def test_run_readonly_denies_write():
    """Narrow scoping: read-only token lists repos but is denied the create."""
    _mock_core()
    respx.get(f"{webapp.GATEWAY_URL}/api/gitea/repos").mock(
        return_value=httpx.Response(200, json={"repos": [], "scope": ["gitea:read"]})
    )
    respx.post(f"{webapp.GATEWAY_URL}/api/gitea/repos").mock(
        return_value=httpx.Response(403, json={"detail": {"error": "insufficient_scope", "required": "gitea:write"}})
    )

    data = client.post("/api/run", json={"scope": "openid gitea:read"}).json()
    # "denied" is an expected outcome, so the run is still considered ok.
    assert data["ok"] is True
    statuses = {s["id"]: s["status"] for s in data["steps"]}
    assert statuses["gitea-list"] == "ok"
    assert statuses["gitea-create"] == "denied"


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


# --- stepped endpoints (manual step-through / animated mode) ---------------


@respx.mock
def test_step_login_returns_single_ok_step():
    respx.post(webapp.TOKEN_ENDPOINT).mock(
        return_value=httpx.Response(200, json={"access_token": _jwt(sub="uid-1", azp="requesting-app")})
    )
    data = client.post("/api/step/login").json()
    assert data["ok"] is True
    assert data["step"]["id"] == "login"
    assert data["step"]["decoded"]["claims"]["azp"] == "requesting-app"


@respx.mock
def test_step_mint_returns_assertion_as_token():
    assertion = _jwt(sub="user@example.com", azp="receiving-app")
    respx.post(f"{webapp.ISSUER_URL}/mint").mock(
        return_value=httpx.Response(200, json={"assertion": assertion, "claims": {}})
    )
    data = client.post("/api/step/mint").json()
    assert data["ok"] is True
    assert data["step"]["token"] == assertion


@respx.mock
def test_step_exchange_uses_supplied_assertion():
    exchanged = _jwt(sub="uid-1", azp="receiving-app")
    route = respx.post(webapp.TOKEN_ENDPOINT).mock(
        return_value=httpx.Response(200, json={"access_token": exchanged})
    )
    data = client.post("/api/step/exchange", json={"assertion": "some.jwt.assertion"}).json()
    assert data["ok"] is True
    assert data["step"]["decoded"]["claims"]["azp"] == "receiving-app"
    # The assertion we passed must be forwarded to Keycloak's token endpoint.
    sent = route.calls.last.request.content.decode()
    assert "assertion=some.jwt.assertion" in sent


def test_step_exchange_requires_assertion_field():
    # Missing the required body field -> 422 from FastAPI validation.
    assert client.post("/api/step/exchange", json={}).status_code == 422


@respx.mock
def test_step_gitea_list_forwards_bearer_token():
    route = respx.get(f"{webapp.GATEWAY_URL}/api/gitea/repos").mock(
        return_value=httpx.Response(200, json={"repos": [{"full_name": "demo/x"}], "scope": ["gitea:read"]})
    )
    data = client.post("/api/step/gitea-list", json={"access_token": "abc.def.ghi"}).json()
    assert data["ok"] is True
    assert data["step"]["status"] == "ok"
    assert route.calls.last.request.headers["authorization"] == "Bearer abc.def.ghi"


@respx.mock
def test_step_gitea_create_denied_maps_to_denied_status():
    respx.post(f"{webapp.GATEWAY_URL}/api/gitea/repos").mock(
        return_value=httpx.Response(403, json={"detail": {"required": "gitea:write"}})
    )
    data = client.post("/api/step/gitea-create", json={"access_token": "abc.def.ghi"}).json()
    # 403 is a valid demo outcome -> "denied", and ok stays True.
    assert data["ok"] is True
    assert data["step"]["status"] == "denied"


@respx.mock
def test_step_gitea_create_success():
    respx.post(f"{webapp.GATEWAY_URL}/api/gitea/repos").mock(
        return_value=httpx.Response(201, json={"created": {"full_name": "demo/new"}})
    )
    data = client.post("/api/step/gitea-create", json={"access_token": "t", "repo_name": "my-repo"}).json()
    assert data["ok"] is True
    assert data["step"]["status"] == "ok"


def test_step_gitea_requires_access_token_field():
    assert client.post("/api/step/gitea-list", json={}).status_code == 422
