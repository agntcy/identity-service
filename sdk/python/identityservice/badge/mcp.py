# pylint: disable=broad-except, too-few-public-methods, import-self, no-name-in-module, import-error
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""MCP Discover for the Identity Service Python SDK."""

import json
from typing import Dict, List

from httpx import HTTPError
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

from identityservice.exceptions import SdkError

MCP_SUFFIX = "/mcp"


class McpTool:
    """Represents a tool in the MCP server."""

    def __init__(self, name: str, description: str | None, parameters: dict):
        """Initialize a McpTool instance."""
        self.name = name
        self.description = description
        self.parameters = parameters


class McpResource:
    """Represents a resource in the MCP server."""

    def __init__(self, name: str, description: str | None, uri: str):
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

                available_tools = await _discover_tools(session)

                available_resources = await _discover_resources(session)

                # Return the discovered MCP server
                return McpServer(
                    name=name,
                    url=url,
                    tools=available_tools,
                    resources=available_resources,
                ).to_json()

    except Exception as e:
        if isinstance(e, ExceptionGroup):
            eg: ExceptionGroup = e
            metadata = _get_http_error_metadata(eg.exceptions[0])
            raise SdkError(
                f"MCP client: {str(eg.exceptions[0])}",
                metadata=metadata,
                inner_exception=eg,
            ) from e
        raise SdkError("MCP server discovery failed", inner_exception=e) from e


async def _discover_tools(session: ClientSession):
    """Discover MCP server - List tools"""
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

    return available_tools


async def _discover_resources(session: ClientSession):
    """Discover MCP server - List resources"""
    resources_response = await session.list_resources()

    available_resources = []
    for resource in resources_response.resources:
        available_resources.append(
            McpResource(
                name=resource.name,
                description=resource.description,
                uri=str(resource.uri),
            )
        )

    return available_resources


def _get_http_error_metadata(err: Exception) -> Dict[str, str]:
    if not isinstance(err, HTTPError):
        return {}

    body = err.request.content.decode("utf-8")
    return {
        "url": str(err.request.url),
        "method": err.request.method,
        "body": json.loads(body),
    }
