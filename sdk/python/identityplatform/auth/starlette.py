# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Middleware for Starlette that authenticates the Identity Service bearer token."""

import json
import logging

from a2a.types import AgentCard, HTTPAuthSecurityScheme
from identityplatform.sdk import IdentityPlatformSdk as Sdk

from starlette.applications import Starlette
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, PlainTextResponse

logger = logging.getLogger("identityplatform.auth.starlette")


class IdentityPlatformMiddleware(BaseHTTPMiddleware):
    """Starlette middleware that authenticates access using an OAuth2 bearer token."""

    def __init__(
        self,
        app: Starlette,
        public_paths: list[str] = [],
    ):
        """Initialize the middleware."""
        super().__init__(app)
        self.public_paths = public_paths
        self.sdk = Sdk()

    async def dispatch(self, request: Request, call_next):
        """Dispatch the request and authenticate the bearer token."""
        path = request.url.path

        # Allow public paths
        if path in self.public_paths:
            return await call_next(request)

        logger.debug(
            "Dispatching request to %s with method %s",
            path,
            request.method,
        )

        # Get access token from the request
        try:
            access_token = self._parse_access_token(request)
        except Exception as e:
            return self._unauthorized(
                "Missing or malformed Authorization header.", request)

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
        return JSONResponse({
            "error": "forbidden",
            "reason": reason
        },
                            status_code=403)

    def _unauthorized(self, reason: str, request: Request):
        """Return a 401 Unauthorized response."""
        accept_header = request.headers.get("accept", "")
        if "text/event-stream" in accept_header:
            return PlainTextResponse(
                f"error unauthorized: {reason}",
                status_code=401,
                media_type="text/event-stream",
            )
        return JSONResponse({
            "error": "unauthorized",
            "reason": reason
        },
                            status_code=401)


class IdentityPlatformA2AMiddleware(IdentityPlatformMiddleware):
    """Starlette middleware that authenticates A2A access using an OAuth2 bearer token."""

    def __init__(
        self,
        app: Starlette,
        agent_card: AgentCard | None = None,
        public_paths: list[str] = [],
    ):
        """Initialize the middleware."""
        super().__init__(app, public_paths)
        self.agent_card = agent_card

        if self.agent_card is None:
            raise ValueError(
                "AgentCard must be provided to IdentityPlatformMiddleware.")

        if self.agent_card.securitySchemes is None:
            raise ValueError(
                "AgentCard must have securitySchemes defined for IdentityPlatformMiddleware."
            )

        # Process the Security Requirements Object to make sure that the IdentityPlatformAuthScheme is used
        for sec_scheme in self.agent_card.securitySchemes.values():
            if isinstance(sec_scheme.root, HTTPAuthSecurityScheme):
                if sec_scheme.root.scheme != "bearer":
                    raise ValueError(
                        "IdentityPlatformMiddleware requires a bearer token scheme."
                    )
                if sec_scheme.root.bearerFormat != "JWT":
                    raise ValueError(
                        "IdentityPlatformMiddleware requires a JWT bearer format."
                    )


class IdentityPlatformMCPMiddleware(IdentityPlatformMiddleware):
    """Starlette middleware that authenticates MCP access using an OAuth2 bearer token."""

    PROTECTED_CALLS = ["tools/call", "resources/read"]

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
            # Authorize the call tool only
            jsonrpc_request = json.loads(body)

            # Allow non protected methods
            if jsonrpc_request.get("method") not in self.PROTECTED_CALLS:
                return await call_next(request)

            # Get the tool name
            tool_name = jsonrpc_request["params"]["name"]
        except Exception as e:
            return self._forbidden(f"Authentication failed: {e}", request)

        logger.debug(
            "Dispatching MCP request with tool name %s",
            tool_name,
        )

        # Get access token from the request
        try:
            access_token = self._parse_access_token(request)
        except Exception as e:
            return self._unauthorized(
                "Missing or malformed Authorization header.", request)

        try:
            # Authorize the access token for the specific tool
            self.sdk.authorize(access_token=access_token, tool_name=tool_name)
        except Exception as e:
            return self._forbidden(f"Authentication failed: {e}", request)

        return await call_next(request)
