"""Minimal ID-JAG issuer for the CNCF demo.

Stands in for the "central enterprise IdP" that mints Identity Assertion JWT
Authorization Grants (ID-JAG). Keycloak 26.7 can only *receive* ID-JAG today,
so this tiny service plays the *issuer* role:

  - Holds an RSA key pair generated at startup.
  - Publishes its public key as a JWKS (so Keycloak's `id-jag` identity
    provider can validate the assertion signature).
  - Mints signed ID-JAG assertions on demand (POST /mint).

This is a demo helper — not a production IdP.
"""

from __future__ import annotations

import os
import time
import uuid

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Issuer identity as reachable from Keycloak on the docker network.
ISSUER_URL = os.environ.get("ISSUER_URL", "http://idjag-issuer:9000")
# ID-JAG assertion media type from the IETF draft.
IDJAG_TYP = "oauth-id-jag+jwt"
ASSERTION_TTL = int(os.environ.get("ASSERTION_TTL", "300"))

_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_kid = str(uuid.uuid4())

app = FastAPI(title="CNCF Demo ID-JAG Issuer", version="0.1.0")


def _int_to_b64url(value: int, length: int) -> str:
    import base64

    return base64.urlsafe_b64encode(value.to_bytes(length, "big")).rstrip(b"=").decode()


def _public_jwk() -> dict:
    nums = _key.public_key().public_numbers()
    return {
        "kty": "RSA",
        "use": "sig",
        "alg": "RS256",
        "kid": _kid,
        "n": _int_to_b64url(nums.n, (nums.n.bit_length() + 7) // 8),
        "e": _int_to_b64url(nums.e, (nums.e.bit_length() + 7) // 8),
    }


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/jwks")
@app.get("/protocol/openid-connect/certs")
def jwks():
    return {"keys": [_public_jwk()]}


@app.get("/.well-known/openid-configuration")
def discovery():
    return JSONResponse(
        {
            "issuer": ISSUER_URL,
            "authorization_endpoint": f"{ISSUER_URL}/auth",
            "token_endpoint": f"{ISSUER_URL}/token",
            "jwks_uri": f"{ISSUER_URL}/jwks",
            "response_types_supported": ["code"],
            "subject_types_supported": ["public"],
            "id_token_signing_alg_values_supported": ["RS256"],
        }
    )


class MintRequest(BaseModel):
    # Subject the assertion represents. Must match a federated identity link
    # (identityProvider=id-jag, userId=<sub>) on the receiving Keycloak realm.
    sub: str
    # Target audience — the receiving authorization server / realm.
    aud: str
    # Requesting client id (Client App A). Keycloak's ID-JAG receiver requires
    # this to match the client presenting the assertion at its token endpoint.
    client_id: str | None = None
    # Optional acting agent chain, mirrored into the `act` claim.
    act_chain: list[str] | None = None
    scope: str | None = None


@app.post("/mint")
def mint(body: MintRequest):
    now = int(time.time())
    claims = {
        "iss": ISSUER_URL,
        "sub": body.sub,
        "aud": body.aud,
        "iat": now,
        "exp": now + ASSERTION_TTL,
        "jti": str(uuid.uuid4()),
    }
    if body.client_id:
        claims["client_id"] = body.client_id
        claims["azp"] = body.client_id
    if body.scope:
        claims["scope"] = body.scope
    if body.act_chain:
        claims["act"] = {"sub": body.act_chain[-1], "act_chain": body.act_chain}

    assertion = jwt.encode(
        claims,
        _key,
        algorithm="RS256",
        headers={"kid": _kid, "typ": IDJAG_TYP},
    )
    return {"assertion": assertion, "claims": claims}
