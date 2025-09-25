# pylint: disable=broad-except, too-few-public-methods, import-self, no-name-in-module, import-error
# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0
"""MCP Discover for the Identity Service Python SDK."""

import json
from typing import List

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

MCP_SUFFIX = "/mcp"


class McpTool:
    """Represents a tool in the MCP server."""

    def __init__(self, name: str, description: str, parameters: dict):
        """Initialize a McpTool instance."""
        self.name = name
        self.description = description
        self.parameters = parameters


class McpResource:
    """Represents a resource in the MCP server."""

    def __init__(self, name: str, description: str, uri: str):
        """Initialize a McpResource instance."""
        self.name = name
        self.description = description
        self.uri = uri


class McpServer:
    """Represents an MCP server with its tools and resources."""

    def __init__(
        self,
        name: str,
        url: str,
        tools: List[McpTool],
        resources: List[McpResource],
    ):
        """Initialize a McpServer instance."""
        self.name = name
        self.url = url
        self.tools = tools
        self.resources = resources

    def to_json(self):
        """Convert the McpServer instance to a JSON string."""
        return json.dumps(
            self, default=lambda o: o.__dict__, sort_keys=True, indent=4
        )


async def discover(name: str, url: str) -> str:
    """Discover MCP server tools and resources."""
    try:
        # Check if the URL already has a suffix or trailing slash
        if not url.endswith(MCP_SUFFIX):
            url = url.rstrip("/") + MCP_SUFFIX

        # Connect to a streamable HTTP server
        async with streamablehttp_client(f"{url}") as (
            read_stream,
            write_stream,
            _,
        ):
            # Create a session using the client streams
            async with ClientSession(read_stream, write_stream) as session:
                # Initialize the connection
                await session.initialize()

                # Discover MCP server - List tools
                tools_response = await session.list_tools()

                available_tools = []
                for tool in tools_response.tools:
                    # Convert input schema to JSON and parse it
                    json_params = json.dumps(tool.inputSchema)
                    parameters = json.loads(json_params)

                    available_tools.append(
                        McpTool(
                            name=tool.name,
                            description=tool.description,
                            parameters=parameters,
                        )
                    )

                # Discover MCP server - List resources
                resources_response = await session.list_resources()

                available_resources = []
                for resource in resources_response.resources:
                    available_resources.append(
                        McpResource(
                            name=resource.name,
                            description=resource.description,
                            uri=resource.uri,
                        )
                    )

                # Return the discovered MCP server
                return McpServer(
                    name=name,
                    url=url,
                    tools=available_tools,
                    resources=available_resources,
                ).to_json()

    except Exception as err:
        raise err
