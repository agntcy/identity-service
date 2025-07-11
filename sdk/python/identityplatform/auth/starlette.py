# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Middleware for Starlette that authenticates the Identity Platform bearer token."""

from identityplatform.sdk import IdentityPlatformSdk as Sdk

from starlette.applications import Starlette
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, PlainTextResponse


class IdentityPlatformMiddleware(BaseHTTPMiddleware):
    """Starlette middleware that authenticates A2A access using an OAuth2 bearer token."""

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

        # Authenticate the request
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return self._unauthorized(
                "Missing or malformed Authorization header.", request
            )

        access_token = auth_header.split("Bearer ")[1]

        try:
            # Authorize the access token
            self.sdk.authorize(access_token=access_token)
        except Exception as e:
            return self._forbidden(f"Authentication failed: {e}", request)

        return await call_next(request)

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
