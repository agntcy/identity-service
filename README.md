# AGNTCY Identity Service

[![Lint](https://github.com/agntcy/identity-service/actions/workflows/lint.yml/badge.svg?branch=main)](https://github.com/marketplace/actions/super-linter)
[![Contributor-Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-fbab2c.svg)](CODE_OF_CONDUCT.md)

<p align="center">
  <a href="https://agntcy.org">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="img/logo-white.png" width="300">
      <img alt="" src="img/logo-color.png" width="300">
    </picture>
  </a>
  <br />
  <caption>Welcome to the <b>Identity Service</b> repository</caption>
</p>

---

AGNTCY Identity Service serves as the central hub for managing and verifying digital identities for your Agentic Services. In today's interconnected digital landscape, secure and reliable identity management is paramount. AGNTCY Identity Service addresses this need by providing a streamlined service to:

- Verify the authenticity of existing identity badges.
- Register new Agentic Services, establishing their unique identities.
- Define TBAC (Task-Based Access Control) policies to govern access and permissions.

Whether you are integrating existing services or deploying new ones, AGNTCY Identity Service ensures that all your components—including MCP Servers, A2A Agents, and OASF—are properly identified, managed and secured.

## 📚 Table of Contents

- 🌟 [Main Components](#-main-components).
- ⚡️ [Get Started](#%EF%B8%8F-get-started-in-5-minutes) in 5 Minutes.

You can also:

- 📦 Check-out the [Sample Agents and MCP servers](samples/README.md).
- 📘 Explore our full [Documentation](https://identity-docs.outshift.com/) to understand our platform's capabilities.
- 📝 See a full video [Walkthrough](https://www.youtube.com/watch?v=CO3YwjRXyQo&t=1s) of the Identity Service.

## 🌟 Main Components

- **Backend**: Core identity management service.
- **Frontend**: Web interface for user interactions.
- **SDKs**: Libraries for various programming languages to interact with the Identity Service.
- **Docs**: Comprehensive documentation for users and developers.
- **Samples**: Example agents and MCP servers to demonstrate integration.

## ⚡️ Get Started in 5 Minutes

This short guide allows you to setup the Identity Service `Frontend` as well as the Identity Service `Backend`.

### Prerequisites

To run these steps successfully, you need to have the following installed:

- [Docker Desktop](https://docs.docker.com/get-docker/), or have both: [Docker Engine v27 or higher](https://docs.docker.com/engine/install/) and [Docker Compose v2.35 or higher](https://docs.docker.com/compose/install/)

1. Setup OIDC Provider

   - Create an OIDC application in your OIDC provider.

     You can use any OIDC provider of your choice. For testing purposes, you can use [Ory](https://www.ory.sh/), [Keycloak](https://www.keycloak.org/) or [Auth0](https://auth0.com/).
     Configure the following variables in your shell environment:

     ```bash
     export OIDC_ISSUER_URL=<OIDC_ISSUER_URL>
     export OIDC_CLIENT_ID=<OIDC_CLIENT_ID>
     export OIDC_LOGIN_URL=<OIDC_LOGIN_URL>
     export OIDC_CLIENT_ID_CLAIM_NAME=<OIDC_CLIENT_ID_CLAIM_NAME>
     ```

     where:

     - `OIDC_ISSUER_URL` - The URL of your OIDC provider (e.g., `https://{INSTANCE_URL}/oauth2/{CLIENT_ID}/.well-known/openid-configuration`).
     - `OIDC_CLIENT_ID` - The client ID you created in your OIDC provider.
     - `OIDC_LOGIN_URL` - The login URL of your OIDC provider (e.g., `https://{INSTANCE_URL}/oauth2/{CLIENT_ID}/authorize`).
     - `OIDC_CLIENT_ID_CLAIM_NAME` - The claim name in the Access token that contains the client ID (default: `cid`).

       > **📝 NOTE**
       > Make sure to add `http://localhost:5500` as a redirect URI for your OIDC client.

   - Or use our demo script to setup a local OIDC provider using [Ory Hydra](https://www.ory.sh/):

     ```bash
     . ./demo/scripts/setup_hydra_oidc
     ```

     This will setup a local OIDC provider using Ory and configure the necessary environment variables in your shell.

2. Start the Frontend and the Backend with Docker:

   ```bash
   ./deployments/scripts/launch.sh
   ```

   Or use `make` if available locally:

   ```bash
   make start
   ```

   > **📝 NOTE**
   > You can also install the `Backend` and the `Frontend` using our [Helm charts](charts).

3. Access the Frontend UI and the Backend APIs:

   - The Backend APIs will be available at: `http://localhost:4000` for REST and `http://localhost:4001` for gRPC.
   - The Frontend UI will be available at: `http://localhost:5500`.

## Development

For more detailed development instructions please refer to the following sections:

- [Backend](backend/README.md)
- [Frontend](frontend/README.md)
- [Samples](samples/README.md)
- [Api Spec](backend/api/spec/README.md)
- [Python SDK](/sdk/python/README.md)

## Roadmap

See the [open issues](https://github.com/agntcy/identity-service/issues) for a list
of proposed features (and known issues).

## Contributing

Contributions are what make the open source community such an amazing place to
learn, inspire, and create. Any contributions you make are **greatly
appreciated**. For detailed contributing guidelines, please see
[CONTRIBUTING.md](CONTRIBUTING.md).

## Copyright Notice

[Copyright Notice and License](LICENSE)

Distributed under Apache 2.0 License. See LICENSE for more information.
Copyright [2025 Cisco Systems, Inc. and its affiliates](https://github.com/agntcy) Contributors.
