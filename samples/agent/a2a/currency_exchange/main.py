# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Main entry point for the Currency Agent server."""

import logging
import os
import sys

import click
import uvicorn
from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import (AgentCapabilities, AgentCard, AgentSkill,
                       HTTPAuthSecurityScheme, SecurityScheme)
from dotenv import load_dotenv
from identityservice.auth.starlette import IdentityServiceA2AMiddleware

from agent import CurrencyAgent
from agent_executor import CurrencyAgentExecutor

load_dotenv()

logging.basicConfig(level=os.getenv("LOG_LEVEL", "DEBUG").upper())
logger = logging.getLogger(__name__)


@click.command()
@click.option("--host", "host", default="0.0.0.0")
@click.option("--port", "port", default=9091)
@click.option(
    "--azure-openai-endpoint", default=os.getenv("AZURE_OPENAI_ENDPOINT", "")
)
@click.option("--azure-openai-api-key", default=os.getenv("AZURE_OPENAI_API_KEY", ""))
@click.option(
    "--currency_exchange_mcp_server_url",
    default=os.getenv("CURRENCY_EXCHANGE_MCP_SERVER_URL", "http://localhost:9090/mcp"),
)
@click.option(
    "--agent-url", 
    default=os.getenv("AGENT_URL", ""),
)

def main(host, port, azure_openai_endpoint, azure_openai_api_key, currency_exchange_mcp_server_url, agent_url):
    """Starts the Currency Agent server."""

    # Define auth scheme
    AUTH_SCHEME = "IdentityServiceAuthScheme"
    auth_scheme = HTTPAuthSecurityScheme(
        scheme="bearer",
        bearerFormat="JWT",
    )

    # pylint: disable=broad-exception-caught
    try:
        capabilities = AgentCapabilities(streaming=True, pushNotifications=True)
        skill = AgentSkill(
            id="convert_currency",
            name="Currency Exchange Rates Tool",
            description="Helps with exchange values between various currencies",
            tags=["currency conversion", "currency exchange"],
            examples=["What is exchange rate between USD and GBP?"],
        )
        public_url = agent_url if agent_url else f"http://{host}:{port}/"
        agent_card = AgentCard(
            name="Currency Agent",
            description="Helps with exchange rates for currencies",
            url=public_url,
            version="1.0.0",
            defaultInputModes=CurrencyAgent.SUPPORTED_CONTENT_TYPES,
            defaultOutputModes=CurrencyAgent.SUPPORTED_CONTENT_TYPES,
            capabilities=capabilities,
            skills=[skill],
            securitySchemes={AUTH_SCHEME: SecurityScheme(root=auth_scheme)},
            security=[
                {
                    AUTH_SCHEME: ["*"],
                }
            ],
        )

        # Initialize the HTTP client and request handler
        request_handler = DefaultRequestHandler(
            agent_executor=CurrencyAgentExecutor(
                azure_openai_endpoint, azure_openai_api_key, currency_exchange_mcp_server_url
            ),
            task_store=InMemoryTaskStore(),
        )
        server = A2AStarletteApplication(
            agent_card=agent_card, http_handler=request_handler
        )

        # Start server
        app = server.build()

        # Add IdentityServiceMiddleware for authentication
        app.add_middleware(
            IdentityServiceA2AMiddleware,
            agent_card=agent_card,
            public_paths=["/.well-known/agent.json"],
        )

        uvicorn.run(app, host=host, port=port)
    except Exception as e:
        logger.error("An error occurred during server startup: %e", e)
        sys.exit(1)


if __name__ == "__main__":
    # pylint: disable=no-value-for-parameter
    main()
