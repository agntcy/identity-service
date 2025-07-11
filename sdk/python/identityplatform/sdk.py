# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Identity Platform SDK for Python."""

import inspect
import logging
import os
import time
from importlib import import_module
from pkgutil import iter_modules

import agntcy.identity.platform.v1alpha1
from google.protobuf import empty_pb2

from identityplatform import client, log

logger = logging.getLogger("identity")

if int(os.getenv("IDENTITY_PLATFORM_ENABLE_LOGS", "0")) == 1:
    log.configure()


def _load_grpc_objects(module, path):
    """Load all the objects from the Python Identity SDK."""
    for _, modname, _ in iter_modules(module.__path__):
        # Import the module
        module = import_module(f"{path}.{modname}")
        # Inspect the module and set attributes on Identity SDK for each class found
        for name, obj in inspect.getmembers(module, inspect.isclass):
            setattr(IdentityPlatformSdk, name, obj)


class IdentityPlatformSdk:
    """Identity Platform SDK for Python."""

    def __init__(
        self,
        api_key: str | None = None,
        async_mode=False,
    ):
        """Initialize the Identity Platform SDK.

        Parameters:
            api_key (str | None): The API key to use for authentication.
            async_mode (bool): Whether to use async mode or not. Defaults to False.

        """

        # Try to get the API Key from the environment variable
        if api_key is None:
            api_key = os.environ.get("IDENTITY_PLATFORM_API_KEY")

        # Validate API Key
        if not api_key:
            raise ValueError(
                "An Organization or Agentic Service API Key is required for Identity Platform SDK."
            )

        logger.debug(
            "Initializing Identity Platform SDK with API Key: %s, Async Mode: %s",
            api_key,
            async_mode,
        )

        # Load dynamically all objects
        _load_grpc_objects(
            agntcy.identity.platform.v1alpha1,
            "agntcy.identity.platform.v1alpha1",
        )

        self.client = client.Client(api_key, async_mode)

    def empty_request(self):
        """Return an empty request object."""
        return empty_pb2.Empty()

    def _get_app_service(
        self,
    ) -> "agntcy.identity.platform.v1alpha1.AppsService":
        """Return the AppService stub."""
        return IdentityPlatformSdk.AppServiceStub(self.client.channel)

    def _get_badge_service(
        self,
    ) -> "agntcy.identity.platform.v1alpha1.BadgeService":
        """Return the BadgeService stub."""
        return IdentityPlatformSdk.BadgeServiceStub(self.client.channel)

    def _get_auth_service(
        self,
    ) -> "agntcy.identity.platform.v1alpha1.AuthService":
        """Return the AuthService stub."""
        return IdentityPlatformSdk.AuthServiceStub(self.client.channel)

    def access_token(
        self,
        agentic_service_id: str | None = None,
        tool_name: str | None = None,
        user_token: str | None = None,
    ) -> str | None:
        """Authorizes an agentic service and returns an access token.

        Parameters:
            app_id (str | None): The ID of the app to authorize for.
            tool_name (str | None): The name of the tool to authorize for.
            user_token (str | None): The user token to use for the token.

        Returns:
            str: The issued access token.
        """
        try:
            auth_response = self._get_auth_service().Authorize(
                IdentityPlatformSdk.AuthorizeRequest(
                    app_id=agentic_service_id,
                    tool_name=tool_name,
                    user_token=user_token,
                )
            )

            # Small delay to ensure the authorization code is ready
            time.sleep(0.3)

            token_response = self._get_auth_service().Token(
                IdentityPlatformSdk.TokenRequest(
                    authorization_code=auth_response.authorization_code,
                )
            )

            return token_response.access_token
        except Exception as e:
            raise RuntimeError(
                f"Failed to authorize agentic service {agentic_service_id} with tool {tool_name}: {e}"
            ) from e

    def authorize(self, access_token: str, tool_name: str | None = None):
        """Authorize an agentic service with an access token.

        Parameters:
            access_token (str): The access token to authorize with.
            tool_name (str | None): The name of the tool to authorize for.
        """
        return self._get_auth_service().ExtAuthz(
            IdentityPlatformSdk.ExtAuthzRequest(
                access_token=access_token,
                tool_name=tool_name,
            )
        )

    def verify_badge() -> (
        "agntcy.identity.platform.v1alpha1.VerificationResult"
    ):
        """Verify a badge.

        Parameters:
            badge (str): The badge to verify.

        Returns:
            VerificationResult: The result of the verification.
        """
        return self._get_badge_service().VerifyBadge(
            request=IdentityPlatformSdk.VerifyBadgeRequest(badge=badge)
        )

    async def averify_badge(
        self, badge: str
    ) -> "agntcy.identity.platform.v1alpha1.VerificationResult":
        """Verify a badge using async method.

        Parameters:
            badge (str): The badge to verify.

        Returns:
            VerificationResult: The result of the verification.
        """
        return await self._get_badge_service().VerifyBadge(
            IdentityPlatformSdk.VerifyBadgeRequest(badge=badge)
        )
