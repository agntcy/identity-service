# API Spec

Schema of the external API types that are served by the Identity Service components.
You can find the latest generated `API Spec` in the [Identity Service API Specs](https://identity-docs.outshift.com/) documentation.

## Prerequisites

To generate the API specs, you need to have the following installed:

- [Golang](https://go.dev/doc/install) 1.24 or later
- [Buf CLI](https://buf.build/docs/installation) 1.50 or later

## Development

To generate the API specs, first make sure that Docker is running locally and then run the following command from the root of the repository:

```bash
make generate_proto
```

This will generate the `Protobuf` definitions, the `OpenAPI` specs and the `gRPC` stubs for the `Node` backend and the `Issuer` client.

> [!NOTE]
> The `Go` code will be generated in the `backend/api` directory.
> The `Proto` definitions are generated in the `/backend/api/spec/proto` directory.
> The `Proto Messages and Enums` are generated from the `Go` types from the `core` package.
> The `Protobuf Services` are generated from the `backend/api/spec/proto` directory.
> The Proto Documentation, the OpenAPI Client and the JSON Schema will be generated in the `backend/api/spec/static` directory.
