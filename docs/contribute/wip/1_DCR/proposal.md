# Proposal: Dynamic Client Registration of Agentic Services

## Current State

### Identity Provider (IdP) Integration

The `Identity Service` currently integrates IdPs (e.g. Okta, Duo, Ory...) using their specific APIs for the following functions:

- Registration of ClientCredentials for Agentic Services (Agents, MCP Servers): for each new Agentic Service, a new ClientCredential must be created in the IdP,
- Rotation of Secrets: when a ClientCredential's secret is rotated, the new secret must be updated in both the IdP and the Agentic Service.

### Badges and Signature

For each tenant, the `Identity Service` generates a key pair and uses it to sign and verify badges for Agentic Services. The keypair is stored in the `Identity Service` vault.

### Flow Diagram

```mermaid
sequenceDiagram
autonumber

User->>Identity Service: Register IdP
Identity Service->>Idp: Verify Permissions
Idp->>Identity Service: Confirmation
Identity Service->>Identity Service: Store IdP Settings in Vault
User->>Identity Service: Create Agentic Service using IdP API
Identity Service->>Idp: Provision ClientCredentials
Idp->>Identity Service: ClientCredentials
Identity Service->>Identity Service: Store ClientCredentials in Vault
User->>Identity Service: Issue Badge for Agentic Service
Identity Service->>Identity Service: Issue JWT using ClientCredentials
Identity Service->>Identity Service: Get PrivateKey from Vault
Identity Service->>Identity Node: Issue Badge using JWT
Identity Node->>Identity Node: Issue Badge with IdP as Issuer
Identity Node->>Identity Node: Sign the Badge using the PrivateKey
```

## Dynamic Client Registration (DCR) Proposal

To streamline the registration and management of Agentic Services, this proposal suggests implementing Dynamic Client Registration (DCR) as defined in OAuth 2.0 and OpenID Connect specifications. This would allow Agentic Services to register themselves dynamically with the `Identity Service`, reducing manual configuration and improving interoperability.

However, since there is a new alternative standard called Client ID Metadata (OAuth Client ID Metadata Document), we are considering this approach instead of the traditional DCR.

### Client ID Metadata Document Proposal

In the current design the IdP and its ClientCredentials are chained with the Badges in the following way:

```mermaid
flowchart TD
    IdP-OAuth2 --> ClientCredentials --> JsonWebToken --> ClientId-Claim --> Badge-WellKnown --> IdP-Issuer
```

#### Metadata Document Structure

The Client Metadata must comply with the [OAuth Client ID Metadata Document](https://www.iana.org/assignments/oauth-parameters/oauth-parameters.xhtml#client-metadata).
The Client ID Metadata Document might contain the following fields:

- `client_id`: The unique identifier for the Agentic Service
- `client_name`: A human-readable name for the Agentic Service
- `token_endpoint_auth_method`: Use `private_key_jwt` for JWT-based authentication
- `jwks_uri`: The URI where the Agentic Service's public keys can be retrieved

#### New Flow Diagram

```mermaid
sequenceDiagram
autonumber

Identity Service->>Idp: Register using Client ID Metadata Document
Idp->>Identity Service: Provision ClientCredentials
Identity Service->>Identity Service: Store ClientCredentials in Vault
Identity Service->>IdP: Issue JWT using ClientCredentials
Identity Service->>Identity Service: Get PrivateKey from Vault
Identity Service->>Identity Node: Issue Badge using JWT
Identity Node->>Identity Node: Issue Badge with IdP as Issuer
Identity Node->>Identity Node: Sign the Badge using the PrivateKey
```
