---
sidebar_position: 6
---

# API Access

Welcome to the API Access documentation for Agent Identity. This section provides detailed information on how to interact with the Agent Identity API, including authentication, endpoints, and usage examples.

## Organization API Key

The Organization API Key is used to authenticate requests made to the Agent Identity API. This key is essential for accessing protected resources and performing actions on behalf of your organization.

You can obtain your Organization API Key from the Agent Identity settings page. Ensure that you keep this key secure and do not expose it in public repositories or client-side code.

![Organization API Key](/img/tenant-api-key.png)

## Agentic Service API Key

The Agentic Service API Key is used to authenticate requests made by your application to the Agent Identity API. This key is specific to your application and should be included in the headers of your API requests or in the Python SDK configuration.

You can generate an Agentic Service API Key from the Agent Identity settings page. Similar to the Organization API Key, ensure that this key is kept secure and not exposed in public repositories or client-side code.

![Agentic Service API Key](/img/app-api-key.png)

## Protodocs

The Protodocs definition can be accessed [here](/protodocs/agntcy/identity/platform/v1alpha1/app.proto).

## OpenAPI Client

The OpenAPI Client provides a way to interact with the Agent Identity API using standard HTTP requests. You can use any HTTP client library to make requests to the API endpoints defined in the OpenAPI specification.

The OpenAPI specification for the Agent Identity API can be found [here](/openapi/platform/v1alpha1).

## Python SDK

To install the Python SDK for Agent Identity, you can use pip:

```bash
pip install git+https://github.com/cisco-eti/pyramid-platform@main#subdirectory=sdk/python
```

The Python SDK provides a cli tool for interacting with the Agent Identity API. You can use it to perform various actions such as verifying and managing identities.
