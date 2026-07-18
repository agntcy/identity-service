# CNCF Demo Stack

Docker Compose stack for the CNCF conference demo of the AGNTCY Identity Service.

## Services

| Service             | Image                                | Host port(s)        | Purpose                                  |
| ------------------- | ------------------------------------ | ------------------- | ---------------------------------------- |
| `keycloak`          | `quay.io/keycloak/keycloak:26.7`     | `8080`              | OIDC provider + ID-JAG receiver          |
| `gitea`             | `gitea/gitea:1.22`                   | `3000` (HTTP), `2222` (SSH) | Self-hosted git hosting          |
| `identity-postgres` | `postgres:16`                        | _(internal)_        | Database for the identity node           |
| `identity-vault`    | `hashicorp/vault:1.17`               | _(internal)_        | Key material storage (Vault dev mode)    |
| `identity-node`     | `ghcr.io/agntcy/identity/node:0.0.23`| `4003` (REST), `4004` (gRPC) | AGNTCY identity node             |
| `idjag-issuer`      | built from `./idjag-issuer`          | _(internal)_        | Mints ID-JAG assertions (stand-in issuer) |
| `webapp`            | built from `./webapp`                | `8000`              | ID-JAG Cross-App Access demo UI          |

All image versions are pinned (no `latest`). All credentials are supplied via
environment variables — none are hardcoded in `docker-compose.yaml`.

## Quick start

```bash
cd demos/cncf-stack
cp .env.example .env      # then edit .env and change the change-me-* values
docker compose up -d
```

Check status:

```bash
docker compose ps
```

## Default URLs

- **ID-JAG demo web app: <http://localhost:8000>**
- Keycloak admin console: <http://localhost:8080> (user/password from `.env`)
- Gitea: <http://localhost:3000>
- Identity node REST API: <http://localhost:4003>
- Identity node gRPC: `localhost:4004`

## Testing the ID-JAG (Cross-App Access) sequence

Open the web app at <http://localhost:8000> and click **Run ID-JAG sequence**.
The demo shows the **Requesting App** obtaining access to the **Receiving App**
on behalf of the signed-in user. Everything runs server-side (no browser CORS)
across three hops:

1. **Requesting App — user sign-in** — OIDC password grant against Keycloak
   (`cncf-demo` realm, `requesting-app`) for the demo user `user`.
2. **Mint ID-JAG** — the `idjag-issuer` service signs an Identity Assertion JWT
   (`iss` = issuer, `sub` = `user@example.com`, `aud` = the realm issuer,
   `client_id`/`azp` = `receiving-app`).
3. **Receiving App — exchange** — the assertion is presented to Keycloak's token
   endpoint with `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer` and
   `client_id=receiving-app`; Keycloak validates it against the `id-jag`
   identity provider (JWKS from the issuer), maps `sub` to the local user via
   its federated identity link, and returns a **local access token**.

The UI shows the decoded header + claims for each token.

### Why the separate issuer?

Keycloak 26.7 only implements the **Receiver** side of ID-JAG — it cannot mint
assertions yet. The small `idjag-issuer` service stands in for the central
enterprise IdP so the full flow is self-contained and testable locally. Swap it
for a real issuer by editing the `id-jag` identity provider config in
`keycloak/cncf-demo-realm.json` (issuer / JWKS URLs) and the matching federated
identity link on the user.

## Configuration

Copy `.env.example` to `.env` and adjust. Required values (no default; the stack
will refuse to start without them) include the Keycloak admin password, the
Postgres password, the Vault dev root token, and the identity node crypto key.

> The values in `.env.example` are **local demo placeholders only**. Never reuse
> them in any shared or production environment.

## Realm configuration

The `cncf-demo` realm is version-controlled at
[`keycloak/cncf-demo-realm.json`](./keycloak/cncf-demo-realm.json) and imported
automatically on startup (`start-dev --import-realm`, mounted at
`/opt/keycloak/data/import`). It provisions:

| Object | Name | Purpose |
| --- | --- | --- |
| Client | `requesting-app` | **Requesting App** — confidential client: standard flow, direct access grants, service accounts, **standard token exchange** enabled. Signs the user in and initiates cross-app access. |
| Client | `receiving-app` | **Receiving App (ID-JAG receiver)** — exchanges an incoming assertion (`jwt-bearer` grant) for a local access token (`oauth2.jwt.authorization.grant.*`). |
| Identity provider | `id-jag` | External ID-JAG issuer (OIDC), `jwtAuthorizationGrantEnabled=true`. Issuer URLs are **placeholders** — point them at your real IdP. |
| Users | `user` | Demo user (`user@example.com`), federated to the `id-jag` issuer. |

> **Demo credentials only.** The client secrets and user passwords in the realm
> file are obvious `*-change-me` placeholders for local use. Change them (and the
> `id-jag` issuer URLs / client secret) before using this beyond a laptop. To
> regenerate/extend the realm, edit the JSON or reconfigure a running instance
> and re-export.

To edit the realm and re-import cleanly, remove the Keycloak container/volume
first (`docker compose down`), since `--import-realm` skips realms that already
exist.

## Cross-App Access (ID-JAG) & Token Exchange

Keycloak is started with two **experimental** feature flags (see the
[ID-JAG guide](https://www.keycloak.org/securing-apps/identity-assertion-jwt-authorization-grant)):

```
start-dev --features=identity-assertion-jwt,token-exchange-delegation
```

- `identity-assertion-jwt` — enables **ID-JAG** (Identity Assertion JWT
  Authorization Grant / Cross-App Access). Requires **Keycloak 26.7+**.
- `token-exchange-delegation` — enables the experimental delegation scope for
  RFC 8693 token exchange (standard token exchange itself is enabled per-client
  and needs no server flag on 26.x).

> **Limitation:** Keycloak currently implements only the **Receiver** side of
> ID-JAG — it accepts an externally-signed assertion at its token endpoint and
> issues a local access token. It cannot yet **issue** ID-JAG assertions, so a
> full end-to-end flow with Keycloak on both ends is not possible today. These
> features are experimental and not for production.

## Notes

- Keycloak runs in `start-dev` mode (in-memory H2) — suitable for demos only.
- Vault runs in dev mode; its data is not persisted across restarts.
- Gitea and Postgres persist data via named volumes (`gitea-data`,
  `identity-postgres-data`).
- The identity node expects a Keycloak realm/client (`cncf-demo`) to be
  provisioned. Realm bootstrap and the Envoy + `ext_authz` layer are tracked
  separately in [#228](https://github.com/agntcy/identity-service/issues/228).

## Tear down

```bash
docker compose down          # stop and remove containers
docker compose down -v       # also remove named volumes (wipes data)
```

## Related issues

- Create the docker-compose file: [#227](https://github.com/agntcy/identity-service/issues/227)
- Envoy + ext_authz setup: [#228](https://github.com/agntcy/identity-service/issues/228)
- Move `agenticidentity-cncf` here: [#229](https://github.com/agntcy/identity-service/issues/229)
