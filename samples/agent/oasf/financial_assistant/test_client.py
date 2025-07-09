# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Test client for the A2A agent."""

import asyncio
import traceback

import httpx

AGENT_URL = "http://0.0.0.0:9092/invoke"


# pylint: disable=broad-exception-caught
async def main() -> None:
    """Main function to run the tests."""

    # Connect to the agent
    print(f"Connecting to agent at {AGENT_URL}...")
    try:
        timeout = httpx.Timeout(connect=None, read=None, write=None, pool=None)
        async with httpx.AsyncClient(timeout=timeout) as httpx_client:
            res = await httpx_client.post(
                AGENT_URL, json={"prompt": "Please convert 900 USD to EUR"}
            )

            print(res.json())

    except Exception as e:
        traceback.print_exc()
        print(f"An error occurred: {e}")
        print("Ensure the agent server is running.")


if __name__ == "__main__":
    asyncio.run(main())
