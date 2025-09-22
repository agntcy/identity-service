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
from identityservice.auth.httpx import IdentityServiceAuth
from langgraph.prebuilt import InjectedState

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


async def run_single_turn_test(client: A2AClient, state: dict) -> str:
    """Runs a single-turn non-streaming test."""

    text = state["messages"][0].content
    logger.info(
        f"Running single-turn test with text: {text}",
    )

    send_payload = create_send_message_payload(text=text)
    request = SendMessageRequest(
        id=str(uuid4()), params=MessageSendParams(**send_payload)
    )

    print("--- Single Turn Request ---")
    # Send Message
    send_response: SendMessageResponse = await client.send_message(request)
    logger.info("Send message response: %s", send_response)

    if not isinstance(send_response.root, SendMessageSuccessResponse):
        print("received non-success response. Aborting get task ")
        return ""

    if not isinstance(send_response.root.result, Task):
        print("received non-task response. Aborting get task ")
        return ""

    task_id: str = send_response.root.result.id
    print("---Query Task---")
    # query the task
    get_request = GetTaskRequest(id=str(uuid4()), params=TaskQueryParams(id=task_id))
    get_response: GetTaskResponse = await client.get_task(get_request)
    logger.info("Get task response: %s", get_response)

    history = get_response.root.result.history

    return history[len(history) - 1].parts[0].root.text if len(history) > 0 else ""


class CurrencyExchangeAgent:
    """External A2A Currency Exchange Agent."""

    def __init__(self, url):
        self.url = url

    def get_invoke_tool(self):
        """Create a tool to hand off to the currency exchange agent."""

        async def invoke_currency_exchange_agent(
            task_description: Annotated[
                str,
                "Description of what the next agent should do, including all of the relevant context.",
            ],
            state: Annotated[dict, InjectedState],
        ):
            """Executes currency exchange sells, orders, trades."""

            logger.info("Invoking currency exchange agent with state: %s", state)
            logger.info("Task description: %s", task_description)

            # Connect to the agent
            try:
                timeout = httpx.Timeout(connect=None, read=None, write=None, pool=None)
                auth = IdentityServiceAuth()
                async with httpx.AsyncClient(
                    timeout=timeout, auth=auth
                ) as httpx_client:
                    client = await A2AClient.get_client_from_agent_card_url(
                        httpx_client,
                        self.url,
                    )
                    print("Connection successful.")

                    # Test the agent with a simple query
                    return await run_single_turn_test(client, state)

            except Exception as e:
                logger.error("An error occurred while connecting to the agent: %s", e)

        return invoke_currency_exchange_agent
