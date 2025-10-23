# pylint: disable=logging-fstring-interpolation, no-member, no-name-in-module
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Identity Service SDK for Python."""

import asyncio
import logging

from google.protobuf import empty_pb2

from agntcy.identity.service.v1alpha1 import (
    app_service_pb2_grpc,
    auth_service_pb2_grpc,
    badge_service_pb2_grpc,
    device_service_pb2_grpc,
    policy_service_pb2_grpc,
    settings_service_pb2_grpc,
)
from agntcy.identity.service.v1alpha1.app_service_pb2_grpc import AppServiceStub
from agntcy.identity.service.v1alpha1.auth_service_pb2 import (
    AuthorizeRequest,
    ExtAuthzRequest,
    TokenRequest,
)
from agntcy.identity.service.v1alpha1.auth_service_pb2_grpc import (
    AuthServiceStub,
)
from agntcy.identity.service.v1alpha1.badge_pb2 import Badge, VerificationResult
from agntcy.identity.service.v1alpha1.badge_service_pb2 import (
    IssueBadgeRequest,
    VerifyBadgeRequest,
)
from agntcy.identity.service.v1alpha1.badge_service_pb2_grpc import (
    BadgeServiceStub,
)
from agntcy.identity.service.v1alpha1.device_service_pb2_grpc import (
    DeviceServiceStub,
)
from agntcy.identity.service.v1alpha1.policy_service_pb2_grpc import (
    PolicyServiceStub,
)
from agntcy.identity.service.v1alpha1.settings_service_pb2_grpc import (
    SettingsServiceStub,
)
from identityservice.badge.claims import create_claims
from identityservice.client import Client

logging.getLogger("identityservice").addHandler(logging.NullHandler())
logger = logging.getLogger("identityservice.sdk")


def empty_request():
    """Return an empty request object."""
    return empty_pb2.Empty()


class IdentityServiceSdk:
    """Identity Service SDK for Python."""

    def __init__(
        self,
        api_key: str | None = None,
    ):
        """Initialize the Identity Service SDK.

        Parameters:
            api_key (str | None): The API key to use for authentication.

        """
        logger.debug("Initializing Identity Service SDK with API Key")

        self.client = Client(api_key, async_mode=False)

    def get_settings_service(
        self,
    ) -> SettingsServiceStub:
        """Return the SettingsService stub."""
        return SettingsServiceStub(self.client.channel)

    def get_app_service(
        self,
    ) -> AppServiceStub:
        """Return the AppService stub."""
        return AppServiceStub(self.client.channel)

    def get_badge_service(
        self,
    ) -> BadgeServiceStub:
        """Return the BadgeService stub."""
        return BadgeServiceStub(self.client.channel)

    def get_auth_service(
        self,
    ) -> AuthServiceStub:
        """Return the AuthService stub."""
        return AuthServiceStub(self.client.channel)

    def get_device_service(
        self,
    ) -> DeviceServiceStub:
        """Return the DeviceService stub."""
        return DeviceServiceStub(self.client.channel)

    def get_policy_service(
        self,
    ) -> PolicyServiceStub:
        """Return the PolicyServiceStub stub."""
        return PolicyServiceStub(self.client.channel)

    def access_token(
        self,
        resolver_metadata_id: str | None = None,
        tool_name: str | None = None,
        user_token: str | None = None,
    ) -> str | None:
        # pylint: disable=line-too-long
        """Authorizes an agentic service and returns an access token.

        Parameters:
            resolver_metadata_id (str | None): The ResolverMetadata ID of the Agentic Service to authorize for.
            tool_name (str | None): The name of the tool to authorize for.
            user_token (str | None): The user token to use for the token.

        Returns:
            str: The issued access token.
        """
        auth_response = self.get_auth_service().Authorize(
            AuthorizeRequest(
                resolver_metadata_id=resolver_metadata_id,
                tool_name=tool_name,
                user_token=user_token,
            )
        )

        token_response = self.get_auth_service().Token(
            TokenRequest(
                authorization_code=auth_response.authorization_code,
            )
        )

        return token_response.access_token

    def authorize(self, access_token: str, tool_name: str | None = None):
        """Authorize an agentic service with an access token.

        Parameters:
            access_token (str): The access token to authorize with.
            tool_name (str | None): The name of the tool to authorize for.
        """
        return self.get_auth_service().ExtAuthz(
            ExtAuthzRequest(
                access_token=access_token,
                tool_name=tool_name,
            )
        )

    def verify_badge(self, badge: str) -> VerificationResult:
        """Verify a badge.

        Parameters:
            badge (str): The badge to verify.

        Returns:
            VerificationResult: The result of the verification.
        """
        return self.get_badge_service().VerifyBadge(
            VerifyBadgeRequest(badge=badge)
        )

    def issue_badge(
        self,
        url: str,
    ) -> Badge:
        """Issue a badge for an agentic service.

        Parameters:
            url (str): The URL of the agentic service to issue a badge for.
        """
        # Fetch the agentic service
        app_info = self.get_auth_service().AppInfo(empty_pb2.Empty())

        # Get name and type
        service_name = app_info.app.name
        service_type = app_info.app.type
        service_id = app_info.app.id

        logger.debug(f"Service Name: [bold blue]{service_name}[/bold blue]")
        logger.debug(f"Service Type: [bold blue]{service_type}[/bold blue]")

        # Get claims
        claims = asyncio.run(create_claims(url, service_name, service_type))

        # Issue the badge
        return self.get_badge_service().IssueBadge(
            request=IssueBadgeRequest(app_id=service_id, **claims)
        )


class IdentityServiceAsyncSdk:
    """Identity Service Async SDK for Python."""

    def __init__(
        self,
        api_key: str | None = None,
    ):
        """Initialize the Identity Service SDK.

        Parameters:
            api_key (str | None): The API key to use for authentication.
            async_mode (bool): Whether to use async mode or not. Defaults to False.

        """
        logger.debug("Initializing Identity Service async SDK with API Key")

        self.client = Client(api_key, async_mode=True)

    def get_settings_service(
        self,
    ) -> "settings_service_pb2_grpc.SettingsServiceAsyncStub":
        """Return the SettingsService async stub."""
        return SettingsServiceStub(self.client.channel)  # type: ignore

    def get_app_service(
        self,
    ) -> "app_service_pb2_grpc.AppServiceAsyncStub":
        """Return the AppService async stub."""
        return AppServiceStub(self.client.channel)  # type: ignore

    def get_badge_service(
        self,
    ) -> "badge_service_pb2_grpc.BadgeServiceAsyncStub":
        """Return the BadgeService async stub."""
        return BadgeServiceStub(self.client.channel)  # type: ignore

    def get_auth_service(
        self,
    ) -> "auth_service_pb2_grpc.AuthServiceAsyncStub":
        """Return the AuthService async stub."""
        return AuthServiceStub(self.client.channel)  # type: ignore

    def get_device_service(
        self,
    ) -> "device_service_pb2_grpc.DeviceServiceAsyncStub":
        """Return the DeviceService async stub."""
        return DeviceServiceStub(self.client.channel)  # type: ignore

    def get_policy_service(
        self,
    ) -> "policy_service_pb2_grpc.PolicyServiceAsyncStub":
        """Return the PolicyServiceStub async stub."""
        return PolicyServiceStub(self.client.channel)  # type: ignore

    async def access_token(
        self,
        resolver_metadata_id: str | None = None,
        tool_name: str | None = None,
        user_token: str | None = None,
    ) -> str | None:
        # pylint: disable=line-too-long
        """Authorizes an agentic service and returns an access token.

        Parameters:
            resolver_metadata_id (str | None): The ResolverMetadata ID of the Agentic Service to authorize for.
            tool_name (str | None): The name of the tool to authorize for.
            user_token (str | None): The user token to use for the token.

        Returns:
            str: The issued access token.
        """
        auth_response = await self.get_auth_service().Authorize(
            AuthorizeRequest(
                resolver_metadata_id=resolver_metadata_id,
                tool_name=tool_name,
                user_token=user_token,
            )
        )

        token_response = await self.get_auth_service().Token(
            TokenRequest(
                authorization_code=auth_response.authorization_code,
            )
        )

        return token_response.access_token

    async def authorize(self, access_token: str, tool_name: str | None = None):
        """Authorize an agentic service with an access token using async method.

        Parameters:
            access_token (str): The access token to authorize with.
            tool_name (str | None): The name of the tool to authorize for.
        """
        return await self.get_auth_service().ExtAuthz(
            ExtAuthzRequest(
                access_token=access_token,
                tool_name=tool_name,
            )
        )

    async def verify_badge(self, badge: str) -> VerificationResult:
        """Verify a badge using async method.

        Parameters:
            badge (str): The badge to verify.

        Returns:
            VerificationResult: The result of the verification.
        """
        return await self.get_badge_service().VerifyBadge(
            VerifyBadgeRequest(badge=badge)
        )

    async def issue_badge(
        self,
        url: str,
    ) -> Badge:
        """Issue a badge for an agentic service.

        Parameters:
            url (str): The URL of the agentic service to issue a badge for.
        """
        # Fetch the agentic service
        app_info = await self.get_auth_service().AppInfo(empty_pb2.Empty())

        # Get name and type
        service_name = app_info.app.name
        service_type = app_info.app.type
        service_id = app_info.app.id

        logger.debug(f"Service Name: [bold blue]{service_name}[/bold blue]")
        logger.debug(f"Service Type: [bold blue]{service_type}[/bold blue]")

        # Get claims
        claims = await create_claims(url, service_name, service_type)

        # Issue the badge
        return await self.get_badge_service().IssueBadge(
            request=IssueBadgeRequest(app_id=service_id, **claims)
        )
