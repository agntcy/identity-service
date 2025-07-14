---
sidebar_position: 8
---

# Development Guide

This guide provides an overview of the development process for integrating with the Agent Identity platform, including issuing and verifying badges, and integrating the TBAC (Task-Based Access Control) system in your applications.

Before you begin, ensure you have the necessary tools and access to the Agent Identity platform:

- **Access to Agent Identity**: You must have an administrator role or sufficient permissions within the Agent Identity application.
- **Development Environment**: Set up your development environment with the necessary tools, such as Python or any other programming language of your choice.
- **API Keys**: Know how to obtain your Organization API Key and Agentic Service API Keys from the Agent Identity settings page. For more details, refer to the [API Access documentation](/docs/api).
- **Python SDK**: Install the [Python SDK documentation](/docs/sdk#python-sdk) to interact with the Agent Identity API and perform operations like issuing badges.
- **Documentation**: Familiarize yourself with the [API documentation](/docs/api) and the [Python SDK documentation](/docs/sdk#python-sdk).

:::tip[Endpoints]

Most of the development examples are provided in Python, but you can also use other programming languages to interact with the Agent Identity API. The endpoints are accessible via REST and gRPC protocols.
To see more details about the API access, you can refer to the [API](/docs/api) section of the documentation.

:::

## Issuing and Verifying Badges

### Issuing a Badge

To issue a badge for your Agentic Service, you can use the Python CLI or make direct API calls. The badge is essential for the discovery of your service and allows it to be recognized within the Agent Identity platform.

Below is an example of how to issue a badge using the Python CLI:

```bash
identity-cli badge create {URL}
```

_Replace `{URL}` with the local or internal URL of your Agentic Service._

- You will then be prompted to provide the **Agentic Service API Key** that was generated during the "Create Agentic Service" step. Enter the API Key when requested.

### Verifying a Badge

To verify badges issued by Agentic Services, you can use the Python SDK or make direct API calls. The verification process ensures that the badge is valid and can be trusted for access control.

Below is an example of how to verify a badge using the Python SDK:

```python
from dotenv import load_dotenv
from identityplatform.sdk import IdentityPlatformSdk as Sdk

load_dotenv()

identity_sdk = Sdk(
    api_key="{YOUR_ORGANIZATION_API_KEY}"
)

try:
    print(
        "Got badge: ",
        identity_sdk.verify_badge(
           {JOSE_ENVELOPED_BADGE}
        ),
    )
except Exception as e:
    print("Error verifying badge: ", e)
```

_Replace `{YOUR_ORGANIZATION_API_KEY}` with your actual [Organization API Key](/docs/api#organization-api-key) and `{JOSE_ENVELOPED_BADGE}` with the JOSE enveloped badge you want to verify._

Here is the same operation using the REST API:

```curl
curl https://{REST_API_ENDPOINT}/badges/verify \
  --request POST \
  --header 'Content-Type: application/json' \
  --header 'X-Id-Api-Key: {YOUR_ORGANIZATION_API_KEY}' \
  --data '{
  "badge": "{JOSE_ENVELOPED_BADGE}"
}'
```

## Task-Based Access Control (TBAC)

The Agent Identity platform uses Task-Based Access Control (TBAC) to manage access between the agentic services. TBAC allows you to define the tasks that can be performed by each service and the permissions required to perform those tasks.

In order to use TBAC effectively, you need to follow the following steps:

1. **Create the Agentic Services and issue badges for them.**

- Before you can define TBAC policies, you need to create your Agentic Services and issue badges for them. This process involves registering your services and ensuring they are discoverable within the Agent Identity platform (including localhost CLI). For detailed instructions on creating Agentic Services, refer to the [Agentic Services Documentation](/docs/agentic-service).

:::tip[NOTE]

The tasks available for TBAC are automatically discovered from the Agentic Services when you issue the badge.
:::

2. **Define the TBAC policies and rules for your Agentic Services.**

- To integrate TBAC in your application, you can use the UI to define policies and rules for your Agentic Services. Please follow the detailed instructions in the [Policies and Rules Documentation](/docs/policies) to set up and manage access control for your services.

3. **Integrate TBAC in your application** following one of the methods below.

### **Using the Python SDK**

:::warning[IMPORTANT]
When using the Python SDK for TBAC, you need to provide in your environment the following variables:

- `IDENTITY_PLATFORM_API_KEY`: Your Agentic Service API Key. You can obtain this key from the Agent Services details page.

:::

#### **Using the easy plug-in integrations**

For easy plug-in integrations, you can use the following extensions and plugins:

##### **HTTPX Auth Class**

For HTTPX-based applications, you can use the `IdentityPlatformAuth` class to integrate TBAC. This class provides an easy way to authorize Agentic Services and manage access tokens.

```python
from identityplatform.auth.httpx import IdentityPlatformAuth

timeout = httpx.Timeout(connect=None, read=None, write=None, pool=None)
auth = IdentityPlatformAuth() # Instantiate the auth class
async with httpx.AsyncClient(
timeout=timeout, auth=auth
) as httpx_client:

# Do your HTTPX requests here
```

You can see this class fully implemented in our [Financial Agentic Service](https://github.com/cisco-eti/pyramid-platform/blob/main/samples/agent/oasf/financial_assistant/currency_exchange_agent.py#L112).

##### **A2A Starlette auth middleware**

For A2A (Agent-to-Agent) based applications using Starlette, you can use the `IdentityPlatformA2AAuthMiddleware` to integrate TBAC. This middleware automatically handles authorization for incoming requests:

- **Define a security scheme in your A2A Card**

```python
# Define auth scheme
AUTH_SCHEME = "IdentityPlatformAuthScheme"
auth_scheme = HTTPAuthSecurityScheme(
  scheme="bearer",
  bearerFormat="JWT",
)

try:
  # Define the Agent Card with the security scheme
  agent_card = AgentCard(
      ...
      securitySchemes={AUTH_SCHEME: SecurityScheme(root=auth_scheme)},
      security=[
          {
              AUTH_SCHEME: ["*"],
          }
      ],
  )
```

- **Add the middleware to your A2A Starlette application**

```python
from identityplatform.auth.starlette import IdentityPlatformA2AMiddleware

# Start server
app = server.build()

# Add IdentityPlatformMiddleware for authentication
app.add_middleware(
    IdentityPlatformA2AMiddleware, # Define the middleware
    agent_card=agent_card,
    public_paths=["/.well-known/agent.json"],
)

# Run the application
uvicorn.run(app, host=host, port=port)
```

You can see this class fully implemented in our [Currency Exchange Agentic Service](https://github.com/cisco-eti/pyramid-platform/blob/main/samples/agent/a2a/currency_exchange/main.py#L91).

##### **Standard Starlette/FastAPI auth middleware**

We also support standard Starlette or FastAPI applications, you can use the `IdentityPlatformAuthMiddleware` to integrate TBAC. This middleware automatically handles authorization for incoming requests.

```python
from starlette.applications import Starlette
from starlette.middleware import Middleware

from identityplatform.auth.starlette import IdentityPlatformAuthMiddleware

routes = ...

middleware = [
  IdentityPlatformAuthMiddleware(public_paths=[])
]

app = Starlette(routes=routes, middleware=middleware)
```

#### **Using a custom implementation**

The Python SDK provides two functions to integrate TBAC in your application:

- `access_token`: This function authorizes an Agentic Service and returns an access token that can be used to perform tasks defined in the TBAC policies. Optionally, you can specify the Agentic Service ID, tool name, and user token to customize the authorization process for Zero Trust environments.

```python
access_token(
    self,
    agentic_service_id: str | None = None,
    tool_name: str | None = None,
    user_token: str | None = None,
) -> str | None
```

- `authorize`: This function authorizes an Agentic Service with an access token. It requires the access token and optionally the tool name.

```python
authorize(self, access_token: str, tool_name: str | None = None)
```

You can use these functions to integrate TBAC in your application and manage access control for your Agentic Services.

### **Using the REST APIs**

:::warning[IMPORTANT]
When using the REST APIs for TBAC, you need to replace the following variables in the code snippets:

- `REST_API_ENDPOINT`: The endpoint of the Agent Identity REST API. This can be obtained from the [API Access documentation](/docs/api).
- `YOUR_AGENTIC_SERVICE_API_KEY`: Your Agentic Service API Key. You can obtain this key from the Agent Services details page.

:::

The REST API provides endpoints to integrate TBAC in your application. You can follow these steps to authorize and verify Agentic Services:

1. **Authorize an Agentic Service**

Below are the different endpoints you can use to authorize an Agentic Service:

- **Perform an authoriation request**

```curl
curl https://{REST_API_ENDPOINT}/auth/authorize \
  --request POST \
  --header 'Content-Type: application/json' \
  --header 'X-Id-Api-Key: {YOUR_AGENTIC_SERVICE_API_KEY}' \
  --data '{
  "appId": "",
  "toolName": "",
  "userToken": ""
}'
```

Optionally, you can specify the `appId`, `toolName`, and `userToken` to customize the authorization process for Zero Trust environments.

- **Exchange the authorization code for an access token**

```curl
curl https://{REST_API_ENDPOINT}/auth/token \
  --request POST \
  --header 'Content-Type: application/json' \
  --header 'X-Id-Api-Key: {YOUR_AGENTIC_SERVICE_API_KEY}' \
  --data '{
  "authorizationCode": "{AUTHORIZATION_CODE}",
}'
```

where `{AUTHORIZATION_CODE}` is the code received from the authorization request.

2 **Verify an Agentic Service**

To verify an Agentic Service, you can use the following external authorization endpoint:

```curl
curl https://{REST_API_ENDPOINT}/auth/ext_authz \
  --request POST \
  --header 'Content-Type: application/json' \
  --header 'X-Id-Api-Key: {YOUR_AGENTIC_SERVICE_API_KEY}' \
  --data '{
  "accessToken": "{ACCESS_TOKEN}",
  "toolName": ""
}'
```

where `{ACCESS_TOKEN}` is the access token received from the authorization request, and `toolName` is optionally the name of the tool you want to verify.
