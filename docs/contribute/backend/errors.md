# Errors

The Agent Identity Service deals with two types of errors:
- **Domain errors:** arise when a business rule, validation or use case is violated. These errors are represented by the custom type [`DomainError`](https://github.com/agntcy/identity-service/blob/main/backend/internal/pkg/errutil/error.go), which extends Go's `error` interface to provide additional context about the violation. The resulting error messages are also designed to be displayed on the frontend.
- **Technical errors**: occur due to issues outside the domain logic, such as database failures or system malfunctions, that affect the system's ability to function. These errors are returned as standard Go errors created using the functions from Go's [errors](https://pkg.go.dev/errors) or [fmt](https://pkg.go.dev/fmt) packages (e.g., `fmt.Errorf(...)`, `errors.New(...)`).

## Domain errors

Domain errors are returned from Application Services and Domain Services only if a business logic is violated.
The [`internal/pkg/errutil`](https://github.com/agntcy/identity-service/blob/main/backend/internal/pkg/errutil/error.go) package provides helper functions for creating `DomainError` instances based on specific reasons, for example:

- `errutil.NotFound(id, format string, args ...any)`
- `errutil.ValidationFailed(id, format string, args ...any)`
- `errutil.InvalidRequest(id, format string, args ...any)`
- `errutil.Unauthorized(id, format string, args ...any)`

The `id` provides a way to identify the error without relying on the message, and also enables custom error messages to be displayed on the frontend. Throughout the codebase, the `id` is constructed as `<domain>.<errId>`, where the `<domain>` corresponds to either the Application Service name or the directory name of the domain.

> For more information about the Application layer and its packages, see the [architecture](architecture.md) document.

In case a technical error must be returned, it should be wrapped to provide additional context and traceability:

```go
return fmt.Errorf("...: %w", ..., err)
```

> For more information about error wrapping, see https://pkg.go.dev/errors#pkg-overview

## Error handling in gRPC services

Since only two types of errors are returned from the Application layer, error handling in the gRPC services is handled as follows:

- If the error is a *domain error*, a [`status.Status`](https://pkg.go.dev/google.golang.org/grpc/status#Status) is returned with a code corresponding to the `DomainError.Reason` field.
- If the error is a *technical error*, it is forwarded as-is. Later, a custom gRPC interceptor [`ErrorInterceptor`](https://github.com/agntcy/identity-service/blob/main/backend/internal/pkg/interceptors/error.go) logs the error and returns a [`status.Status`](https://pkg.go.dev/google.golang.org/grpc/status#Status) with an `Internal` code as a response.

The helper function [`grpcutil.Error()`](https://github.com/agntcy/identity-service/blob/main/backend/internal/pkg/grpcutil/errors.go) encapsulates the error handling process described above and can be called from gRPC services, as shown in the following example:

```go
func (s *appGrpcService) CreateApp(
	ctx context.Context,
	req *identity_service_sdk_go.CreateAppRequest,
) (*identity_service_sdk_go.App, error) {
	createdApp, err := s.appSrv.CreateApp(ctx, ...)
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return converters.FromApp(createdApp), nil
}
```
