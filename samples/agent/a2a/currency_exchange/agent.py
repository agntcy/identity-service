# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""A2A agent."""

from collections.abc import AsyncIterable
from typing import Any, Dict, Literal

from langchain_core.messages import AIMessage, ToolMessage
from langchain_mcp_adapters.tools import load_mcp_tools
from langchain_ollama import ChatOllama
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client
from pydantic import BaseModel

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
        "Your sole purpose is to use the 'get_exchange_rate' tool to answer questions about currency exchange rates. "
        "If the user asks about anything other than currency conversion or exchange rates, "
        "politely state that you cannot help with that topic and can only assist with currency-related queries. "
        "Do not attempt to answer unrelated questions or use tools for other purposes."
        "Set response status to input_required if the user needs to provide more information."
        "Set response status to error if there is an error while processing the request."
        "Set response status to completed if the request is complete."
    )

    def __init__(
        self,
        ollama_base_url,
        ollama_model,
        mcp_server_url,
    ) -> None:
        """Initialize the agent with the Ollama model and tools."""
        self.ollama_base_url = ollama_base_url
        self.ollama_model = ollama_model
        self.mcp_server_url = mcp_server_url

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
        # Connect to a streamable HTTP server
        async with streamablehttp_client(self.mcp_server_url) as (
            read_stream,
            write_stream,
            _,
        ):
            # Create a session using the client streams
            async with ClientSession(read_stream, write_stream) as session:
                # Initialize the connection
                await session.initialize()

                result = await session.list_tools()
                print(f"List of tools: {result}")

                self.tools = await load_mcp_tools(session)

                self.graph = create_react_agent(
                    self.model,
                    tools=self.tools,
                    checkpointer=memory,
                    prompt=self.SYSTEM_INSTRUCTION,
                    response_format=ResponseFormat,
                )

    def invoke(self, query, session_id) -> str:
        """Invoke the agent with a query and session ID."""
        config = {"configurable": {"thread_id": session_id}}
        if not self.graph:
            raise ValueError("Agent not initialized. Call init_model_and_tools first.")

        self.graph.invoke({"messages": [("user", query)]}, config)
        return self.get_agent_response(config)

    async def stream(self, query, session_id) -> AsyncIterable[Dict[str, Any]]:
        """Stream the agent's response to a query."""
        inputs = {"messages": [("user", query)]}
        config = {"configurable": {"thread_id": session_id}}
        if not self.graph:
            raise ValueError("Agent not initialized. Call init_model_and_tools first.")

        for item in self.graph.stream(inputs, config, stream_mode="values"):
            message = item["messages"][-1]
            if (
                isinstance(message, AIMessage)
                and message.tool_calls
                and len(message.tool_calls) > 0
            ):
                yield {
                    "is_task_complete": False,
                    "require_user_input": False,
                    "content": "Looking up the exchange rates...",
                }
            elif isinstance(message, ToolMessage):
                yield {
                    "is_task_complete": False,
                    "require_user_input": False,
                    "content": "Processing the exchange rates..",
                }

        yield self.get_agent_response(config)

    def get_agent_response(self, config):
        """Get the agent's response based on the current state."""
        current_state = self.graph.get_state(config)
        structured_response = current_state.values.get("structured_response")
        if structured_response and isinstance(structured_response, ResponseFormat):
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
