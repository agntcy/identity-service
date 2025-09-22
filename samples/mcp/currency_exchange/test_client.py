# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Test client for the MCP Server."""

import asyncio

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

MCP_SERVER_URL = "http://0.0.0.0:9090/mcp"


# pylint: disable=broad-exception-caught
async def main() -> None:
    """Main function to run the tests."""

    # Connect to a streamable HTTP server
    async with streamablehttp_client(MCP_SERVER_URL) as (
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


if __name__ == "__main__":
    asyncio.run(main())
