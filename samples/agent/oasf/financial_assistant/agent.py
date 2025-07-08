# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Main entry point for the Financial Assistant Agent server."""

from typing import Literal

from langchain_core.messages import HumanMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_ollama import ChatOllama
from langgraph.graph import START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode, create_react_agent, tools_condition
from pydantic import BaseModel


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
        "Your can use the 'get_exchange_rate' tool to answer questions about currency exchange rates. "
        "You can invoke the 'currency_exchange' agent to ask for currency exchanges. "
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

    async def invoke(self, prompt: str):
        """Invoke the agent with the provided prompt."""
        if not self.graph:
            await self.get_graph()

        # Create a message state with the user prompt
        state = MessagesState(messages=[HumanMessage(prompt)])

        # Invoke the graph with the message state
        response = await self.graph.invoke(state)

        return response

    async def get_graph(self):
        """Initialize the model and tools for the agent."""
        # Set up the Ollama model
        self.model = ChatOllama(
            base_url=self.ollama_base_url, model=self.ollama_model, temperature=0.2
        )

        client = MultiServerMCPClient(
            {
                "currency_exchange": {
                    "url": self.mcp_server_url,
                    "transport": "streamable_http",
                },
            }
        )
        self.tools = await client.get_tools()

        def call_model(state: MessagesState):
            response = self.model.bind_tools(self.tools).invoke(state["messages"])
            return {"messages": response}

        builder = StateGraph(MessagesState)
        builder.add_node(call_model)
        builder.add_node(ToolNode(self.tools))
        builder.add_edge(START, "call_model")
        builder.add_conditional_edges(
            "call_model",
            tools_condition,
        )
        builder.add_edge("tools", "call_model")

        self.graph = create_react_agent(
            self.model,
            tools=self.tools,
            prompt=self.SYSTEM_INSTRUCTION,
            response_format=ResponseFormat,
        )

        return self.graph
