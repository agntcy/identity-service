## Guidelines
 * Need to have working code as a guiding principle
 * Deployment options - Internet edge - anywhere(any cloud)
## Discussion
   Integration with existing systems for Enforcement(data-plane) and control-plane 
   - Control-plane and Data plane integration - Proxy based architectures for authorisation
   - Candiate Service meshes usage - Istio, Envoy, solo
   - Building a distributed control-plane, policy look-up on miss from central policy repo
  * Data path/Enforcement - APIs, sidecars, wasm plug-ins.
  * Review Different Policy frameworks and integrations eg OPA, OpenFGA , Topaz and languages like OPAL,  Cedar etc
  * Evaluate different models TBAC, ReBAC, ABAC ? What policy model do we want to use?


## Decisions
* Meeting the ecosystem where it's at: Not every resource provider supports OAuth - eg exchanging token for API key or token for token 
* Manish Singh would help frame the structure of what problems we need to tackle
* come up with next steps on Architecture, platform, components, proposal

## Participants
* Shankar Garikapaty
* Alan Pinkert
* Manish Singh
