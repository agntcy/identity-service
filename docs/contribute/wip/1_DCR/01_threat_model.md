# Proposed Contribution: Threat Model (Section 3.1)

---

## 3.1. Threat Model

This section defines the threat model for cross-domain authorization information sharing in multi-agent systems. Understanding the adversarial landscape is essential for evaluating solution approaches and designing appropriate mitigations.

### 3.1.1. Protected Assets

The following assets require protection in cross-domain agent authorization:

**Authorization Credentials:** Verifiable Credentials, OAuth tokens, and client metadata documents that grant agents access to resources across domains.

**Agent Identity Information:** Claims about agent provenance, capabilities, compliance status, and operational parameters embedded in VCs or metadata.

**Authorization Decisions:** The integrity of access control determinations made by Authorization Servers based on presented credentials.

**Cross-Domain Trust Relationships:** The established trust between domains that enables agents to operate across organizational boundaries.

**Audit Trails:** Logs and records of authorization events necessary for compliance, forensics, and incident response.

### 3.1.2. Threat Actors

This specification considers the following threat actors:

**Malicious Agent:** An agent that has been compromised or intentionally deployed to exceed authorized scope, exfiltrate data, or abuse delegated permissions. The agent may possess valid credentials obtained through legitimate means.

**Compromised MCP Server:** An MCP Server that has been compromised by an attacker and may return malicious tool responses, leak sensitive data from authorized agents, or attempt to elevate privileges through the agents it serves.

**Rogue Identity Provider:** An IdP that issues fraudulent credentials, either through compromise or malicious operation. May issue VCs with false claims about agent capabilities or compliance status.

**Rogue Authorization Server:** An AS that makes incorrect authorization decisions, either through misconfiguration, compromise, or malicious intent. May grant excessive permissions or leak authorization metadata.

**External Attacker:** An attacker without legitimate access who attempts to intercept, replay, or forge authorization credentials through network-level attacks or exploitation of protocol vulnerabilities.

**Insider Threat:** A legitimate user or administrator who abuses their position to create over-privileged agents, bypass authorization controls, or exfiltrate authorization credentials.

### 3.1.3. Attack Categories

The following attack categories are relevant to cross-domain agent authorization:

#### 3.1.3.1. Credential Attacks

**Credential Replay:** An attacker captures a valid vc+jwt or access token and replays it to gain unauthorized access. This is particularly concerning for long-lived credentials in high-latency cross-domain scenarios.

**Credential Theft:** Exfiltration of agent credentials from storage, memory, or transit. Stolen credentials may be used to impersonate legitimate agents.

**Credential Forgery:** Attempts to create fraudulent VCs or metadata documents that appear valid. May exploit weak cryptographic implementations or compromised signing keys.

#### 3.1.3.2. Identity and Metadata Attacks

**Metadata Endpoint Compromise:** An attacker gains control of the URL hosting an agent's client-id metadata document and substitutes malicious metadata or VCs. The AS fetching this metadata would then provision an attacker-controlled identity.

**Metadata Poisoning:** Injection of false claims into legitimate metadata documents through supply chain attacks, DNS hijacking, or exploitation of the hosting infrastructure.

**Identity Correlation:** Linking agent activities across domains to build profiles of organizational operations, potentially revealing sensitive business processes or security postures.

#### 3.1.3.3. Authorization Attacks

**Confused Deputy:** An attacker tricks a trusted agent into performing actions on their behalf that the attacker is not authorized to perform directly. This is particularly relevant in multi-agent chains where Agent A invokes Agent B. (See: Norm Hardy, 1988)

**Privilege Escalation:** Exploiting gaps between claimed capabilities in VCs and actual enforcement at the AS or resource server to gain access beyond authorized scope.

**Scope Creep in Delegation:** In multi-hop agent workflows (A to B to C), downstream agents accumulate permissions beyond what the originating principal intended to delegate.

**Policy Skew:** An agent trusted in Domain A operates in Domain B where different security policies apply. The agent may inadvertently (or intentionally) perform actions that violate Domain B's policies while remaining within Domain A's authorized scope.

**Trust Score Manipulation:** Artificially inflating trust scores or compliance attestations in VCs to gain access to resources requiring higher trust levels.

#### 3.1.3.4. Availability Attacks

**Metadata Endpoint Denial:** Making the client-id metadata endpoint unavailable, preventing legitimate agents from authenticating or re-authenticating.

**Revocation Infrastructure Attacks:** Attacks against VC status endpoints or revocation registries that prevent detection of revoked credentials or cause false revocation signals.

#### 3.1.3.5. Multi-Agent Specific Attacks

**Delegation Chain Manipulation:** Altering or forging the chain of delegation in multi-agent workflows to obscure accountability or inject unauthorized agents into a workflow.

**Agent Spawning Abuse:** A compromised orchestrator agent creating numerous sub-agents with excessive permissions, amplifying the impact of the initial compromise.

**Cross-Domain Lateral Movement:** Using legitimate cross-domain authorization to pivot from a compromised position in Domain A to resources in Domain B that would not otherwise be accessible.

---

## Contributor Information

This section was contributed by:

**Nik Kale**  
Principal Engineer, Cisco Systems

---

