# Proposed Contribution: Agent Authorization VC Profile (Section 5.4.2)

---

## 5.4.2. Agent Authorization Verifiable Credential Profile

This section defines a Verifiable Credential profile for agent authorization, specifying required and optional claims that enable interoperable cross-domain authorization while supporting organization-specific extensions.

### 5.4.2.1. Profile Overview

The Agent Authorization VC Profile (AAVC) provides a standardized structure for VCs that assert an agent's identity, capabilities, compliance status, and operational parameters. The profile is designed to:

- Enable Authorization Servers to make informed access control decisions
- Support selective disclosure of sensitive claims
- Allow organizational extensions without breaking interoperability
- Facilitate audit and compliance verification

### 5.4.2.2. Credential Structure

An Agent Authorization VC conforming to this profile MUST include the following structure:

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1",
    "https://example.org/contexts/agent-authz/v1"
  ],
  "type": ["VerifiableCredential", "AgentAuthorizationCredential"],
  "issuer": "...",
  "issuanceDate": "...",
  "expirationDate": "...",
  "credentialStatus": { "..." },
  "credentialSubject": { "..." },
  "proof": { "..." }
}
```

### 5.4.2.3. Required Claims

The credentialSubject MUST include the following claims:

**id (required):** A globally unique identifier for the agent. This SHOULD be a URI that can be dereferenced to obtain the agent's client-id metadata.

```json
"id": "https://identity.example.com/agents/agent-001/client-metadata"
```

**agentType (required):** The classification of the agent. Implementations MUST support the following values:

- `tool-agent`: An agent that provides specific tool/skill capabilities
- `orchestrator-agent`: An agent that coordinates other agents
- `workflow-agent`: An agent that executes multi-step workflows
- `system-agent`: A long-running infrastructure agent
- `ephemeral-agent`: A short-lived, single-task agent

```json
"agentType": "workflow-agent"
```

**authorizedScopes (required):** An array of authorization scopes that this agent is permitted to request. Scopes SHOULD follow the format `resource:action` or use URIs for complex permissions.

```json
"authorizedScopes": [
  "logs:read",
  "config:read",
  "metrics:read",
  "https://example.org/scopes/support-access"
]
```

**issuerDomain (required):** The administrative domain of the credential issuer. Used by Authorization Servers to apply domain-specific trust policies.

```json
"issuerDomain": "example.com"
```

### 5.4.2.4. Recommended Claims

The following claims are RECOMMENDED for production deployments:

**agentName (recommended):** A human-readable name for the agent.

```json
"agentName": "Customer Support Assistant v2.3"
```

**agentVersion (recommended):** The version identifier of the agent software.

```json
"agentVersion": "2.3.1-build.4521"
```

**tenantId (recommended):** For multi-tenant deployments, the identifier of the tenant context in which this agent operates.

```json
"tenantId": "tenant-acme-corp-prod"
```

**dataSensitivityClearance (recommended):** The maximum data sensitivity level this agent is cleared to access. Implementations SHOULD support at least:

- `public`: Publicly available information
- `internal`: Organization-internal, non-sensitive
- `confidential`: Business-sensitive information
- `restricted`: Highly sensitive, need-to-know basis
- `regulated`: Subject to regulatory controls (PII, PHI, PCI, etc.)

```json
"dataSensitivityClearance": "confidential"
```

**complianceAttestations (recommended):** An array of compliance certifications or policy attestations relevant to this agent's operation.

```json
"complianceAttestations": [
  {
    "standard": "ISO-27001",
    "scope": "information-security-management",
    "validUntil": "2026-03-15T00:00:00Z"
  },
  {
    "standard": "SOC2-Type2",
    "scope": "security-availability",
    "validUntil": "2025-08-01T00:00:00Z"
  },
  {
    "standard": "GDPR",
    "scope": "data-processing",
    "dpaReference": "https://legal.example.com/dpa/v2"
  }
]
```

**operationalConstraints (recommended):** Runtime constraints that Authorization Servers and MCP Servers SHOULD enforce:

```json
"operationalConstraints": {
  "maxConcurrentSessions": 10,
  "maxRequestsPerMinute": 100,
  "maxSessionDurationSeconds": 3600,
  "allowedTimeWindows": [
    {
      "days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
      "startTime": "06:00",
      "endTime": "22:00",
      "timezone": "America/Los_Angeles"
    }
  ],
  "geofence": {
    "allowedRegions": ["US", "EU", "UK"],
    "deniedRegions": []
  }
}
```

**trustSignals (recommended):** Dynamic trust indicators that may influence authorization decisions. These SHOULD be used as supplementary signals, not sole authorization criteria.

```json
"trustSignals": {
  "trustScore": 0.94,
  "trustScoreProvider": "https://trust.example.com",
  "trustScoreTimestamp": "2025-12-15T10:30:00Z",
  "riskIndicators": [],
  "lastSecurityAudit": "2025-11-01T00:00:00Z"
}
```

### 5.4.2.5. Optional Claims

The following claims are OPTIONAL and support specific use cases:

**modelInfo (optional):** For AI-powered agents, information about the underlying model:

```json
"modelInfo": {
  "modelFamily": "llm-provider-x",
  "modelVersion": "model-v2-20240229",
  "modelProvider": "provider-name",
  "approvedForUseCases": ["customer-support", "code-review"],
  "prohibitedUseCases": ["medical-diagnosis", "legal-advice"]
}
```

**delegation (optional):** Delegation permissions as defined in Section 5.4.1.6.

**provenance (optional):** Supply chain and deployment provenance information:

```json
"provenance": {
  "buildId": "build-20251210-abc123",
  "sourceRepository": "https://github.com/example/agent-suite",
  "commitHash": "a1b2c3d4e5f6",
  "slsaLevel": "SLSA_BUILD_LEVEL_3",
  "deploymentEnvironment": "production",
  "deployedBy": "ci-pipeline-main"
}
```

**policyBindings (optional):** References to policies that govern this agent's behavior:

```json
"policyBindings": [
  {
    "policyId": "https://policies.example.com/agent-conduct/v2",
    "policyVersion": "2.1.0",
    "enforcementMode": "enforce"
  },
  {
    "policyId": "https://policies.example.com/data-handling/v1",
    "policyVersion": "1.5.2",
    "enforcementMode": "audit"
  }
]
```

### 5.4.2.6. Extension Mechanism

Organizations MAY extend the Agent Authorization VC Profile with additional claims by:

1. Defining a JSON-LD context document for the extension
2. Including the extension context URI in the VC's @context array
3. Adding extension claims under a namespace prefix or dedicated object

Example extension for organization-specific claims:

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://example.org/contexts/agent-authz/v1",
    "https://vendor.example.com/contexts/secure-access-agent/v1"
  ],
  "type": [
    "VerifiableCredential",
    "AgentAuthorizationCredential",
    "VendorSecureAccessAgentCredential"
  ],
  "credentialSubject": {
    "id": "https://identity.example.com/agents/xdr-support-001",
    "agentType": "workflow-agent",
    "authorizedScopes": ["logs:read", "incidents:read", "config:read"],
    "issuerDomain": "example.com",
    "vendorext:productLine": "Secure Access",
    "vendorext:supportTier": "premium",
    "vendorext:allowedTenantPattern": "tenant-*-prod"
  }
}
```

Implementations receiving VCs with unrecognized extension claims SHOULD ignore unknown claims rather than rejecting the VC, unless the claim is marked as critical.

### 5.4.2.7. Complete Example

The following is a complete example of an Agent Authorization VC for a security operations workflow agent:

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1",
    "https://example.org/contexts/agent-authz/v1"
  ],
  "type": ["VerifiableCredential", "AgentAuthorizationCredential"],
  "issuer": "did:web:identity.example.com",
  "issuanceDate": "2025-12-10T00:00:00Z",
  "expirationDate": "2025-12-11T00:00:00Z",
  "credentialStatus": {
    "id": "https://identity.example.com/credentials/status/3#4521",
    "type": "StatusList2021Entry",
    "statusPurpose": "revocation",
    "statusListIndex": "4521",
    "statusListCredential": "https://identity.example.com/credentials/status/3"
  },
  "credentialSubject": {
    "id": "https://identity.example.com/agents/xdr-triage-001/client-metadata",
    "agentType": "workflow-agent",
    "agentName": "XDR Triage Assistant",
    "agentVersion": "3.2.1",
    "issuerDomain": "example.com",
    "tenantId": "tenant-acme-prod",
    "authorizedScopes": [
      "alerts:read",
      "incidents:read",
      "logs:read",
      "endpoints:read",
      "playbooks:execute"
    ],
    "dataSensitivityClearance": "confidential",
    "complianceAttestations": [
      {
        "standard": "SOC2-Type2",
        "scope": "security-availability",
        "validUntil": "2026-06-01T00:00:00Z"
      }
    ],
    "operationalConstraints": {
      "maxConcurrentSessions": 5,
      "maxRequestsPerMinute": 60,
      "maxSessionDurationSeconds": 7200
    },
    "trustSignals": {
      "trustScore": 0.92,
      "trustScoreProvider": "https://trust.example.com",
      "trustScoreTimestamp": "2025-12-10T08:00:00Z"
    },
    "delegation": {
      "permitted": true,
      "maxDepth": 1,
      "allowedDelegateeTypes": ["tool-agent"],
      "scopeRestrictions": {
        "nonDelegatable": ["playbooks:execute"]
      }
    },
    "modelInfo": {
      "modelFamily": "internal-llm",
      "modelVersion": "sec-llm-v2",
      "approvedForUseCases": ["security-triage", "alert-analysis"]
    }
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2025-12-10T00:00:00Z",
    "verificationMethod": "did:web:identity.example.com#key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "z58DAdFfa9SkqZMV...base58-encoded-signature..."
  }
}
```

### 5.4.2.8. Interoperability Requirements

For interoperability across domains, implementations:

**MUST:**

- Support the required claims defined in Section 5.4.2.3
- Recognize the `AgentAuthorizationCredential` type
- Process the base context `https://example.org/contexts/agent-authz/v1`
- Verify the credential proof before processing claims

**SHOULD:**

- Support the recommended claims defined in Section 5.4.2.4
- Implement selective disclosure for sensitive claims
- Log unrecognized claims for operational visibility

**MAY:**

- Define and process organization-specific extensions
- Implement additional validation beyond the profile requirements

---

## References

```
[I-D.ietf-oauth-selective-disclosure-jwt]
    Fett, D., Yasuda, K., and B. Campbell, "Selective Disclosure
    for JWTs (SD-JWT)", Internet-Draft, 2024.
```

---

## Contributor Information

This section was contributed by:

**Nik Kale**  
Principal Engineer, Cisco Systems

---

