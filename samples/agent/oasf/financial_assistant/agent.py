# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Main entry point for the Financial Assistant Agent server."""

import uuid
from typing import Annotated, Literal

from langchain_core.tools import InjectedToolCallId, tool
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_ollama import ChatOllama
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState
from langgraph.prebuilt import InjectedState, create_react_agent
from langgraph.types import Command
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
        "For all currency exchange operations use the Currency Exchange agent and do not, "
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
        mcp_server_url,
    ) -> None:
        """Initialize the agent with the Ollama model and tools."""
        self.ollama_base_url = ollama_base_url
        self.ollama_model = ollama_model
        self.mcp_server_url = mcp_server_url

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

        def create_handoff_tool(*, agent_name: str, description: str | None = None):
            name = f"transfer_to_{agent_name}"
            description = description or f"Ask {agent_name} for help."

            @tool(name, description=description)
            def handoff_tool(
                state: Annotated[MessagesState, InjectedState],
                tool_call_id: Annotated[str, InjectedToolCallId],
            ) -> Command:
                tool_message = {
                    "role": "tool",
                    "content": f"Successfully transferred to {agent_name}",
                    "name": name,
                    "tool_call_id": tool_call_id,
                }

                return Command(
                    goto=agent_name,
                    update={
                        **state,
                        "messages": state["messages"] + [tool_message],
                    },
                    graph=Command.PARENT,
                )

            return handoff_tool

        # Create handoff tool for currency exchange agent
        assign_to_currency_echange_agent = create_handoff_tool(
            agent_name="currency_echange_agent",
            description="Assign all currency exchange operations to the currency exchange agent.",
        )

        # Load tools from the MCP Server
        client = MultiServerMCPClient(
            {
                "currency_exchange": {
                    "url": self.mcp_server_url,
                    "transport": "streamable_http",
                },
            }
        )
        tools = await client.get_tools()

        # Add the handoff tool to the list of tools
        tools.append(assign_to_currency_echange_agent)

        self.graph = create_react_agent(
            self.model,
            tools=[assign_to_currency_echange_agent],
            checkpointer=memory,
            prompt=self.SYSTEM_INSTRUCTION,
            response_format=ResponseFormat,
        )

        # def call_model(state: MessagesState):
        #     response = self.model.bind_tools(self.tools).invoke(state["messages"])
        #     return {"messages": response}
        #
        # builder = StateGraph(MessagesState)
        # builder.add_node(call_model)
        # builder.add_node(ToolNode(self.tools))
        # builder.add_edge(START, "call_model")
        # builder.add_conditional_edges(
        #     "call_model",
        #     tools_condition,
        # )
        # builder.add_edge("tools", "call_model")
        #
        # self.graph = builder.compile()
