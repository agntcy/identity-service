# Identity Context

One of the best features of Go is the `Context` type, it provides a mechanism to control the lifecycle, cancellation, and propagation of request-scoped metadata across the different components of an application.

In the Agent Identity Service, the `Context` is used to carry user and tenant information related to each gRPC request, such as `TenantID`, `AppID` and `UserID`. The [`internal/pkg/context`](https://github.com/agntcy/identity-service/tree/main/backend/internal/pkg/context) package provides functions to set and get this information from the context.

The context is propagated to the application and domain services, as well as to the repositories and any other components that rely on user and tenant metadata. For example, repositories use the tenant ID from the context to filter data using the custom GORM scope [`BelongsToTenant`](https://github.com/agntcy/identity-service/blob/main/backend/internal/pkg/gormutil/scopes.go), while HTTP clients can use the context to cancel requests if the user closes the connection to the server.

The population of the `Context` with user and tenant metadata is managed by the [`AuthInterceptor`](https://github.com/agntcy/identity-service/blob/main/backend/internal/pkg/interceptors/auth.go) gRPC interceptor.
