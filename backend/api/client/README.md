# Agent Identity Service SDK for Go

[![OpenAPI v1alpha1](https://img.shields.io/badge/OpenAPI-v1alpha1-blue)](https://identity-docs.outshift.com/openapi/service/v1alpha1)
[![Protocol Documentation](https://img.shields.io/badge/Protocol-Documentation-blue)](https://identity-docs.outshift.com/protodocs/outshift/identity/service/v1alpha1/app.proto)

`github.com/agntcy/identity-service/backend/api/client` is the v1alpha1 Agent Identity Service SDK for the Go programming language that contains the different REST HTTP clients.

The SDK requires a minimum version of `Go 1.24`.

## Getting started

To get started working with the SDK setup your GO projects and add the SDK dependencies with `go get`. The following example demonstrates how you can use the SDK to create a new [Agentic Service](https://identity-docs.outshift.com/docs/agentic-service) ([API reference](https://identity-docs.outshift.com/openapi/service/v1alpha1#tag/appservice/post/v1alpha1/apps)).

### Project Initialization

```sh
mkdir ~/identity_service_example
cd ~/identity_service_example
go mod init identity_service_example
touch main.go
```

### Add SDK Dependency

```sh
go get github.com/agntcy/identity-service/backend/api/client
```

### Code Example

```go
package main

import (
  "log"

  httptransport "github.com/go-openapi/runtime/client"
  "github.com/go-openapi/strfmt"
  "github.com/agntcy/identity-service/backend/api/client/auth"
  appsdk "github.com/agntcy/identity-service/backend/api/client/client/app"
  apimodels "github.com/agntcy/identity-service/backend/api/client/models"
)

func main() {
  // To fetch the API Key follow the doc based on the API Key type required by the endpoint:
  //   - Organization API Key: https://identity-docs.outshift.com/docs/api#organization-api-key
  //   - Agentic Service API Key: https://identity-docs.outshift.com/docs/api#agentic-service-api-key
  apiKeyAuth := auth.APIKeyAuth("<API_KEY>")

  // Creating a new app API client
  client := appsdk.New(httptransport.New("<API_HOST>", "", []string{"http"}), strfmt.Default)

  name := "app name"
  description := "app description"
  appType := apimodels.V1alpha1AppTypeAPPTYPEAGENTOASF

  // Calling the Identity Service to create a new Agentic Service
  res, err := client.CreateApp(
    &appsdk.CreateAppParams{
      App: &apimodels.V1alpha1App{
        Name:        &name,
        Description: description,
        Type:        &appType,
      },
    },
    apiKeyAuth,
  )
  if err != nil {
    log.Fatalf("%v", err)
  }

  log.Printf("Status Code: %d", res.Code())
  log.Printf("Agentic Service: %v", res.Payload)
}
```

### Run Code

```sh
go mod tidy
go run main.go
```

## For Maintainers

To generate the SDK, first make sure that Docker is running locally and then run the following command from the root of the repository:

```sh
make generate_go_sdk
```

The generation will be based on the spec located in `backend/api/spec`.
