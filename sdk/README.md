# Python SDK

The `Python SDK` provides:

- A CLI to interact with local Agentic Services.
- A SDK to integrate with Agentic Services in your Python applications.

## Prerequisites

To use the `Python SDK`, you need to have the following installed:

- [Python](https://www.python.org/downloads/) 3.8 or later

## Installation

To install the `Python SDK`, you can use `pip`:

```bash
pip install .
```

## Example Usage

Here is a basic example of how to use the Python SDK to verify a badge for an Agentic Service:

```python
from dotenv import load_dotenv
from identityservice.sdk import IdentityServiceSdk as Sdk

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

You must set the following environment variables:

- `IDENTITY_SERVICE_GRPC_SERVER_URL`: The URL of the Identity Service gRPC server.
- `YOUR_ORGANIZATION_API_KEY`: Your organization API key.

> [!NOTE]
> If the node is running locally, you must add the following environment variable:
>
> - `IDENTITY_SERVICE_USE_SSL`: 0, to disable SSL verification.

For more examples, see our online [Python SDK Documentation](https://identity-docs.outshift.com/docs/sdk).
