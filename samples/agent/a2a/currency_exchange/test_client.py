# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Test client for the A2A agent."""

import asyncio
import traceback
from typing import Any
from uuid import uuid4

import httpx
from a2a.client import A2AClient
from a2a.types import (GetTaskRequest, GetTaskResponse, MessageSendParams,
                       SendMessageRequest, SendMessageResponse,
                       SendMessageSuccessResponse, Task, TaskQueryParams)

AGENT_URL = "http://0.0.0.0:9091"


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


async def print_agent_card() -> None:
    """Print the agent card."""
    r = httpx.get(AGENT_URL + "/.well-known/agent.json")
    if r.status_code == 200:
        print(r.json())
    else:
        print(f"Failed to fetch agent card: {r.status_code}")


async def run_single_turn_test(client: A2AClient) -> None:
    """Runs a single-turn non-streaming test."""

    send_payload = create_send_message_payload(text="How much is 1020 CAD in EUR")
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


# pylint: disable=broad-exception-caught
async def main() -> None:
    """Main function to run the tests."""

    # Print the agent card
    await print_agent_card()

    # Connect to the agent
    print(f"Connecting to agent at {AGENT_URL}...")
    try:
        timeout = httpx.Timeout(connect=None, read=None, write=None, pool=None)
        async with httpx.AsyncClient(timeout=timeout) as httpx_client:
            client = await A2AClient.get_client_from_agent_card_url(
                httpx_client, AGENT_URL
            )
            print("Connection successful.")

            # Test the agent with a simple query
            await run_single_turn_test(client)

    except Exception as e:
        traceback.print_exc()
        print(f"An error occurred: {e}")
        print("Ensure the agent server is running.")


if __name__ == "__main__":
    asyncio.run(main())
