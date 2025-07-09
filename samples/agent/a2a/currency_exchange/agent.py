# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""A2A agent."""

import logging
from collections.abc import AsyncIterable
from typing import Any, Dict, Literal

from langchain_core.messages import AIMessage, ToolMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_ollama import ChatOllama
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

memory = MemorySaver()


# pylint: disable=too-few-public-methods
class ResponseFormat(BaseModel):
    """Respond to the user in this format."""

    status: Literal["input_required", "completed", "error"] = "input_required"
    message: str


class CurrencyAgent:
    """A2A agent for currency conversion."""

    # pylint: disable=line-too-long
    SYSTEM_INSTRUCTION = (
        "You are a specialized assistant for currency conversions. "
        "Your sole purpose is to use the 'get_exchange_rate' tool to answer questions about currency exchange rates and 'convert_currency' tool to perform currency conversion."
        "If the user asks about anything other than currency conversion or exchange rates, "
        "politely state that you cannot help with that topic and can only assist with currency-related queries. "
        "Do not attempt to answer unrelated questions or use tools for other purposes."
    )

    FORMAT_INSTRUCTION = (
        "Set response status to input_required if the user needs to provide more information to complete the request."
        "Set response status to error if there is an error while processing the request."
        "Set response status to completed if the request is complete."
    )

    def __init__(
        self,
        ollama_base_url,
        ollama_model,
        currency_exchange_mcp_server_url,
    ) -> None:
        """Initialize the agent with the Ollama model and tools."""
        self.ollama_base_url = ollama_base_url
        self.ollama_model = ollama_model
        self.currency_exchange_mcp_server_url = currency_exchange_mcp_server_url

        self.model = None
        self.tools = None
        self.graph = None

    async def init_model_and_tools(self):
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

        self.graph = create_react_agent(
            self.model,
            tools=tools,
            checkpointer=memory,
            prompt=self.SYSTEM_INSTRUCTION,
            response_format=(self.FORMAT_INSTRUCTION, ResponseFormat),
        )

    async def invoke(self, query, session_id) -> AsyncIterable[Dict[str, Any]]:
        """Invoke the agent with a query and session ID."""
        config = {"configurable": {"thread_id": session_id}}
        if not self.graph:
            raise ValueError("Agent not initialized. Call init_model_and_tools first.")

        await self.graph.ainvoke({"messages": [("user", query)]}, config)

        return self.get_agent_response(config)

    async def stream(self, query, session_id) -> AsyncIterable[Dict[str, Any]]:
        """Stream the agent's response to a query."""
        inputs = {"messages": [("user", query)]}
        config = {"configurable": {"thread_id": session_id}}
        if not self.graph:
            raise ValueError("Agent not initialized. Call init_model_and_tools first.")

        async for item in self.graph.astream(inputs, config, stream_mode="values"):
            message = item["messages"][-1]
            if (
                isinstance(message, AIMessage)
                and message.tool_calls
                and len(message.tool_calls) > 0
            ):
                yield {
                    "is_task_complete": False,
                    "require_user_input": False,
                    "content": message.content,
                }
            elif isinstance(message, ToolMessage):
                yield {
                    "is_task_complete": False,
                    "require_user_input": False,
                    "content": message.content,
                }

        yield self.get_agent_response(config)

    def get_agent_response(self, config):
        """Get the agent's response based on the current state."""
        current_state = self.graph.get_state(config)
        structured_response = current_state.values.get("structured_response")
        if structured_response and isinstance(structured_response, ResponseFormat):
            logger.info("Structured response: %s", structured_response)

            if structured_response.status == "input_required":
                return {
                    "is_task_complete": False,
                    "require_user_input": True,
                    "content": structured_response.message,
                }
            if structured_response.status == "error":
                return {
                    "is_task_complete": False,
                    "require_user_input": True,
                    "content": structured_response.message,
                }
            if structured_response.status == "completed":
                return {
                    "is_task_complete": True,
                    "require_user_input": False,
                    "content": structured_response.message,
                }

        return {
            "is_task_complete": False,
            "require_user_input": True,
            "content": "We are unable to process your request at the moment. Please try again.",
        }

    SUPPORTED_CONTENT_TYPES = ["text", "text/plain"]
