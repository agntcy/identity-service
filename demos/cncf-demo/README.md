# CNCF Demo

> **Placeholder** — content coming soon.

This directory will host the CNCF conference demo stack for AGNTCY Identity Service.

## Planned contents

- `docker-compose.yaml` — supporting services (Keycloak, Gitea).
- Envoy + `boe extensions for OPA and token-exchange` configuration for task-based authorization.
  TODOs
   1. docker compose create Envoy+ production grade boe extensions(builtonenvoy.io) -
       Ref: https://builtonenvoy.io/docs/packaging-prod/
   3. Download and run boe-extension for OPA - https://builtonenvoy.io/extensions/opa/
   4. Download and run boe extension for token-exchange - https://builtonenvoy.io/extensions/token-exchange/
      Note: Multiple modules can be loaded https://builtonenvoy.io/docs/packaging-prod/#dynamic-modules-and-go
   6. Add OPA configuration via files
   7. Dry-run evaluation of OPA policies 
   8. Migrate to inline policy configuration for OPA
      
- Demo walkthrough and run instructions.

## Related issues

- Create a docker-compose file: [#227](https://github.com/agntcy/identity-service/issues/227)
- Set up Envoy and boe framework: [#228](https://github.com/agntcy/identity-service/issues/228)
- Move `agenticidentity-cncf` into this directory: [#229](https://github.com/agntcy/identity-service/issues/229)
