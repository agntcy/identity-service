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

1. Clone the `identity-service` repository:

   ```bash
   git clone https://github.com/cisco-eti/identity-service.git
   ```

2. Navigate to the `samples` directory and run the following command to start the Docker containers:

   ```bash
   # From the root of the repository navigate to the samples directory
   cd samples

   # Start the Docker containers
   docker compose up -d
   ```

### Testing the Samples

Once the Docker containers are up and running, you can test the samples by running the provided test clients.

#### Financial Assistant OASF Agent Definition

To test the A2A Agent sample, navigate to the `samples/agent/oasf/financial_assistant` directory and run the following command:

```bash
# From the root of the repository navigate to the A2A Agent sample directory
cd samples/agent/oasf/financial_assistant

# Install the required dependencies
pip install .

# Run the test client
python test_client.py
```

#### A2A Agent

To test the A2A Agent sample, navigate to the `samples/agent/a2a/currency_exchange` directory and run the following command:

```bash
# From the root of the repository navigate to the A2A Agent sample directory
cd samples/agent/a2a/currency_exchange

# Install the required dependencies
pip install .

# Run the test client
python test_client.py
```

#### MCP Server

To test the MCP Server sample, navigate to the `samples/mcp/currency_exchange` directory and run the following command:

```bash
# From the root of the repository navigate to the MCP Server sample directory
cd samples/mcp/currency_exchange

# Install the required dependencies
pip install .

# Run the test client
python test_client.py
```
