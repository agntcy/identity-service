# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""A2A agent."""

import logging
from collections.abc import AsyncIterable
from typing import Any, Dict, Literal

from identityservice.auth.httpx import IdentityServiceAuth
from langchain_core.messages import AIMessage, ToolMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent
from pydantic import BaseModel

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
        "Your sole purpose is to use the 'execute_exchange' tool to perform currency conversions. "
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
        azure_openai_endpoint,
        azure_openai_api_key,
        currency_exchange_mcp_server_url,
    ) -> None:
        """Initialize the agent with the Azure OpenAI model and tools."""
        self.azure_openai_endpoint = azure_openai_endpoint
        self.azure_openai_api_key = azure_openai_api_key
        self.currency_exchange_mcp_server_url = currency_exchange_mcp_server_url

        self.model = None
        self.tools = None
        self.graph = None

    async def init_model_and_tools(self):
        """Initialize the model and tools for the agent."""
        # Set up the Azure OpenAI model via AI Gateway
        self.model = ChatOpenAI(
            api_key=self.azure_openai_api_key,
            base_url=self.azure_openai_endpoint,
            model="gpt-3.5-turbo",  # Specify the model explicitly
            temperature=0.2,
            max_completion_tokens=1000,
            top_p=0.5,
            default_headers={"Authorization": f"Bearer {self.azure_openai_api_key}"},
        )

        # Init auth
        auth = IdentityServiceAuth()

        # Load tools from the MCP Server
        client = MultiServerMCPClient(
            {
                "currency_exchange": {
                    "url": self.currency_exchange_mcp_server_url,
                    "transport": "streamable_http",
                    "auth": auth,
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
                    "content": f"Success. Details: {message.content}",
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
