# Services

This document provides guidance on working with domain models, application services, and gRPC services.

## Domain packages

The Agent Identity Service is organized into multiple domains, with each domain defined as a separate package within [`internal/core`](https://github.com/agntcy/identity-service/tree/main/backend/internal/core).

### Structure

A typical domain package is structured in the following way:

```text
domain/
├── mocks/
├── postgres/
│   ├── models.go
│   └── repository.go
├── types/
│   └── types.go
├── repository.go
└── <domain_services>.go
```

### Domain models

Domain models are conceptual representations of the key entities, behaviors, and rules within a specific domain. They serve as the core components and building blocks of the Agent Identity Service.

Most domains include one or more of these models, which are defined in a `types` package within each domain.

#### Enums

Enums in the project are defined using a custom `int` type along with a set of constants.

For example:

```go
type AppType int

const (
  APP_TYPE_UNSPECIFIED AppType = iota
  APP_TYPE_AGENT_A2A
  APP_TYPE_AGENT_OASF
  APP_TYPE_MCP_SERVER
)
```

A string representation for each enum value should also be generated using the [stringer](https://pkg.go.dev/golang.org/x/tools/cmd/stringer) tool. To do this, add a `//go:generate stringer` directive at the top of the file containing the enums, and run the generation with the `go generate` command.

For example:

```go
// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

//go:generate stringer -type=AppType
//go:generate stringer -type=AppStats

package types

...
```

#### Protobuf messages

When domain models are defined in `types/types.go`, running `make generate_proto` will generate corresponding protobuf messages for these models.

The generated protobuf messages serve as input and output objects for the presentation layer.

The generation process is handled by the script [`scripts/proto/docker/run.sh`](https://github.com/agntcy/identity-service/blob/main/scripts/proto/docker/run.sh).
It utilizes Kubernetes' [`go-to-protobuf`](https://github.com/kubernetes/code-generator/tree/master/cmd/go-to-protobuf) to convert Go structs to protobuf messages
and a custom tool [`proto-enum-generator`](https://github.com/agntcy/identity-service/tree/main/scripts/proto/proto-enum-generator) to convert Go enums to protobuf enums.

## Application services

The entrypoint to the Application layer is the [application services](https://github.com/agntcy/identity-service/tree/main/backend/internal/bff). They are responsible for enforcing business rules, processing validations, and coordinating workflows involving domain models, persistence and external systems.

Application services are defined as interfaces and implemented by structs. These services do not interact or reference each other directly, with the exception of the `NotificationService`. Each service can leverage multiple domain models to accomplish its tasks.

Business logic that is shared across different application services should be encapsulated and exposed through domain models or domain services.

## gRPC services

gRPC services are defined as protobuf services in [`backend/api/spec/proto/agntcy/identity/service/v1alpha1`](https://github.com/agntcy/identity-service/tree/main/backend/api/spec/proto/agntcy/identity/service/v1alpha1).
These protobuf service definitions establish the API contract for the Agent Identity Service, supporting both gRPC and HTTP interfaces.

Running `make generate_proto` generates both the server code and the Go interfaces for these protobuf services. The implementations of these interfaces are located in [`internal/bff/grpc`](https://github.com/agntcy/identity-service/tree/main/backend/internal/bff/grpc).

### Registering gRPC services

After implementing a gRPC service, it must be registered as a handler with both the gRPC server and the HTTP server.
This is achieved by providing an instance of the concrete implementation of the gRPC interface to the `identity_service_api.GrpcServiceRegister` struct in the `initializeServices()` function within [`main.go`](https://github.com/agntcy/identity-service/blob/main/backend/cmd/bff/main.go).

For example:

```go
...
register := identity_service_api.GrpcServiceRegister{
  AppServiceServer:      bffgrpc.NewAppService(appSrv, badgeSrv),
  SettingsServiceServer: bffgrpc.NewSettingsService(settingsSrv),
  ...
  MyNewService: bffgrpc.NewMyNewService(),
}
...
```
