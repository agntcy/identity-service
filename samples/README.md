# Agent Identity Service Samples

These samples are designed to help you understand how to use the **Agent Identity Service** effectively.
The samples are composed of a `Currency Exchange A2A Agent` leveraging a `Currency Exchange MCP Server` and an `Financial Assistant OASF Agent Definition`.

> [!NOTE]
> These samples are based on the following [A2A Agent Example](https://github.com/google-a2a/a2a-samples/tree/main/samples/python/agents/langgraph).
> The `Financial Assistant OASF Agent Definitions` can be found in the [Agent Directory](https://hub.agntcy.org/explore).

## Connectivity Diagram

The two agents and the MCP server are connected as shown in the diagram below:

![Connectivity Diagram](img/samples.svg)

## Prerequisites

To run the samples, you need to have the following prerequisites installed:

- [Docker](https://docs.docker.com/engine/install/)
- Azure OpenAI credentials
- [Python 3.12 or later](https://www.python.org/downloads/)

## Quick Start

To quickly get started with the samples, follow these steps:

### Running the Samples

You need AzureOpenAI credentials to run the samples.

1. Clone the `identity-service-samples` repository:

   ```bash
   git clone https://github.com/cisco-outshift-ai-agents/identity-service-samples.git
   ```

2. Navigate to the `samples` directory and run the following command to start the Docker containers:

   ```bash
   # Start the Docker containers
   docker compose up -d
   ```

### Testing the Samples

Once the Docker containers are up and running, you can test the samples by running the provided test clients.

#### Financial Assistant OASF Agent Definition

To test the A2A Agent sample, navigate to the `samples/agent/oasf/financial_assistant` directory and run the following command:

```bash
# From the root of the repository navigate to the A2A Agent sample directory
cd agent/oasf/financial_assistant

# Install the required dependencies
pip install .

# Run the test client
python test_client.py
```

#### A2A Agent

To test the A2A Agent sample, navigate to the `agent/a2a/currency_exchange` directory and run the following command:

```bash
# From the root of the repository navigate to the A2A Agent sample directory
cd agent/a2a/currency_exchange

# Install the required dependencies
pip install .

# Run the test client
python test_client.py
```

#### MCP Server

To test the MCP Server sample, navigate to the `mcp/currency_exchange` directory and run the following command:

```bash
# From the root of the repository navigate to the MCP Server sample directory
cd mcp/currency_exchange

# Install the required dependencies
pip install .

# Run the test client
python test_client.py
```

## Roadmap

See the [open issues](https://github.com/cisco-outshift-ai-agents/identity-service-samples/issues) for a list
of proposed features (and known issues).

## Contributing

Contributions are what make the open source community such an amazing place to
learn, inspire, and create. Any contributions you make are **greatly
appreciated**. For detailed contributing guidelines, please see
[CONTRIBUTING.md](CONTRIBUTING.md).

## Copyright Notice

[Copyright Notice and License](LICENSE)

Distributed under Apache 2.0 License. See LICENSE for more information.
Copyright [AGNTCY](https://github.com/agntcy) Contributors.
