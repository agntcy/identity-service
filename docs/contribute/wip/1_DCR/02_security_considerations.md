# Proposed Contribution: Security Considerations (Expanded Section 8)

---

## 8. Security Considerations

This section provides security considerations for implementations of cross-domain authorization information sharing for agents using the Client-ID Metadata with Verifiable Credentials approach (Solution Approach 4).

### 8.1. Credential Security

#### 8.1.1. Cryptographic Requirements

Implementations MUST use cryptographic algorithms with security strength appropriate for the sensitivity of the protected resources, following the recommendations in [RFC8446] and relevant CFRG best current practices.

Implementations MUST NOT use algorithms known to be weak or deprecated, including but not limited to:

- Hash functions with known collision vulnerabilities (e.g., MD5, SHA-1)
- Symmetric algorithms with insufficient key lengths
- Asymmetric algorithms with key sizes below current industry guidance

For VC signatures and JWT operations, implementations SHOULD follow the algorithm recommendations in [RFC7518] and the W3C Verifiable Credentials specification.

#### 8.1.2. Credential Lifetime Management

VCs issued for agent authorization SHOULD have bounded lifetimes appropriate to the operational context. Factors to consider include:

- Agent lifecycle: ephemeral single-task agents warrant shorter lifetimes than long-running system agents
- Sensitivity: access to regulated or high-impact resources warrants shorter lifetimes
- Operational constraints: cross-domain latency and availability requirements may influence minimum practical lifetimes

As a general guideline, organizations might consider:

- Short-lived agents (ephemeral tools): minutes to low single-digit hours
- Session-bound agents: aligned with user session lifetime
- Long-running system agents: bounded with mandatory refresh cycles

The `exp` (expiration) and `nbf` (not before) claims MUST be present in all agent authorization VCs. Authorization Servers MUST reject VCs where current time falls outside the [nbf, exp] window.

#### 8.1.3. Credential Revocation

Implementations MUST support credential revocation through at least one of the following mechanisms:

1. Bitstring Status List [W3C.BitstringStatusList] embedded in the VC
2. Revocation endpoint specified in the VC's `credentialStatus` field
3. Short credential lifetimes with re-issuance

Authorization Servers SHOULD check revocation status:

- At initial credential presentation
- Periodically during long-running sessions, at intervals appropriate to the sensitivity of the resources being accessed
- Before sensitive or irreversible operations

Revocation checks MUST fail closed: if the revocation status cannot be determined, the credential MUST be treated as revoked.

### 8.2. Metadata Endpoint Security

#### 8.2.1. Transport Security

Client-ID Metadata endpoints MUST be served over HTTPS with TLS 1.2 or higher. TLS 1.3 is RECOMMENDED.

Implementations SHOULD implement:

- HTTP Strict Transport Security (HSTS)
- Certificate Transparency logging
- OCSP stapling for certificate status

#### 8.2.2. Endpoint Integrity

To mitigate metadata endpoint compromise:

1. Metadata documents SHOULD be signed independently of the transport layer, allowing verification even if TLS is compromised.
2. Authorization Servers SHOULD cache metadata documents and detect unexpected changes to critical fields (jwks_uri, vc+jwt).
3. Implementations SHOULD support integrity verification for any referenced resources.

#### 8.2.3. Availability Considerations

Authorization Servers SHOULD implement graceful degradation when metadata endpoints are unavailable:

- Cache previously fetched metadata with appropriate TTLs
- Implement circuit breakers to prevent cascading failures
- Provide clear error signaling to agents when authentication cannot proceed due to metadata unavailability

### 8.3. Authorization Decision Security

#### 8.3.1. Principle of Least Privilege

Authorization Servers MUST enforce least privilege when processing agent VCs:

- Grant only the minimum scopes necessary for the requested operation
- Intersect (not union) permissions when multiple claims apply
- Reject overly broad scope requests even if the VC would permit them

Agents SHOULD request only the permissions they need for the immediate task, not the full set of permissions their VC authorizes.

#### 8.3.2. Trust Score Handling

If VCs contain trust scores or similar continuous trust signals:

- Trust scores MUST NOT be the sole basis for authorization decisions
- Thresholds for trust-score-based decisions SHOULD be configurable per resource sensitivity level
- Trust score provenance (who computed it, when, based on what) SHOULD be verifiable
- Authorization Servers SHOULD implement score freshness checks

#### 8.3.3. Cross-Domain Policy Alignment

Before accepting a VC from another domain, the AS SHOULD verify:

1. The issuing domain is in the AS's trust list
2. The VC's claims are compatible with local policy requirements
3. Compliance attestations in the VC meet local regulatory requirements

Implementations SHOULD maintain explicit policy mappings between domains rather than assuming semantic equivalence of claims.

### 8.4. Multi-Agent and Delegation Security

#### 8.4.1. Delegation Chain Integrity

In multi-hop agent workflows, each delegation step MUST be cryptographically verifiable. Implementations SHOULD:

- Maintain an auditable chain linking each agent to its delegating principal
- Require explicit authorization for an agent to delegate to sub-agents
- Enforce monotonic scope narrowing (downstream agents cannot have broader permissions than upstream)

See Section 5.4.1 (Delegation in Multi-Agent Workflows) for detailed delegation semantics.

#### 8.4.2. Agent Isolation

Implementations SHOULD enforce isolation between agents to limit blast radius of compromise:

- Separate credential storage per agent
- Distinct network identities where feasible
- Resource quotas (API calls, compute, storage) per agent

#### 8.4.3. Orchestrator Security

Orchestrator agents that spawn or coordinate other agents present elevated risk and SHOULD be subject to enhanced controls:

- More restrictive VC issuance policies
- Enhanced monitoring and alerting
- Mandatory audit logging of all sub-agent creation
- Rate limiting on sub-agent spawning

### 8.5. Operational Security

#### 8.5.1. Key Management

Private keys used for VC signing and agent authentication MUST be:

- Generated using cryptographically secure random number generators
- Protected using hardware security modules (HSMs) or equivalent secure storage for production deployments
- Rotated according to organizational key management policies

Key compromise procedures MUST be documented and tested, including:

- Emergency revocation of all credentials signed by compromised keys
- Re-issuance workflows for affected agents
- Forensic preservation of relevant logs

#### 8.5.2. Monitoring and Alerting

Implementations MUST log the following events:

- VC issuance and revocation
- VC presentation and verification (success and failure)
- Authorization decisions (grants and denials)
- Metadata document fetches and updates
- Delegation events in multi-agent workflows

Implementations SHOULD alert on:

- Failed verification attempts exceeding threshold
- VCs presented after expiration
- Metadata endpoint changes
- Unusual cross-domain access patterns
- Trust score anomalies

#### 8.5.3. Incident Response

Organizations deploying cross-domain agent authorization SHOULD maintain incident response procedures that address:

- Credential compromise containment (revocation, scope reduction)
- Cross-domain notification of security events
- Forensic investigation across domain boundaries
- Recovery and re-establishment of trust relationships

### 8.6. Privacy Considerations

#### 8.6.1. Selective Disclosure

Agents SHOULD use selective disclosure mechanisms (e.g., SD-JWT VC, BBS+ signatures) when presenting VCs to:

- Reveal only claims necessary for the specific authorization request
- Prevent correlation of agent activities across unrelated interactions
- Protect sensitive organizational information embedded in VCs

#### 8.6.2. Metadata Minimization

Client-ID Metadata documents SHOULD contain only information necessary for authorization:

- Avoid including operational details not required by the AS
- Consider separate metadata documents for different trust levels
- Implement appropriate access controls on metadata endpoints if they contain sensitive information

#### 8.6.3. Cross-Domain Correlation Risks

Organizations SHOULD assess the privacy implications of cross-domain agent authorization, including:

- Whether agent identifiers enable activity correlation
- What organizational information is revealed through VC claims
- Whether authorization patterns reveal sensitive business processes

---

## References

```
[W3C.BitstringStatusList]
    Sporny, M., Longley, D., and C. Allen, "Bitstring Status List",
    W3C Working Draft, 2023,
    <https://www.w3.org/TR/vc-status-list/>.

[RFC7518]
    Jones, M., "JSON Web Algorithms (JWA)", RFC 7518,
    DOI 10.17487/RFC7518, May 2015,
    <https://www.rfc-editor.org/info/rfc7518>.

[RFC8446]
    Rescorla, E., "The Transport Layer Security (TLS) Protocol
    Version 1.3", RFC 8446, DOI 10.17487/RFC8446, August 2018,
    <https://www.rfc-editor.org/info/rfc8446>.
```

---

## Contributor Information

This section was contributed by:

**Nik Kale**  
Principal Engineer, Cisco Systems

---

