# Identity platform Samples

These samples are designed to help you understand how to use the Identity Platform effectively.
The samples are composed of a `Currency Exchange A2A Agent` leveraging a `Currency Exchange MCP Server` and an `OASF Agent Definition`.

> [!NOTE]
> These samples are based on the following [A2A Agent Example](https://github.com/google-a2a/a2a-samples/tree/main/samples/python/agents/langgraph).
> The `OASF Agent Definitions` can be found in the [Agent Directory](https://hub.agntcy.org/explore).

## Prerequisites

To run the samples, you need to have the following prerequisites installed:

- [Docker](https://docs.docker.com/engine/install/)
- [Ollama](https://ollama.com/download)
- [Python 3.12 or later](https://www.python.org/downloads/)

## Quick Start

To quickly get started with the samples, follow these steps:

### Running Ollama

The agents in the samples rely on a local instance of the [Llama 3.2 LLM](https://ollama.com/library/llama3.2) to power the agent's capabilities.
With Ollama installed, you can load and run the model using the following command:

```bash
# Note: This will download the Llama 3.2 model if it is not already available locally.
# The quantized Llama 3.2 model is approximately 2GB in size, so ensure you have enough disk space.
ollama run llama3.2
```

### Running the Samples

With Ollama and the Llama 3.2 model running, you can now run the samples.

1. Clone the `identity` repository:

   ```bash
   git clone https://github.com/agntcy/identity.git
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
