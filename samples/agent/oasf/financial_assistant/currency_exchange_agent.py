# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Currency Exchange Agent for A2A interactions."""

import logging
from typing import Annotated, Any
from uuid import uuid4

import httpx
from a2a.client import A2AClient
from a2a.types import (GetTaskRequest, GetTaskResponse, MessageSendParams,
                       SendMessageRequest, SendMessageResponse,
                       SendMessageSuccessResponse, Task, TaskQueryParams)
from langgraph.prebuilt import InjectedState

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_send_message_payload(
    text: str, task_id: str | None = None, context_id: str | None = None
) -> dict[str, Any]:
    """Helper function to create the payload for sending a task."""
    payload: dict[str, Any] = {
        "message": {
            "role": "user",
            "parts": [{"kind": "text", "text": text}],
            "messageId": uuid4().hex,
        },
    }

    if task_id:
        payload["message"]["taskId"] = task_id

    if context_id:
        payload["message"]["contextId"] = context_id
    return payload


def print_json_response(response: Any, description: str) -> None:
    """Helper function to print the JSON representation of a response."""
    print(f"--- {description} ---")
    if hasattr(response, "root"):
        print(f"{response.root.model_dump_json(exclude_none=True)}\n")
    else:
        print(f"{response.model_dump(mode='json', exclude_none=True)}\n")


async def run_single_turn_test(client: A2AClient, state: dict) -> None:
    """Runs a single-turn non-streaming test."""

    text = state["messages"][0].content
    logger.info(
        f"Running single-turn test with text: {text}",
    )

    send_payload = create_send_message_payload(text=text)
    request = SendMessageRequest(params=MessageSendParams(**send_payload))

    print("--- Single Turn Request ---")
    # Send Message
    send_response: SendMessageResponse = await client.send_message(request)
    print_json_response(send_response, "Single Turn Request Response")
    if not isinstance(send_response.root, SendMessageSuccessResponse):
        print("received non-success response. Aborting get task ")
        return

    if not isinstance(send_response.root.result, Task):
        print("received non-task response. Aborting get task ")
        return

    task_id: str = send_response.root.result.id
    print("---Query Task---")
    # query the task
    get_request = GetTaskRequest(params=TaskQueryParams(id=task_id))
    get_response: GetTaskResponse = await client.get_task(get_request)
    print_json_response(get_response, "Query Task Response")


class CurrencyExchangeAgent:
    """External A2A Currency Exchange Agent."""

    def __init__(self, url):
        self.url = url

    def get_invoke_tool(self):
        """Create a tool to hand off to the currency exchange agent."""

        async def invoke_agent(state: Annotated[dict, InjectedState]):
            """Invoke the currency exchange agent."""

            logger.info("Invoking currency exchange agent with state: %s", state)

            # Connect to the agent
            try:
                timeout = httpx.Timeout(connect=None, read=None, write=None, pool=None)
                async with httpx.AsyncClient(timeout=timeout) as httpx_client:
                    client = await A2AClient.get_client_from_agent_card_url(
                        httpx_client,
                        self.url,
                    )
                    print("Connection successful.")

                    # Test the agent with a simple query
                    await run_single_turn_test(client, state)

            except Exception as e:
                logger.error("An error occurred while connecting to the agent: %s", e)

        return invoke_agent
