# pylint: disable=broad-except, too-few-public-methods, no-name-in-module
# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0
"""Middleware for Starlette that authenticates the Identity Service bearer token."""

import logging

from a2a.types import AgentCard, HTTPAuthSecurityScheme
from identityservice.auth.common import get_mcp_request_tool_name
from identityservice.sdk import IdentityServiceSdk as Sdk

from starlette.applications import Starlette
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, PlainTextResponse

logger = logging.getLogger("identityservice.auth.starlette")


class IdentityServiceMiddleware(BaseHTTPMiddleware):
    """Starlette middleware that authenticates access using an OAuth2 bearer token."""

    def __init__(
        self,
        app: Starlette,
        public_paths: list[str] | None = None,
    ):
        """Initialize the middleware."""
        super().__init__(app)
        self.public_paths = public_paths
        self.sdk = Sdk()

    async def dispatch(self, request: Request, call_next):
        """Dispatch the request and authenticate the bearer token."""
        path = request.url.path

        # Allow public paths
        if self.public_paths and path in self.public_paths:
            return await call_next(request)

        logger.debug(
            "Dispatching request to %s with method %s",
            path,
            request.method,
        )

        # Get access token from the request
        try:
            access_token = self._parse_access_token(request)
        except Exception as _:
            return self._unauthorized(
                "Missing or malformed Authorization header.", request
            )

        try:
            # Authorize the access token
            self.sdk.authorize(access_token=access_token)
        except Exception as e:
            return self._forbidden(f"Authentication failed: {e}", request)

        return await call_next(request)

    def _parse_access_token(self, request: Request):
        # Authenticate the request
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise ValueError(
                "Authorization header is missing or does not start with 'Bearer '"
            )

        return auth_header.split("Bearer ")[1]

    def _forbidden(self, reason: str, request: Request):
        """Return a 403 Forbidden response."""
        accept_header = request.headers.get("accept", "")
        if "text/event-stream" in accept_header:
            return PlainTextResponse(
                f"error forbidden: {reason}",
                status_code=403,
                media_type="text/event-stream",
            )
        return JSONResponse(
            {"error": "forbidden", "reason": reason}, status_code=403
        )

    def _unauthorized(self, reason: str, request: Request):
        """Return a 401 Unauthorized response."""
        accept_header = request.headers.get("accept", "")
        if "text/event-stream" in accept_header:
            return PlainTextResponse(
                f"error unauthorized: {reason}",
                status_code=401,
                media_type="text/event-stream",
            )
        return JSONResponse(
            {"error": "unauthorized", "reason": reason}, status_code=401
        )


class IdentityServiceA2AMiddleware(IdentityServiceMiddleware):
    """Starlette middleware that authenticates A2A access using an OAuth2 bearer token."""

    def __init__(
        self,
        app: Starlette,
        agent_card: AgentCard | None = None,
        public_paths: list[str] | None = None,
    ):
        """Initialize the middleware."""
        super().__init__(app, public_paths)
        self.agent_card = agent_card

        if self.agent_card is None:
            raise ValueError(
                "AgentCard must be provided to IdentityServiceMiddleware."
            )

        security_schemes = self.agent_card.security_schemes
        if hasattr(self.agent_card, "securitySchemes"):
            security_schemes = self.agent_card.securitySchemes

        if security_schemes is None:
            raise ValueError(
                "AgentCard must have securitySchemes defined for IdentityServiceMiddleware."
            )

        # Process the Security Requirements Object to make sure
        # that the IdentityServiceAuthScheme is used
        for sec_scheme in security_schemes.values():
            if isinstance(sec_scheme.root, HTTPAuthSecurityScheme):
                if sec_scheme.root.scheme != "bearer":
                    raise ValueError(
                        "IdentityServiceMiddleware requires a bearer token scheme."
                    )
                bearer_format = sec_scheme.root.bearer_format
                if hasattr(sec_scheme.root, "bearerFormat"):
                    bearer_format = sec_scheme.root.bearerFormat

                if bearer_format != "JWT":
                    raise ValueError(
                        "IdentityServiceMiddleware requires a JWT bearer format."
                    )


class IdentityServiceMCPMiddleware(IdentityServiceMiddleware):
    """Starlette middleware that authenticates MCP access using an OAuth2 bearer token."""

    def __init__(
        self,
        app: Starlette,
    ):
        """Initialize the middleware."""
        super().__init__(app, [])

    async def dispatch(self, request: Request, call_next):
        """Dispatch the request and authenticate the bearer token."""
        # Try to parse JSON RPC request
        body = await request.body()

        try:
            # Get the tool name
            tool_name = get_mcp_request_tool_name(body)

            logger.debug(
                "Parsed MCP request with tool name: %s",
                tool_name,
            )

            if tool_name is None:
                # If the tool name is not found, allow the request to pass through
                return await call_next(request)
        except Exception as e:
            return self._forbidden(f"Authentication failed: {e}", request)

        logger.debug(
            "Dispatching MCP request with tool name %s",
            tool_name,
        )

        # Get access token from the request
        try:
            access_token = self._parse_access_token(request)
        except Exception as _:
            return self._unauthorized(
                "Missing or malformed Authorization header.", request
            )

        try:
            # Authorize the access token for the specific tool
            self.sdk.authorize(access_token=access_token, tool_name=tool_name)
        except Exception as e:
            return self._forbidden(f"Authentication failed: {e}", request)

        return await call_next(request)
