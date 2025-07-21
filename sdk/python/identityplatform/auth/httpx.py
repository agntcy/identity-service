# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Httpx Auth module for the Identity Service Python SDK."""

import logging

from identityplatform.sdk import IdentityPlatformSdk as Sdk

import httpx

logger = logging.getLogger("identityplatform.auth.httpx")


class IdentityPlatformAuth(httpx.Auth):
    """Httpx authentication class for the Identity Service SDK."""

    def __init__(self):
        """Initialize the IdentityPlatformAuth class."""
        self.sdk = Sdk()

    def auth_flow(self, request):
        """Add the Authorization header to the request."""
        access_token = self.sdk.access_token()

        logger.debug("Issued new access token for Identity Service SDK")

        request.headers["Authorization"] = f"Bearer {access_token}"
        yield request
