#!/usr/bin/env python3
# Copyright 2026 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

# assisted-by claude code claude-sonnet-4-6
"""identity-node-init — bootstrap a Vault-backed local trust authority for org-a.

identity-node's real REST API (v0.0.23) requires a self-issued "proof" JWT to
register an Issuer or generate an Id: a JWT whose `iss` is `agntcy:<commonName>`,
carrying a `sub_jwk` claim, and signed by a key whose public half is submitted
alongside the request. On registration the *submitted* public key — not the
key embedded in the JWT — is what verifies the signature, so the same keypair
must be reused for every subsequent proof.

Steps
-----
1. Wait for identity-node's REST port and Vault to be reachable.
2. Enable Vault's transit secrets engine (idempotent).
3. Create (or reuse) an RSA-2048 signing key in transit: org-a-issuer.
4. Fetch its public key (PEM), convert to JWK (n/e) via a minimal stdlib DER parser.
5. Self-sign a proof JWT (iss=agntcy:org-a, sub=org-a) using Vault's /transit/sign.
6. POST /v1alpha1/issuer/register to register org-a as a self-issued trust
   authority (idempotent — "issuer already exists" is treated as success).

Uses only Python stdlib (no third-party packages) — Vault does the signing,
so no local crypto library is needed; PEM/DER parsing is hand-rolled below.
"""

from __future__ import annotations

import base64
import json
import os
import sys
import time
import uuid
import urllib.error
import urllib.request

# ── Environment ──────────────────────────────────────────────────────────────
IDENTITY_NODE_URL = os.environ.get("IDENTITY_NODE_URL", "http://identity-node:4000").rstrip("/")
VAULT_ADDR = os.environ.get("VAULT_ADDR", "http://identity-vault:8200").rstrip("/")
VAULT_TOKEN = os.environ.get("VAULT_TOKEN", "")
VAULT_KEY_NAME = os.environ.get("VAULT_KEY_NAME", "org-a-issuer")
ORG_A_COMMON_NAME = os.environ.get("ORG_A_COMMON_NAME", "org-a")
KID = f"{VAULT_KEY_NAME}-v1"

MAX_TRIES = 30
POLL_INTERVAL = 3  # seconds


# ── HTTP helpers ──────────────────────────────────────────────────────────────

def _request(method: str, url: str, data: dict | None = None, headers: dict | None = None) -> tuple[int, bytes]:
    body = json.dumps(data).encode() if data is not None else None
    hdrs = {"Content-Type": "application/json", **(headers or {})}
    req = urllib.request.Request(url, data=body, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read()


def _vault(method: str, path: str, data: dict | None = None) -> tuple[int, dict]:
    status, body = _request(method, f"{VAULT_ADDR}/v1/{path}", data, {"X-Vault-Token": VAULT_TOKEN})
    parsed = json.loads(body) if body else {}
    return status, parsed


# ── Wait helpers ──────────────────────────────────────────────────────────────

def wait_for(name: str, probe) -> None:
    print(f"[init] Waiting for {name} …", flush=True)
    for attempt in range(1, MAX_TRIES + 1):
        try:
            if probe():
                print(f"[init] {name} ready (attempt {attempt})", flush=True)
                return
        except Exception as exc:  # noqa: BLE001
            print(f"[init]   attempt {attempt}/{MAX_TRIES}: {exc} — retrying …", flush=True)
        time.sleep(POLL_INTERVAL)
    print(f"[init] ERROR: {name} did not become ready in time.", file=sys.stderr)
    sys.exit(1)


def _identity_node_probe() -> bool:
    # Any structured HTTP response (even 404 for an unknown route) means the
    # gRPC-gateway is up and routing; only a connection error should retry.
    status, _ = _request("GET", f"{IDENTITY_NODE_URL}/v1alpha1/issuer/__probe__/.well-known/jwks.json")
    return status in (200, 400, 404)


def _vault_probe() -> bool:
    status, _ = _vault("GET", "sys/health")
    return status in (200, 429, 472, 473)  # all "reachable" health states


# ── DER/PEM → JWK (stdlib-only minimal ASN.1 reader) ──────────────────────────

def _der_read_len(data: bytes, off: int) -> tuple[int, int]:
    first = data[off]
    if first & 0x80 == 0:
        return first, off + 1
    n = first & 0x7F
    length = int.from_bytes(data[off + 1:off + 1 + n], "big")
    return length, off + 1 + n


def _der_read_tlv(data: bytes, off: int) -> tuple[int, bytes, int]:
    tag = data[off]
    length, val_off = _der_read_len(data, off + 1)
    value = data[val_off:val_off + length]
    return tag, value, val_off + length


def pem_rsa_pubkey_to_jwk_ne(pem: str) -> tuple[str, str]:
    """Parse a PKIX RSA public key PEM into base64url (n, e) — no crypto library."""
    lines = [ln for ln in pem.strip().splitlines() if "BEGIN" not in ln and "END" not in ln]
    der = base64.b64decode("".join(lines))

    # SEQUENCE { SEQUENCE { OID, NULL }, BIT STRING { SEQUENCE { INTEGER n, INTEGER e } } }
    _, outer_seq, _ = _der_read_tlv(der, 0)
    _, alg_id, off2 = _der_read_tlv(outer_seq, 0)  # AlgorithmIdentifier SEQUENCE (skip)
    _, bitstring, _ = _der_read_tlv(outer_seq, off2)
    inner = bitstring[1:]  # drop the "unused bits" byte
    _, rsa_pub_seq, _ = _der_read_tlv(inner, 0)

    _, n_bytes, off3 = _der_read_tlv(rsa_pub_seq, 0)
    _, e_bytes, _ = _der_read_tlv(rsa_pub_seq, off3)

    def strip_leading_zero(b: bytes) -> bytes:
        return b[1:] if len(b) > 1 and b[0] == 0 else b

    def b64url(b: bytes) -> str:
        return base64.urlsafe_b64encode(b).rstrip(b"=").decode()

    return b64url(strip_leading_zero(n_bytes)), b64url(strip_leading_zero(e_bytes))


# ── Vault-backed signing ──────────────────────────────────────────────────────

def enable_transit() -> None:
    status, body = _vault("POST", "sys/mounts/transit", {"type": "transit"})
    if status in (200, 204):
        print("[init] Vault transit engine enabled.", flush=True)
    elif status == 400 and "already in use" in json.dumps(body):
        print("[init] Vault transit engine already enabled.", flush=True)
    else:
        print(f"[init] ERROR: enabling transit engine — HTTP {status}: {body}", file=sys.stderr)
        sys.exit(1)


def create_signing_key() -> None:
    status, body = _vault("POST", f"transit/keys/{VAULT_KEY_NAME}", {"type": "rsa-2048"})
    if status in (200, 204):
        print(f"[init] Vault signing key '{VAULT_KEY_NAME}' created.", flush=True)
    else:
        # Re-creating an existing key is a no-op in Vault (200); anything else is fatal.
        print(f"[init] ERROR: creating signing key — HTTP {status}: {body}", file=sys.stderr)
        sys.exit(1)


def get_public_jwk() -> dict:
    status, body = _vault("GET", f"transit/keys/{VAULT_KEY_NAME}")
    if status != 200:
        print(f"[init] ERROR: reading signing key — HTTP {status}: {body}", file=sys.stderr)
        sys.exit(1)
    keys = body["data"]["keys"]
    latest_version = max(keys, key=int)
    pem = keys[latest_version]["public_key"]
    n_b64, e_b64 = pem_rsa_pubkey_to_jwk_ne(pem)
    return {"kty": "RSA", "n": n_b64, "e": e_b64, "alg": "RS256", "use": "sig", "kid": KID}


def vault_sign_rs256(signing_input: str) -> str:
    input_b64 = base64.b64encode(signing_input.encode()).decode()
    status, body = _vault("POST", f"transit/sign/{VAULT_KEY_NAME}", {
        "input": input_b64,
        "hash_algorithm": "sha2-256",
        "signature_algorithm": "pkcs1v15",
    })
    if status != 200:
        print(f"[init] ERROR: Vault sign failed — HTTP {status}: {body}", file=sys.stderr)
        sys.exit(1)
    vault_sig = body["data"]["signature"]  # "vault:v1:<base64-std>"
    sig_bytes = base64.b64decode(vault_sig.split(":", 2)[2])
    return base64.urlsafe_b64encode(sig_bytes).rstrip(b"=").decode()


def build_self_issued_jwt(common_name: str, sub: str, jwk: dict) -> str:
    """Build a self-issued proof JWT per identity-node's expected scheme:
    iss=agntcy:<commonName>, sub_jwk claim carries the public key, kid on both
    the JWS header and the JWK (required for jwx's key-set matching)."""
    def b64url(b: bytes) -> str:
        return base64.urlsafe_b64encode(b).rstrip(b"=").decode()

    header = {"alg": "RS256", "typ": "JWT", "kid": jwk["kid"]}
    now = int(time.time())
    payload = {
        "iss": f"agntcy:{common_name}",
        "sub": sub,
        "aud": [sub],
        "exp": now + 3600,
        "iat": now,
        "jti": str(uuid.uuid4()),
        "sub_jwk": jwk,
    }
    header_b64 = b64url(json.dumps(header, separators=(",", ":")).encode())
    payload_b64 = b64url(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{header_b64}.{payload_b64}"
    return f"{signing_input}.{vault_sign_rs256(signing_input)}"


def register_issuer(jwk: dict) -> None:
    proof_jwt = build_self_issued_jwt(ORG_A_COMMON_NAME, ORG_A_COMMON_NAME, jwk)
    url = f"{IDENTITY_NODE_URL}/v1alpha1/issuer/register"
    payload = {
        "issuer": {
            "organization": ORG_A_COMMON_NAME,
            "commonName": ORG_A_COMMON_NAME,
            "publicKey": jwk,
        },
        "proof": {"type": "JWT", "proofValue": proof_jwt},
    }
    status, body = _request("POST", url, payload)
    decoded = body.decode(errors="replace")
    if status == 200:
        print(f"[init] Issuer '{ORG_A_COMMON_NAME}' registered as a self-issued trust authority.", flush=True)
    elif status == 400 and "already exists" in decoded:
        print(f"[init] Issuer '{ORG_A_COMMON_NAME}' already registered — skipping.", flush=True)
    else:
        print(f"[init] ERROR: issuer registration failed — HTTP {status}: {decoded[:400]}", file=sys.stderr)
        sys.exit(1)


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    print("[init] identity-node-init starting …", flush=True)
    wait_for("Vault", _vault_probe)
    wait_for("identity-node", _identity_node_probe)
    enable_transit()
    create_signing_key()
    jwk = get_public_jwk()
    print(f"[init] Got JWK for '{VAULT_KEY_NAME}' (kid={jwk['kid']}).", flush=True)
    register_issuer(jwk)
    print("[init] Done. org-a is a registered, Vault-backed local trust authority.", flush=True)


if __name__ == "__main__":
    main()
