# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Main entry point for the Financial Assistant Agent server."""

import logging
import os
import sys

import click
import uvicorn
from dotenv import load_dotenv

from agent import FinancialAssistantAgent
from agent_executor import AgentExecutor

load_dotenv()

logging.basicConfig(level=os.getenv("LOG_LEVEL", "DEBUG").upper())
logger = logging.getLogger(__name__)


@click.command()
@click.option("--host", "host", default="0.0.0.0")
@click.option("--port", "port", default=os.getenv("PORT", 9093), type=int)
@click.option("--azure-openai-endpoint", default=os.getenv("AZURE_OPENAI_ENDPOINT", ""))
@click.option("--azure-openai-api-key", default=os.getenv("AZURE_OPENAI_API_KEY", ""))
@click.option(
    "--currency-exchange-mcp-server-url",
    default=os.getenv("CURRENCY_EXCHANGE_MCP_SERVER_URL", "http://localhost:9090/mcp"),
)
@click.option(
    "--currency-exchange-agent-url",
    default=os.getenv("CURRENCY_EXCHANGE_AGENT_URL", "http://localhost:9091"),
)
def main(
    host,
    port,
    azure_openai_endpoint,
    azure_openai_api_key,
    currency_exchange_mcp_server_url,
    currency_exchange_agent_url,
):
    """Starts the Financial Assistant Agent server."""

    # pylint: disable=broad-exception-caught
    try:
        # Initialize the agent with capabilities and skills
        agent = FinancialAssistantAgent(
            azure_openai_endpoint=azure_openai_endpoint,
            azure_openai_api_key=azure_openai_api_key,
            currency_exchange_mcp_server_url=currency_exchange_mcp_server_url,
            currency_exchange_agent_url=currency_exchange_agent_url,
        )

        # Initialize the HTTP client and request handler
        server = AgentExecutor(agent=agent)

        # Start server
        uvicorn.run(server.build(), host=host, port=port)
    except Exception as e:
        logger.error("An error occurred during server startup: %e", e)
        sys.exit(1)


if __name__ == "__main__":
    # pylint: disable=no-value-for-parameter
    main()
