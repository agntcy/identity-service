# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Main entry point for the Financial Assistant Agent server."""

import uuid
from typing import Literal

from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_ollama import ChatOllama
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent
from pydantic import BaseModel

memory = MemorySaver()


# pylint: disable=too-few-public-methods
class ResponseFormat(BaseModel):
    """Respond to the user in this format."""

    status: Literal["input_required", "completed", "error"] = "input_required"
    message: str


class FinancialAssistantAgent:
    """Financial Assistant Agent for currency conversion."""

    # pylint: disable=line-too-long
    SYSTEM_INSTRUCTION = (
        "You are a specialized assistant for assisting the user with currency exchanges. "
        "You can answer about rates but you cannot execute exchanges. "
        "For all currency exchange trades use the currency_exchange agent and do not, "
        "execute currency exchanges by your own. "
        "If the user asks about anything other than financial information, "
        "politely state that you cannot help with that topic and can only assist with financial-related queries. "
        "Do not attempt to answer unrelated questions or use tools for other purposes."
        "Set response status to input_required if the user needs to provide more information."
        "Set response status to error if there is an error while processing the request."
        "Set response status to completed if the request is complete."
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

        config = {"configurable": {"thread_id": uuid.uuid4()}}
        if not self.graph:
            raise ValueError("Agent not initialized. Call init_model_and_tools first.")

        response = await self.graph.ainvoke({"messages": [("user", prompt)]}, config)

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

        # Create the agent graph with the tools
        self.graph = create_react_agent(
            model=self.model,
            # tools=[
            #     CurrencyExchangeAgent(
            #         self.currency_exchange_agent_url
            #     ).get_invoke_tool()
            # ],
            tools=tools,
            prompt=self.SYSTEM_INSTRUCTION,
            response_format=ResponseFormat,
        )
