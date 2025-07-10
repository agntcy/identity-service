# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Main entry point for the Financial Assistant Agent server."""

from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_ollama import ChatOllama
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent

from currency_exchange_agent import CurrencyExchangeAgent

memory = MemorySaver()


class FinancialAssistantAgent:
    """Financial Assistant Agent for currency conversion."""

    # pylint: disable=line-too-long
    SYSTEM_INSTRUCTION = (
        "You are a supervisor financial assistant.\n"
        "You should invoke the get_exchange_rate for any currency rate information.\n"
        "Use the invoke_currency_exchange_agent tool to perform currency conversions.\n"
        "DO NOT call the trade_currency_exchange tool directly.\n"
    )

    def __init__(
        self,
        ollama_base_url,
        ollama_model,
        currency_exchange_mcp_server_url,
        currency_exchange_agent_url,
    ) -> None:
        """Initialize the agent with the Ollama model and tools."""
        self.ollama_base_url = ollama_base_url
        self.ollama_model = ollama_model
        self.currency_exchange_mcp_server_url = currency_exchange_mcp_server_url
        self.currency_exchange_agent_url = currency_exchange_agent_url

        self.model = None
        self.graph = None

    async def invoke(self, prompt: str):
        """Invoke the agent with the provided prompt."""
        if self.graph is None:
            await self.init_graph()

        if not self.graph:
            raise ValueError("Agent not initialized. Call init_model_and_tools first.")

        response = await self.graph.ainvoke({"messages": [("user", prompt)]})

        return response

    async def init_graph(self):
        """Initialize the model and tools for the agent."""
        # Set up the Ollama model
        self.model = ChatOllama(
            base_url=self.ollama_base_url, model=self.ollama_model, temperature=0.2
        )

        # Load tools from the MCP Server
        client = MultiServerMCPClient(
            {
                "currency_exchange": {
                    "url": self.currency_exchange_mcp_server_url,
                    "transport": "streamable_http",
                },
            }
        )
        tools = await client.get_tools()

        # Create the currency exchange agent
        invoke_currency_exchange_agent = CurrencyExchangeAgent(
            self.currency_exchange_agent_url
        ).get_invoke_tool()

        # Create the agent with the tools
        self.graph = create_react_agent(
            model=self.model,
            tools=[invoke_currency_exchange_agent] + tools,
            prompt=self.SYSTEM_INSTRUCTION,
        )
