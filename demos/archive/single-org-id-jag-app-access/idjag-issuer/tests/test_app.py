"""Unit tests for the CNCF demo ID-JAG issuer.

Covers the JWKS/discovery endpoints and the /mint assertion contract that
Keycloak's ID-JAG receiver relies on (claims, header type, signature).
"""

import json

import jwt as pyjwt
import pytest
from fastapi.testclient import TestClient

import app as issuer

client = TestClient(issuer.app)

REALM_AUD = "http://keycloak:8080/realms/cncf-demo"


def _verify_key():
    """Build a public key object from the published JWKS (as Keycloak would)."""
    jwk = client.get("/jwks").json()["keys"][0]
    return pyjwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))


def test_healthz():
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_jwks_shape():
    r = client.get("/jwks")
    assert r.status_code == 200
    keys = r.json()["keys"]
    assert len(keys) == 1
    jwk = keys[0]
    assert jwk["kty"] == "RSA"
    assert jwk["use"] == "sig"
    assert jwk["alg"] == "RS256"
    assert jwk["kid"] == issuer._kid
    assert jwk["n"] and jwk["e"]


def test_certs_alias_matches_jwks():
    assert client.get("/protocol/openid-connect/certs").json() == client.get("/jwks").json()


def test_discovery_document():
    doc = client.get("/.well-known/openid-configuration").json()
    assert doc["issuer"] == issuer.ISSUER_URL
    assert doc["jwks_uri"] == f"{issuer.ISSUER_URL}/jwks"
    assert "RS256" in doc["id_token_signing_alg_values_supported"]


def test_mint_minimal_claims_and_header():
    r = client.post("/mint", json={"sub": "user@example.com", "aud": REALM_AUD})
    assert r.status_code == 200
    body = r.json()
    assertion = body["assertion"]

    header = pyjwt.get_unverified_header(assertion)
    assert header["typ"] == issuer.IDJAG_TYP
    assert header["kid"] == issuer._kid
    assert header["alg"] == "RS256"

    claims = body["claims"]
    assert claims["iss"] == issuer.ISSUER_URL
    assert claims["sub"] == "user@example.com"
    assert claims["aud"] == REALM_AUD
    assert claims["exp"] - claims["iat"] == issuer.ASSERTION_TTL
    assert claims["jti"]
    # Optional claims must be absent when not requested.
    assert "client_id" not in claims
    assert "azp" not in claims
    assert "scope" not in claims
    assert "act" not in claims


def test_mint_signature_verifies_against_jwks():
    assertion = client.post(
        "/mint", json={"sub": "user@example.com", "aud": REALM_AUD}
    ).json()["assertion"]
    # Verifying with the wrong audience must fail; the right one must pass.
    decoded = pyjwt.decode(assertion, _verify_key(), algorithms=["RS256"], audience=REALM_AUD)
    assert decoded["sub"] == "user@example.com"
    with pytest.raises(pyjwt.InvalidAudienceError):
        pyjwt.decode(assertion, _verify_key(), algorithms=["RS256"], audience="wrong")


def test_mint_with_client_id_sets_azp():
    claims = client.post(
        "/mint",
        json={"sub": "user@example.com", "aud": REALM_AUD, "client_id": "receiving-app"},
    ).json()["claims"]
    assert claims["client_id"] == "receiving-app"
    assert claims["azp"] == "receiving-app"


def test_mint_with_scope_and_act_chain():
    claims = client.post(
        "/mint",
        json={
            "sub": "user@example.com",
            "aud": REALM_AUD,
            "scope": "openid",
            "act_chain": ["user", "receiving-app"],
        },
    ).json()["claims"]
    assert claims["scope"] == "openid"
    assert claims["act"] == {"sub": "receiving-app", "act_chain": ["user", "receiving-app"]}


def test_mint_requires_sub_and_aud():
    assert client.post("/mint", json={"sub": "only-sub"}).status_code == 422
    assert client.post("/mint", json={}).status_code == 422


def test_mint_generates_unique_jti():
    req = {"sub": "user@example.com", "aud": REALM_AUD}
    a = client.post("/mint", json=req).json()["claims"]["jti"]
    b = client.post("/mint", json=req).json()["claims"]["jti"]
    assert a != b
