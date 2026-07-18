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

The UI shows each hop's status and the decoded token/assertion claims.
"""

from __future__ import annotations

import os

import httpx
import jwt as pyjwt
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
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

TOKEN_ENDPOINT = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token"
REALM_ISSUER = f"{KEYCLOAK_URL}/realms/{REALM}"

app = FastAPI(title="CNCF Demo — ID-JAG", version="0.1.0")

_STATIC = os.path.join(os.path.dirname(__file__), "static")


def _decode(token: str) -> dict:
    try:
        header = pyjwt.get_unverified_header(token)
        claims = pyjwt.decode(token, options={"verify_signature": False})
        return {"header": header, "claims": claims}
    except Exception as exc:  # noqa: BLE001
        return {"error": f"could not decode: {exc}"}


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
    }


@app.post("/api/run")
async def run():
    steps: list[dict] = []
    async with httpx.AsyncClient(timeout=15) as client:
        # --- Step 1: user login (password grant) ---
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
                steps.append(step)
                return JSONResponse({"ok": False, "steps": steps})
            user_token = r.json()["access_token"]
            step.update(status="ok", token=user_token, decoded=_decode(user_token))
            steps.append(step)
        except Exception as exc:  # noqa: BLE001
            step.update(status="error", error=str(exc))
            steps.append(step)
            return JSONResponse({"ok": False, "steps": steps})

        # --- Step 2: mint ID-JAG assertion at the issuer ---
        step = {
            "id": "mint",
            "title": "2. Mint ID-JAG assertion (for the Receiving App)",
            "detail": f"POST {ISSUER_URL}/mint  (sub={SUBJECT}, aud={REALM_ISSUER})",
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
                    "scope": "openid",
                },
            )
            if r.status_code != 200:
                step.update(status="error", error=f"HTTP {r.status_code}: {r.text[:300]}")
                steps.append(step)
                return JSONResponse({"ok": False, "steps": steps})
            assertion = r.json()["assertion"]
            step.update(status="ok", token=assertion, decoded=_decode(assertion))
            steps.append(step)
        except Exception as exc:  # noqa: BLE001
            step.update(status="error", error=str(exc))
            steps.append(step)
            return JSONResponse({"ok": False, "steps": steps})

        # --- Step 3: receiver exchange (jwt-bearer) ---
        step = {
            "id": "exchange",
            "title": "3. Receiving App — exchange (Keycloak ID-JAG / jwt-bearer)",
            "detail": f"POST {TOKEN_ENDPOINT}  (grant_type=jwt-bearer, client={BACKEND_CLIENT_ID})",
        }
        try:
            r = await client.post(
                TOKEN_ENDPOINT,
                data={
                    "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                    "assertion": assertion,
                    "client_id": BACKEND_CLIENT_ID,
                    "client_secret": BACKEND_CLIENT_SECRET,
                    "scope": "openid",
                },
            )
            if r.status_code != 200:
                step.update(status="error", error=f"HTTP {r.status_code}: {r.text[:300]}")
                steps.append(step)
                return JSONResponse({"ok": False, "steps": steps})
            access_token = r.json()["access_token"]
            step.update(status="ok", token=access_token, decoded=_decode(access_token))
            steps.append(step)
        except Exception as exc:  # noqa: BLE001
            step.update(status="error", error=str(exc))
            steps.append(step)
            return JSONResponse({"ok": False, "steps": steps})

    return JSONResponse({"ok": True, "steps": steps})


@app.get("/")
def index():
    return FileResponse(os.path.join(_STATIC, "index.html"))


app.mount("/static", StaticFiles(directory=_STATIC), name="static")
