# Single-Org ID-JAG Cross-App Access Demo Stack (archived)

Video: https://app.vidcast.io/share/a943d056-fb63-4840-9083-a4fbb72508a3

Docker Compose stack demonstrating ID-JAG (Identity Assertion JWT Authorization
Grant) Cross-App Access with the AGNTCY Identity Service — originally built for
a CNCF conference demo. This folder was previously named `cncf-stack`, then
`idjag-cross-app-access`. It's archived (kept for reference / shared build
context — `../cross-domain-id-jag-vc` still builds its `idjag-issuer` and
`gitea-gateway` from here) but superseded for new demo work by the two-org
scenario in [`../../cross-domain-id-jag-vc`](../../cross-domain-id-jag-vc).

## Services

| Service             | Image                                | Host port(s)        | Purpose                                  |
| ------------------- | ------------------------------------ | ------------------- | ---------------------------------------- |
| `keycloak`          | `quay.io/keycloak/keycloak:26.7`     | `8080`              | OIDC provider + ID-JAG receiver          |
| `kc-init`           | `quay.io/keycloak/keycloak:26.7`     | _(one-shot)_        | Registers the `gitea:read`/`gitea:write` scopes |
| `gitea`             | `gitea/gitea:1.22`                   | `3000` (HTTP), `2222` (SSH) | Self-hosted git hosting (the protected resource) |
| `gitea-init`        | `gitea/gitea:1.22`                   | _(one-shot)_        | Seeds the Gitea admin + demo repos       |
| `gitea-gateway`     | built from `./gitea-gateway`         | `9100`              | Enforces the narrow ID-JAG scope in front of Gitea |
| `identity-postgres` | `postgres:16`                        | _(internal)_        | Database for the identity node           |
| `identity-vault`    | `hashicorp/vault:1.17`               | _(internal)_        | Key material storage (Vault dev mode)    |
| `identity-node`     | `ghcr.io/agntcy/identity/node:0.0.23`| `4003` (REST), `4004` (gRPC) | AGNTCY identity node             |
| `idjag-issuer`      | built from `./idjag-issuer`          | _(internal)_        | Mints ID-JAG assertions (stand-in issuer) |
| `webapp`            | built from `./webapp`                | `8000`              | ID-JAG Cross-App Access + narrow-scoping demo UI |

All image versions are pinned (no `latest`). All credentials are supplied via
environment variables — none are hardcoded in `docker-compose.yaml`.

## Quick start

```bash
cd demos/archive/single-org-id-jag-app-access
cp .env.example .env      # then edit .env and change the change-me-* values
docker compose up -d
```

Check status:

```bash
docker compose ps
```

## Stack definition

The canonical definition lives in
[`docker-compose.yaml`](./docker-compose.yaml). It is reproduced here for
reference (the file is the source of truth — if the two ever diverge, trust the
file):

<details>
<summary>Full <code>docker-compose.yaml</code></summary>

```yaml
name: single-org-id-jag-app-access

# ID-JAG Cross-App Access demo stack for AGNTCY Identity Service.
#
# Services:
#   - keycloak          OIDC provider + ID-JAG (Cross-App Access) receiver
#   - kc-init           registers the gitea:read/gitea:write scopes (one-shot)
#   - idjag-issuer      mints ID-JAG assertions (stand-in enterprise IdP)
#   - gitea             self-hosted git hosting (the protected resource)
#   - gitea-init        seeds the Gitea admin + demo repos (one-shot)
#   - gitea-gateway     enforces the narrow ID-JAG scope in front of Gitea
#   - identity-postgres Postgres DB backing the AGNTCY identity node
#   - identity-vault    Vault (dev mode) for the identity node key material
#   - identity-node     AGNTCY identity node (REST + gRPC)
#   - webapp            ID-JAG Cross-App Access demo UI
#
# All credentials are provided via environment variables (see .env.example).
# Copy .env.example to .env and adjust before running:
#   cp .env.example .env
#   docker compose up -d

services:
  # ---------------------------------------------------------------------------
  # Keycloak — OIDC provider
  # ---------------------------------------------------------------------------
  keycloak:
    image: quay.io/keycloak/keycloak:26.7
    container_name: cncf-keycloak
    # ID-JAG (Cross-App Access) receiver + token exchange delegation are
    # experimental features and must be enabled explicitly. Requires Keycloak
    # 26.7+. See:
    # https://www.keycloak.org/securing-apps/identity-assertion-jwt-authorization-grant
    command: start-dev --import-realm --features=identity-assertion-jwt,token-exchange-delegation,parameterized-scopes
    environment:
      KC_BOOTSTRAP_ADMIN_USERNAME: ${KEYCLOAK_ADMIN:-admin}
      KC_BOOTSTRAP_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD:?set KEYCLOAK_ADMIN_PASSWORD in .env}
      KC_HTTP_PORT: 8080
    ports:
      - "${KEYCLOAK_HTTP_PORT:-8080}:8080"
    volumes:
      # Realm config imported on startup (see ./keycloak/cncf-demo-realm.json).
      - ./keycloak:/opt/keycloak/data/import:ro
    networks:
      - cncf-net
    healthcheck:
      test: ["CMD-SHELL", "exec 3<>/dev/tcp/127.0.0.1/8080 && echo OK || exit 1"]
      interval: 5s
      timeout: 3s
      retries: 30
      start_period: 20s

  # ---------------------------------------------------------------------------
  # kc-init — registers the narrow gitea:read / gitea:write client scopes and
  # assigns them (optional) to the Receiving App. One-shot; safe to re-run.
  # ---------------------------------------------------------------------------
  kc-init:
    image: quay.io/keycloak/keycloak:26.7
    container_name: cncf-kc-init
    depends_on:
      keycloak:
        condition: service_healthy
    entrypoint: ["bash", "/bootstrap-scopes.sh"]
    environment:
      KC_URL: http://keycloak:8080
      KC_REALM: cncf-demo
      KC_ADMIN: ${KEYCLOAK_ADMIN:-admin}
      KC_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD:?set KEYCLOAK_ADMIN_PASSWORD in .env}
      RECEIVER_CLIENT: receiving-app
    volumes:
      - ./keycloak/bootstrap-scopes.sh:/bootstrap-scopes.sh:ro
    networks:
      - cncf-net
    restart: "no"

  # ---------------------------------------------------------------------------
  # ID-JAG issuer — mints Identity Assertion JWTs (stands in for the central
  # enterprise IdP, since Keycloak can only *receive* ID-JAG today).
  # ---------------------------------------------------------------------------
  idjag-issuer:
    build: ./idjag-issuer
    container_name: cncf-idjag-issuer
    environment:
      ISSUER_URL: http://idjag-issuer:9000
    networks:
      - cncf-net
    healthcheck:
      test: ["CMD-SHELL", "python -c \"import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:9000/healthz').status==200 else 1)\""]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 5s

  # ---------------------------------------------------------------------------
  # Gitea — self-hosted git hosting
  # ---------------------------------------------------------------------------
  gitea:
    image: gitea/gitea:1.22
    container_name: cncf-gitea
    environment:
      USER_UID: "1000"
      USER_GID: "1000"
      GITEA__database__DB_TYPE: sqlite3
      GITEA__server__ROOT_URL: ${GITEA_ROOT_URL:-http://localhost:3000/}
      GITEA__server__SSH_PORT: ${GITEA_SSH_PORT:-2222}
      GITEA__security__INSTALL_LOCK: "true"
      GITEA__service__DISABLE_REGISTRATION: "true"
    ports:
      - "${GITEA_HTTP_PORT:-3000}:3000"
      - "${GITEA_SSH_PORT:-2222}:22"
    volumes:
      - gitea-data:/data
    networks:
      - cncf-net
    healthcheck:
      test: ["CMD-SHELL", "wget --spider -q http://127.0.0.1:3000/api/healthz || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 20
      start_period: 15s

  # ---------------------------------------------------------------------------
  # gitea-init — creates the Gitea admin user and seeds demo repos. One-shot.
  # ---------------------------------------------------------------------------
  gitea-init:
    image: gitea/gitea:1.22
    container_name: cncf-gitea-init
    depends_on:
      gitea:
        condition: service_healthy
    entrypoint: ["sh", "/init.sh"]
    user: git
    environment:
      GITEA_INTERNAL_URL: http://gitea:3000
      GITEA_ADMIN_USER: ${GITEA_ADMIN_USER:-demo-admin}
      GITEA_ADMIN_PASSWORD: ${GITEA_ADMIN_PASSWORD:?set GITEA_ADMIN_PASSWORD in .env}
      GITEA_ADMIN_EMAIL: ${GITEA_ADMIN_EMAIL:-admin@example.com}
      GITEA_WORK_DIR: /data
    volumes:
      - gitea-data:/data
      - ./gitea/init.sh:/init.sh:ro
    networks:
      - cncf-net
    restart: "no"

  # ---------------------------------------------------------------------------
  # gitea-gateway — validates the Receiving App's access token and enforces the
  # narrow ID-JAG scope (gitea:read to list, gitea:write to create) before
  # proxying to Gitea. This is where narrow scoping is actually applied.
  # ---------------------------------------------------------------------------
  gitea-gateway:
    build: ./gitea-gateway
    container_name: cncf-gitea-gateway
    depends_on:
      keycloak:
        condition: service_healthy
      gitea:
        condition: service_healthy
    ports:
      - "${GITEA_GATEWAY_PORT:-9100}:9100"
    environment:
      KEYCLOAK_URL: http://keycloak:8080
      KEYCLOAK_REALM: cncf-demo
      GITEA_URL: http://gitea:3000
      GITEA_ADMIN_USER: ${GITEA_ADMIN_USER:-demo-admin}
      GITEA_ADMIN_PASSWORD: ${GITEA_ADMIN_PASSWORD:?set GITEA_ADMIN_PASSWORD in .env}
      GITEA_READ_SCOPE: gitea:read
      GITEA_WRITE_SCOPE: gitea:write
      GITEA_PR_SCOPE: gitea:pr
      GITEA_DENY_LIST: demo-protected
    networks:
      - cncf-net
    healthcheck:
      test: ["CMD-SHELL", "python -c \"import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:9100/healthz').status==200 else 1)\""]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 5s

  # ---------------------------------------------------------------------------
  # Postgres — AGNTCY identity node DB
  # ---------------------------------------------------------------------------
  identity-postgres:
    image: postgres:16
    container_name: cncf-identity-postgres
    environment:
      POSTGRES_USER: ${DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:?set DB_PASSWORD in .env}
      POSTGRES_DB: ${DB_NAME:-identity}
    volumes:
      - identity-postgres-data:/var/lib/postgresql/data
    networks:
      - cncf-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-postgres}"]
      interval: 5s
      timeout: 3s
      retries: 10

  # ---------------------------------------------------------------------------
  # Vault (dev mode) — AGNTCY identity node key storage
  # ---------------------------------------------------------------------------
  identity-vault:
    image: hashicorp/vault:1.17
    container_name: cncf-identity-vault
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: ${VAULT_DEV_ROOT_TOKEN:?set VAULT_DEV_ROOT_TOKEN in .env}
      VAULT_DEV_LISTEN_ADDRESS: 0.0.0.0:8200
    cap_add:
      - IPC_LOCK
    networks:
      - cncf-net
    healthcheck:
      test: ["CMD-SHELL", "vault status -address=http://127.0.0.1:8200 || exit 1"]
      interval: 5s
      timeout: 3s
      retries: 10

  # ---------------------------------------------------------------------------
  # AGNTCY Identity Node
  # ---------------------------------------------------------------------------
  identity-node:
    image: ghcr.io/agntcy/identity/node:0.0.23
    container_name: cncf-identity-node
    pull_policy: always
    depends_on:
      identity-postgres:
        condition: service_healthy
      identity-vault:
        condition: service_healthy
    ports:
      - "${IDENTITY_NODE_REST_PORT:-4003}:4000"   # REST API
      - "${IDENTITY_NODE_GRPC_PORT:-4004}:4001"   # gRPC
    environment:
      DB_HOST: identity-postgres
      DB_PORT: 5432
      DB_USERNAME: ${DB_USERNAME:-postgres}
      DB_PASSWORD: ${DB_PASSWORD:?set DB_PASSWORD in .env}
      POSTGRES_PASSWORD: ${DB_PASSWORD:?set DB_PASSWORD in .env}
      POSTGRES_DB: ${DB_NAME:-identity}
      VAULT_HOST: identity-vault
      VAULT_DEV_ROOT_TOKEN: ${VAULT_DEV_ROOT_TOKEN:?set VAULT_DEV_ROOT_TOKEN in .env}
      GO_ENV: development
      IAM_ORGANIZATION: ${IAM_ORGANIZATION:-cncf-demo}
      SECRETS_CRYPTO_KEY: ${SECRETS_CRYPTO_KEY:?set SECRETS_CRYPTO_KEY in .env}
      # Keycloak OIDC issuer — realm is provisioned separately after startup.
      IAM_ISSUER: ${IAM_ISSUER:-http://keycloak:8080/realms/cncf-demo}
      IAM_USER_CID: ${IAM_USER_CID:-requesting-app}
      IAM_USER_CID_CLAIM_NAME: azp
    networks:
      - cncf-net
    healthcheck:
      # The node image has no HTTP health endpoint; verify the REST (4000) and
      # gRPC (4001) ports are accepting connections instead.
      test: ["CMD-SHELL", "nc -z 127.0.0.1 4000 && nc -z 127.0.0.1 4001 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 20
      start_period: 20s

  # ---------------------------------------------------------------------------
  # Web app — drives the ID-JAG (Cross-App Access) sequence end to end
  # ---------------------------------------------------------------------------
  webapp:
    build: ./webapp
    container_name: cncf-webapp
    depends_on:
      keycloak:
        condition: service_healthy
      idjag-issuer:
        condition: service_healthy
      gitea-gateway:
        condition: service_healthy
    ports:
      - "${WEBAPP_PORT:-8000}:8000"
    environment:
      KEYCLOAK_URL: http://keycloak:8080
      KEYCLOAK_REALM: cncf-demo
      USER_CLIENT_ID: requesting-app
      USER_CLIENT_SECRET: ${CNCF_REQUESTING_SECRET:-demo-requesting-secret-change-me}
      BACKEND_CLIENT_ID: receiving-app
      BACKEND_CLIENT_SECRET: ${CNCF_RECEIVING_SECRET:-demo-receiving-secret-change-me}
      DEMO_USER: ${CNCF_DEMO_USER:-user}
      DEMO_PASSWORD: ${CNCF_DEMO_PASSWORD:-demo-password-change-me}
      IDJAG_SUBJECT: ${CNCF_IDJAG_SUBJECT:-user@example.com}
      IDJAG_ISSUER_URL: http://idjag-issuer:9000
      GITEA_GATEWAY_URL: http://gitea-gateway:9100
      GITEA_ADMIN_USER: ${GITEA_ADMIN_USER:-demo-admin}
    networks:
      - cncf-net
    healthcheck:
      test: ["CMD-SHELL", "python -c \"import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/health').status==200 else 1)\""]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 5s

networks:
  cncf-net:
    driver: bridge

volumes:
  gitea-data:
  identity-postgres-data:
```

</details>

## Default URLs

- **ID-JAG demo web app: <http://localhost:8000>**
- Keycloak admin console: <http://localhost:8080> (user/password from `.env`)
- Gitea: <http://localhost:3000>
- Gitea gateway (scope-enforcing proxy): <http://localhost:9100>
- Identity node REST API: <http://localhost:4003>
- Identity node gRPC: `localhost:4004`

## Testing the ID-JAG (Cross-App Access) sequence

Open the web app at <http://localhost:8000>. The demo shows the **Requesting
App** obtaining access to the **Receiving App** on behalf of the signed-in
user, and the Receiving App then calling **Gitea** with the exchanged token.

At the top of the page a **scope selector** chooses what the ID-JAG assertion
requests: read-only (`gitea:read`) or read + write (`gitea:read gitea:write`).
Two playback modes are available:

- **Run (animated)** — plays all hops automatically with a short pause
  between each, highlighting the sequence diagram as it goes.
- **Next step** — executes one hop per click, so you can narrate each step
  during a presentation.

Each hop is a real, live call (backed by
`POST /api/step/<login|mint|exchange|gitea-list|gitea-create>`; `POST /api/run`
runs the whole sequence at once). Everything runs server-side (no browser CORS):

1. **Requesting App — user sign-in** — OIDC password grant against Keycloak
   (`cncf-demo` realm, `requesting-app`) for the demo user `user`.
2. **Mint ID-JAG** — the `idjag-issuer` service signs an Identity Assertion JWT
   (`iss` = issuer, `sub` = `user@example.com`, `aud` = the realm issuer,
   `client_id`/`azp` = `receiving-app`, `scope` = the requested scope). It also
   carries an **actor** claim (`act`) identifying the Requesting App acting on
   the user's behalf.
3. **Receiving App — exchange** — the assertion is presented to Keycloak's token
   endpoint with `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer` and
   `client_id=receiving-app`; Keycloak validates it against the `id-jag`
   identity provider (JWKS from the issuer), maps `sub` to the local user via
   its federated identity link, and returns a **downscoped local access token**
   whose `scope` reflects the requested `gitea:*` scope(s).
4. **Read Gitea** — the Receiving App calls `GET /api/gitea/repos` on the
   `gitea-gateway` with the access token. The gateway verifies the token and
   requires `gitea:read`, then lists repositories from Gitea.
5. **Write Gitea** — the Receiving App calls `POST /api/gitea/repos`. The
   gateway requires `gitea:write`. **With a read-only scope this is refused
   (HTTP 403)** — the narrow-scoping payoff — while a read + write token
   creates the repo.

> **Subject vs. actor:** the ID-JAG assertion carries both the `sub` (the end
> user) and the `act` (actor = Requesting App) claims. Keycloak's ID-JAG
> receiver maps `sub` to the local user but does **not** propagate the `act`
> claim into the access token it issues today.

The UI shows the decoded header + claims for each token, and the gateway's JSON
response for the Gitea hops.

### "How it works" tab

The web app has a second tab, **How it works**, that documents the demo for
presenters rather than running it. It explains how Keycloak is configured for
token exchange and ID-JAG / Cross-App Access (the experimental feature flags,
the `receiving-app` client attributes, the `id-jag` identity provider, and the
`kcadm`-registered narrow scopes) with copy-pasteable snippets, and adds extra
sequence diagrams beyond the live flow:

- **One-time trust setup** — how Keycloak learns to trust the issuer's JWKS and
  how `kc-init` registers the narrow scopes.
- **Exchange & narrow-scoping enforcement** — a close-up of the `jwt-bearer`
  exchange and the gateway's scope check (including the 403 on write).
- **Issuing a VC (Badge) with the identity node** — how the identity node
  registers an issuer, generates a resolvable identity, and publishes/verifies a
  Verifiable Credential.
- **VC-backed ID-JAG (proposed)** — how an agent VC would be verified via the
  identity node alongside the user-delegated ID-JAG token, combining delegated
  access with verifiable agent identity.

The identity node is included in this section because ID-JAG proves *the user
authorized this app*, while a VC proves *this app/agent is who it claims to be*.
See [Identity node & Verifiable Credentials](#identity-node--verifiable-credentials-not-yet-wired-in)
below for the integration status.

### Identity node & Verifiable Credentials (not yet wired in)

The stack runs the AGNTCY identity node (REST `:4003`, gRPC `:4004`), a registry
and resolver for agent/app identities and their VCs (AGNTCY **Badges** —
`AgentBadge` / `McpBadge`, W3C VCs in a JOSE envelope). Relevant endpoints:

| Node endpoint (`/v1alpha1`) | Purpose |
| --------------------------- | ------- |
| `POST /issuer/register` | Register a tenant issuer + its public JWK |
| `POST /id/generate` | Mint a resolvable identity (`ResolverMetadata`) from an OIDC proof |
| `POST /vc/publish` | Store a signed VC (validates the OIDC proof against the subject) |
| `POST /vc/verify` | Cryptographically verify a VC |
| `GET /vc/{id}/.well-known/vcs.json` | Public resolution of an identity's VCs |

VC **signing** happens in the Identity Service BFF (with the tenant key from
Vault); the node **publishes / resolves / verifies**. This stack currently runs
the node but **not** the BFF, so live VC issuance is not yet wired into the
ID-JAG flow — the "VC-backed ID-JAG" sequence is a design (per AGNTCY's DCR
`vc+jwt` / Client-ID-Metadata proposal). To make it live you would either run
the Identity Service BFF, or have `idjag-issuer` double as a VC issuer (it
already holds an RSA key + JWKS): register with the node, sign a Badge for
`requesting-app`, publish it, add the `resolver_metadata_id` as a claim in the
ID-JAG assertion, and have the gateway call `/vc/verify` before allowing the
Gitea call.

### Narrow scoping with Gitea

Gitea is the demo's **protected resource**, fronted by the `gitea-gateway`. The
gateway is a small OAuth resource server: it verifies the Receiving App's access
token (RS256 signature via Keycloak's JWKS, issuer, expiry) and enforces the
scope required for each operation before proxying to Gitea with a server-side
admin credential the caller never sees:

| Operation | Endpoint | Required scope |
| --- | --- | --- |
| List repositories | `GET /api/gitea/repos` | `gitea:read` |
| Create a repository | `POST /api/gitea/repos` | `gitea:write` |

Because the ID-JAG assertion only requests the scope the task needs, the token
Keycloak issues is **downscoped**. A read-only assertion yields a token that can
list repos but is rejected by the gateway when it attempts a write — least
privilege enforced end to end, without the Receiving App ever holding broad
Gitea credentials.

The `gitea:read` / `gitea:write` client scopes are registered in the realm by
the one-shot `kc-init` service (via `keycloak/bootstrap-scopes.sh`) and assigned
as **optional** scopes on `receiving-app`, so they are only granted when
explicitly requested. The demo repos are seeded by `gitea-init`
(`gitea/init.sh`).

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
| Client scopes | `gitea:read`, `gitea:write` | Narrow Gitea scopes registered by `kc-init` and assigned as **optional** scopes on `receiving-app`. |

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

## Running the tests

The demo ships with unit tests (per service) and Playwright E2E tests that drive
the web UI.

### Unit tests (pytest)

Each Python service has its own tests. They mock all outbound calls, so no
running stack is required. The services each define a top-level `app` module, so
run them in **separate** invocations:

```bash
python3 -m venv .venv
./.venv/bin/pip install -r idjag-issuer/requirements-dev.txt \
  -r webapp/requirements-dev.txt -r gitea-gateway/requirements-dev.txt

./.venv/bin/python -m pytest idjag-issuer/tests -q    # ID-JAG issuer: JWKS, discovery, /mint contract
./.venv/bin/python -m pytest webapp/tests -q          # web app: /api/config + full /api/run (respx-mocked)
./.venv/bin/python -m pytest gitea-gateway/tests -q   # gateway: token verify + scope enforcement
```

### E2E tests (Playwright)

These drive the real web UI against the **running** stack. Bring the stack up
first (`docker compose up -d`), then:

```bash
cd e2e
npm install
npm run install-browsers          # one-time: downloads chromium
WEBAPP_URL=http://localhost:8000 npm test   # omit WEBAPP_URL to use the default :18000
```

The E2E suite verifies the logical app names render, the five-step sequence
diagram is shown, that a **read-only** run lists repos but is **denied** the
write (narrow scoping), and that a **read + write** run creates the repo.

## Notes

- Keycloak runs in `start-dev` mode (in-memory H2) — suitable for demos only.
- `kc-init` and `gitea-init` are **one-shot** containers: they run to completion
  on `up`, are idempotent, and exit 0 (they show as `Exited (0)` in
  `docker compose ps`).
- Vault runs in dev mode; its data is not persisted across restarts.
- Gitea and Postgres persist data via named volumes (`gitea-data`,
  `identity-postgres-data`). Because Gitea's admin/repos live in `gitea-data`,
  `gitea-init` skips work that already exists; wipe the volume
  (`docker compose down -v`) to re-seed from scratch.
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
