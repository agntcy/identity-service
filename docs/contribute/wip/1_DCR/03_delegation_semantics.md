# Proposed Contribution: Delegation in Multi-Agent Workflows (Section 5.4.1)

---

## 5.4.1. Delegation Semantics for Multi-Agent Chains

Multi-agent systems frequently involve chains of delegation where Agent A invokes Agent B, which may in turn invoke Agent C. This section defines the authorization semantics for such delegation chains.

### 5.4.1.1. Delegation Models

This specification supports two delegation models:

**Direct Invocation:** Agent A directly invokes MCP Server M using A's own credentials. The MCP Server authorizes the request based solely on A's VC. No delegation occurs; A is the sole principal.

```
+----------+                         +--------------+
| Agent A  |                         | MCP Server M |
+----------+                         +--------------+
     |                                      |
     | 1. Request + VC(A)                   |
     |------------------------------------->|
     |                                      |
     |                        2. Verify VC(A)
     |                        3. Authorize based on A's claims
     |                                      |
     | 4. Response                          |
     |<-------------------------------------|
     |                                      |
```

**Delegated Invocation:** Agent A invokes Agent B to perform a task. B acts on A's behalf (and transitively, on behalf of A's originating principal) when accessing resources. The authorization decision considers both A's delegation grant and B's own credentials.

```
+-----------+   +---------+   +---------+   +--------------+
| Principal |   | Agent A |   | Agent B |   | MCP Server M |
|     P     |   |         |   |         |   |              |
+-----------+   +---------+   +---------+   +--------------+
      |              |             |               |
      | 1. Task      |             |               |
      |------------->|             |               |
      |              |             |               |
      |              | 2. Delegate |               |
      |              |    + VC(A)  |               |
      |              |------------>|               |
      |              |             |               |
      |              |             | 3. Request    |
      |              |             |    + VC(B)    |
      |              |             |    + Deleg(A) |
      |              |             |-------------->|
      |              |             |               |
      |              |             |  4. Verify chain
      |              |             |  5. Authorize
      |              |             |               |
      |              |             | 6. Response   |
      |              |             |<--------------|
      |              |             |               |
      |              | 7. Result   |               |
      |              |<------------|               |
      |              |             |               |
      | 8. Result    |             |               |
      |<-------------|             |               |
      |              |             |               |
```

### 5.4.1.2. Scope Derivation Rules

When Agent A delegates to Agent B, B's effective scope MUST be computed as the intersection of:

1. A's delegatable scope (the subset of A's permissions that A is authorized to delegate)
2. B's intrinsic scope (the permissions B holds in its own VC)
3. The explicit scope grant in the delegation (what A actually delegated to B for this invocation)

```
Effective_Scope(B) = A.delegatable_scope
                     INTERSECT B.intrinsic_scope
                     INTERSECT Delegation.granted_scope
```

This ensures:

- B cannot exceed A's authority (no privilege amplification)
- B cannot exceed its own authority (intrinsic limits apply)
- A can further restrict B for specific tasks (explicit grant)

Implementations MUST enforce monotonic scope narrowing: at each delegation step, the effective scope can only decrease or remain the same, never increase.

**Technical grounding:** This intersection semantics aligns with capability-based security principles (see: Mark Miller's Principle of Least Authority, Google Macaroons, Biscuit authorization tokens) and is consistent with RFC 8693 Token Exchange delegation semantics.

### 5.4.1.3. Accountability Chain Construction

Each delegation step MUST produce a verifiable record linking the delegating agent to the delegatee. The delegation record SHOULD include:

- Delegator identifier (Agent A's id from its VC)
- Delegatee identifier (Agent B's id from its VC)
- Timestamp of delegation
- Granted scope
- Expiration (MUST NOT exceed delegator's credential expiration)
- Purpose or task context (RECOMMENDED)
- Cryptographic binding to delegator's credential

The complete accountability chain enables:

1. **Attribution:** Determining which principal (human or system) originated a request that traversed multiple agents
2. **Forensics:** Reconstructing the sequence of delegations that led to a particular action
3. **Revocation:** Identifying all downstream delegations that must be invalidated when an upstream credential is revoked

### 5.4.1.4. Delegation Depth Limits

Implementations SHOULD enforce maximum delegation depth to limit complexity and audit burden. The appropriate maximum depth depends on operational requirements and risk tolerance:

- Sensitive operations may warrant restricting to direct invocation only (no delegation)
- General workflows might permit moderate delegation chains
- Complex orchestration scenarios may require deeper chains with compensating controls

When a request exceeds the configured maximum delegation depth, the AS MUST reject the request with an error indicating the depth violation.

### 5.4.1.5. Re-Authorization Requirements

Long-running delegation chains SHOULD implement re-authorization checkpoints:

- At time intervals appropriate to the sensitivity of operations
- At trust boundary crossings (entering a new domain)
- Before irreversible operations
- When ambient risk signals change (e.g., anomaly detection triggers)

Re-authorization MAY require:

- Fresh VC presentation from the delegating agent
- Step-up authentication from the originating principal
- Explicit re-consent for continued delegation

### 5.4.1.6. Delegation in VCs

To express delegation authority in VCs, the following claims are defined for the credentialSubject:

```json
{
  "credentialSubject": {
    "id": "https://example.com/agents/agent-a",
    "delegation": {
      "permitted": true,
      "maxDepth": 2,
      "allowedDelegateeTypes": ["tool-agent", "workflow-agent"],
      "scopeRestrictions": {
        "nonDelegatable": ["admin:*", "pii:write"],
        "requiresApproval": ["production:*"]
      }
    }
  }
}
```

**delegation.permitted:** Boolean indicating whether this agent may delegate to other agents. Default: false.

**delegation.maxDepth:** Maximum additional delegation hops this agent may initiate. Default: 0 (no sub-delegation).

**delegation.allowedDelegateeTypes:** Array of agent types to which delegation is permitted. If absent, delegation to any agent type is permitted (subject to other constraints).

**delegation.scopeRestrictions.nonDelegatable:** Scopes that this agent may use but MUST NOT delegate to other agents.

**delegation.scopeRestrictions.requiresApproval:** Scopes that require explicit approval (e.g., from the originating principal) before delegation.

---

## References

```
[RFC8693]
    Jones, M., Nadalin, A., Campbell, B., Bradley, J., and
    C. Mortimore, "OAuth 2.0 Token Exchange", RFC 8693,
    DOI 10.17487/RFC8693, January 2020,
    <https://www.rfc-editor.org/info/rfc8693>.

[Hardy1988]
    Hardy, N., "The Confused Deputy: (or why capabilities might
    have been invented)", ACM SIGOPS Operating Systems Review,
    Volume 22, Issue 4, Pages 36-38, October 1988,
    DOI 10.1145/54289.871709.
```

---

## Contributor Information

This section was contributed by:

**Nik Kale**  
Principal Engineer, Cisco Systems

---

