# pylint: disable=too-few-public-methods
# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0
"""Httpx Auth module for the Identity Service Python SDK."""

import logging

from identityservice.auth.common import get_mcp_request_tool_name
from identityservice.sdk import IdentityServiceSdk as Sdk

import httpx

logger = logging.getLogger("identityservice.auth.httpx")


class IdentityServiceAuth(httpx.Auth):
    """Httpx authentication class for the Identity Service SDK."""

    def __init__(self, agentic_service_id: str | None = None):
        """Initialize the IdentityServiceAuth class."""
        self.agentic_service_id = agentic_service_id
        self.sdk = Sdk()

    def auth_flow(self, request):
        """Add the Authorization header to the request."""
        access_token = self.sdk.access_token(
            agentic_service_id=self.agentic_service_id
        )

        logger.debug("Issued new access token for Identity Service SDK")

        request.headers["Authorization"] = f"Bearer {access_token}"
        yield request


class IdentityServiceMCPAuth(IdentityServiceAuth):
    """Httpx authentication class for the Identity Service SDK."""

    def auth_flow(self, request):
        """Add the Authorization header to the request."""
        # Try to parse JSON RPC request
        body = request.read()

        try:
            # Get the tool name
            tool_name = get_mcp_request_tool_name(body)

            logger.debug(
                "Parsed tool name from JSON RPC request: %s", tool_name
            )

            if tool_name is None:
                # If the tool name is not found, allow the request to pass through
                yield request

                return
        except Exception as e:
            raise httpx.HTTPError(
                f"Failed to parse JSON RPC request: {e}"
            ) from e

        logger.debug(
            "Request is a protected MCP call for tool: %s and agentic_service_id: %s",
            tool_name,
            self.agentic_service_id,
        )

        access_token = self.sdk.access_token(
            tool_name=tool_name, agentic_service_id=self.agentic_service_id
        )

        logger.debug("Issued new access token for Identity Service SDK")

        request.headers["Authorization"] = f"Bearer {access_token}"
        yield request
