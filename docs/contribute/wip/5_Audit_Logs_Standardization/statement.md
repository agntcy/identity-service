# Audit Logs & Standardization

This is the charter for the AGNTCY Identity Working Group Audit Logs & Standardization track.  

Our goal is to define and propose enhancements for standards for audit logging to capture valuable data points in agentic workflows such as intent, tasks, delegation chains, and related metadata. This would improve transparency, accountability, and support compliance or forensic analysis.

## Personas

Our primary persona is the **security professional**.  In the context of agentic workflows, they care about:
* where did credentials come from,  
* what type of credentials are they (service account, impersonation, on behalf of), 
* which agent used it,  
* what access does it represent (resource, internal vs external), 
* what policies were enforced, and what was the verdict (both approved and rejected access) 
* who is responsible for the system(s) in question (agent, resource, credential, etc.) 
* and that audit logs are machine-readable, and can be fed into agentic support systems 

A secondary persona is the **compliance professional**.  In the context of agentic workflows, they care about:
* are the systems involved compliant with various frameworks 
* what are the boundaries between internal and external systems 
* how is data transferred and across what geographies / jurisdictions 
* how are privacy and security handled in the involved systems 
* data retention and destruction (log storage) 

For the scope of this working group, we are not focused on agentic workflow developers as a persona.

## Requirements

In order to best serve these target personas, standards which capture audit logs for agentic interactions should be capable of the following:

* Capture core attributes for agentic interactions 
  * Capture agentic context 
    * Agent classification (instance of agent -> type of agent) 
    * Agentic frameworks and technologies used (LLMs, connective frameworks, etc.) 
    * Agentic user input (prompts, documents, files) 
    * Agentic application context (version, host, device, etc.) 
  * Capture resource context 
    * MCP servers and tools used 
    * A2A agent/skills used 
    * Shell commands used 
    * Computer use commands 
    * Etc. 
  * Capture identity & authorization context 
    * Credentials used to access resources (and type:   SAML, * OAuth, API keys) 
    * Mechanism:  
      * Identities acting on behalf of 
      * Delegation chains
      * "token exchange" of various forms
      * Impersonation
    * Policy decisions 
    * Agentic identifiers (verifiable credentials, e.g.) 
  * Capture non-functional characteristics of interactions 
    * Duration 
    * Errors 
  * Flexibility to capture additional key/value attributes 
* Traceability ... can connect multiple events within: 
  * a user session using an agent 
  * the lifecycle of an agent 
  * the same authorization session to one or more resources 
  * a single request transversing a web of interconnected systems (e.g. distributed tracing)
* Privacy & Security 
  * Privacy preserving (when needed) 
  * Does not log sensitive information (no credential leakage, e.g.) 
  * Compliance status (e.g. list the compliance status of X system in a multi-agent system) 