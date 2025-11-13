# Logging

Logging in the Agent Identity Service is done using [logrus](https://github.com/sirupsen/logrus).
Logs are forwarded to `stdout` or `stderr` depending on their log level. Logs are structured, they can have key-value pairs which makes querying and processing logs easier and reliable.

## Usage

Import the [`pkg/log`](https://github.com/agntcy/identity-service/blob/main/backend/pkg/log/log.go) package to use one of the following functions to write logs:

```go
func Debug(args ...any)
func Info(args ...any)
func Warn(args ...any)
func Error(args ...any)
```

For example:

```go
log.Info("Sharing some information")

log.Error("Oh no! ", err)
```

It is encouraged to exploit structured logging as much as possible, to add fields into the log simply use the `WithFields` function found in the same pacakge:

```go
log.WithFields(logrus.Fields{
  "key1": "value",
  "key2": 123,
}).Info("Howdy, folks!")

log.WithFields(logrus.Fields{"err": err}).Error("Oh no!")
```

Adding an error as a field can be done using the `WithError` function instead:

```go
log.WithError(err).Error("Oh no!")
```

## Contextual logging

For better and rich logs, it is highly recommanded to use a contextual logger which enriches the log with additional key-value pairs attached to `context.Context` (e.g, `tenantID`, `appID`, `requestID`, http & gRPC requests).

For example:

```go
log.FromContext(ctx).Info("This log logs the context as well!")
```

## Log levels

What log level to use?

- **`log.Debug`:** Useful for times where verbosity is needed and for logs of high frequency, such as the ones used for debugging.
- **`log.Info`:** Useful for giving a steady state information about the service and important log messages.
- **`log.Warn`:** Logs that indicate a potential issue or a weird state but doesn't prevent the system from functioning. If used, it may require attention.
- **`log.Error`:** Error logs indicating unexpected behaviours occured somewhere in the code, most of these errors are not handled.

## Error logging

In case an unexpected error happened and the execution flow needs to be stopped, **do not** log the error, there is a global gRPC interceptor [`ErrorInterceptor`](https://github.com/agntcy/identity-service/blob/main/backend/internal/bff/grpc/interceptors/error.go) that catches these errors and logs them.
This prevents errors from being logged more than once, which facilitates tracing.

## Formats

The Agent Identity Service supports two logging formats based on the runtime environment: **Text logging format** and **JSON logging format**.

### Text logging format

> **Enabled for development environment (`GO_ENV=development`)**

Each log is written in text format, can take multiple lines, and human-readable.

Example:

```text
INFO[2025-10-06T11:01:49+02:00] Starting in env:development
```

```text
DEBUG[2025-10-06T10:45:13+02:00] Creating badge with claims full_method=/agntcy.identity.service.v1alpha1.BadgeService/IssueBadge organization_id=6064781c-9522-401f-8edc-22ccba81a623 request=map[...] request_id=9c216d4f-f0f7-4648-9367-957dc332ed7e tenant_id=0d29df10-801e-4296-a521-8a6e5bcb10e5
```

### JSON logging format

> **Enabled for non development environment, such as production (`GO_ENV=production`)**

Each log is written in a JSON format, which is more effecient for parsing and to be fed to observability platforms such as Grafana.

Example:

```json
{"level":"info","msg":"Starting in env:production","time":"2025-10-06T10:54:13+02:00"}
```

```json
{"full_method":"/agntcy.identity.service.v1alpha1.BadgeService/IssueBadge","level":"debug","msg":"Creating badge with claims: ...}","organization_id":"6064781c-9522-401f-8edc-22ccba81a623","request":{},"request_id":"2b35e522-47cc-4d8f-a50f-03b07f7070e8","tenant_id":"0d29df10-801e-4296-a521-8a6e5bcb10e5","time":"2025-10-06T10:58:00+02:00"}

```
