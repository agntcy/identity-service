---
sidebar_position: 6
---

# SDK

## Python SDK

Agent Identity offers a [Python SDK](https://github.com/cisco-eti/identity-platform/tree/main/sdk/python).

The Python SDK package allows developers to use it as:

- A CLI to interact with local Agentic Services (issue a badge). See the [Agentic Service Creation](/docs/agentic-service#b-service-not-accessible-from-the-internet-including-localhost-and-development-deployments) for example usage when the Agentic Service is not accessible from the internet.
- A SDK to integrate `TBAC` for Agentic Services in your Python applications.

:::tip[Endpoints]

To see more details about the development integration, you can refer to the [Dev section](/docs/dev) section of the documentation.

:::

### Local Installation

To install the Python SDK for Agent Identity, you can use pip:

```bash
pip install git+https://github.com/cisco-outshift-ai-agents/identity-service-sdk@main#subdirectory=python
```

### Example Usage

#### Verifying a Badge

Here is a basic example of how to use the Python SDK to verify a badge for an Agentic Service:

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

#### Issuing a Badge

Here is a basic example of how to use the Python SDK to issue a badge for an Agentic Service:

```python
from dotenv import load_dotenv
from identityplatform.sdk import IdentityPlatformSdk as Sdk

load_dotenv()

identity_sdk = Sdk(
    api_key="{YOUR_AGENTIC_SERVICE_API_KEY}",
)

try:
    identity_sdk.issue_badge("{AGENTIC_SERVICE_URL}")

    print("Badge issued successfully!")
except Exception as e:
    print("Error issuing badge: ", e)
```
