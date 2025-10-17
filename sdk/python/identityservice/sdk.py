# pylint: disable=logging-fstring-interpolation, no-member, no-name-in-module
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Identity Service SDK for Python."""

import asyncio
import base64
import logging
import os

from dotenv import load_dotenv
from google.protobuf import empty_pb2
from agntcy.identity.service.v1alpha1.app_pb2 import AppType
from agntcy.identity.service.v1alpha1.app_service_pb2_grpc import AppServiceStub, AppServiceAsyncStub
from agntcy.identity.service.v1alpha1.auth_service_pb2 import AuthorizeRequest, TokenRequest, ExtAuthzRequest
from agntcy.identity.service.v1alpha1.auth_service_pb2_grpc import AuthServiceStub, AuthServiceAsyncStub
from agntcy.identity.service.v1alpha1.badge_pb2 import VerificationResult
from agntcy.identity.service.v1alpha1.badge_service_pb2 import VerifyBadgeRequest, IssueBadgeRequest
from agntcy.identity.service.v1alpha1.badge_service_pb2_grpc import BadgeServiceStub, BadgeServiceAsyncStub
from agntcy.identity.service.v1alpha1.device_service_pb2_grpc import DeviceServiceStub, DeviceServiceAsyncStub
from agntcy.identity.service.v1alpha1.policy_service_pb2_grpc import PolicyServiceStub, PolicyServiceAsyncStub
from agntcy.identity.service.v1alpha1.settings_service_pb2_grpc import SettingsServiceStub, SettingsServiceAsyncStub

from identityservice import client
from identityservice.badge.a2a import adiscover as adiscover_a2a
from identityservice.badge.a2a import discover as discover_a2a
from identityservice.badge.mcp import discover as discover_mcp

logging.getLogger("identityservice").addHandler(logging.NullHandler())
logger = logging.getLogger("identityservice.sdk")


class IdentityServiceSdk:
    """Identity Service SDK for Python."""

    def __init__(
        self,
        api_key: str | None = None,
        async_mode=False,
    ):
        """Initialize the Identity Service SDK.

        Parameters:
            api_key (str | None): The API key to use for authentication.
            async_mode (bool): Whether to use async mode or not. Defaults to False.

        """
        # Try to get the API Key from the environment variable
        if api_key is None:
            load_dotenv()
            api_key = os.environ.get("IDENTITY_SERVICE_API_KEY")

        # Validate API Key
        if not api_key:
            raise ValueError(
                "An Organization or Agentic Service API Key is required for Identity Service SDK."
            )

        logger.debug(
            "Initializing Identity Service SDK with API Key, Async Mode: %s",
            async_mode,
        )

        self.client = client.Client(api_key, async_mode)

    def empty_request(self):
        """Return an empty request object."""
        return empty_pb2.Empty() 

    def get_settings_service(
        self,
    ) -> SettingsServiceStub:
        """Return the SettingsService stub."""
        return SettingsServiceStub(self.client.channel)

    def get_settings_async_service(
        self,
    ) -> SettingsServiceAsyncStub:
        """Return the SettingsService async stub."""
        return SettingsServiceStub(self.client.channel)

    def get_app_service(
        self,
    ) -> AppServiceStub:
        """Return the AppService stub."""
        return AppServiceStub(self.client.channel)

    def get_app_async_service(
        self,
    ) -> AppServiceAsyncStub:
        """Return the AppService async stub."""
        return AppServiceStub(self.client.channel)

    def get_badge_service(
        self,
    ) -> BadgeServiceStub:
        """Return the BadgeService stub."""
        return BadgeServiceStub(self.client.channel)

    def get_badge_async_service(
        self,
    ) -> BadgeServiceAsyncStub:
        """Return the BadgeService async stub."""
        return BadgeServiceStub(self.client.channel)

    def get_auth_service(
        self,
    ) -> AuthServiceStub:
        """Return the AuthService stub."""
        return AuthServiceStub(self.client.channel)

    def get_auth_async_service(
        self,
    ) -> AuthServiceAsyncStub:
        """Return the AuthService async stub."""
        return AuthServiceStub(self.client.channel)
 
    def get_device_service(
        self,
    ) -> DeviceServiceStub:
        """Return the DeviceService stub."""
        return DeviceServiceStub(self.client.channel)

    def get_device_async_service(
        self,
    ) -> DeviceServiceAsyncStub:
        """Return the DeviceService async stub."""
        return DeviceServiceStub(self.client.channel)

    def get_policy_service(
        self,
    ) -> PolicyServiceStub:
        """Return the PolicyServiceStub stub."""
        return PolicyServiceStub(self.client.channel)

    def get_policy_async_service(
        self,
    ) -> PolicyServiceAsyncStub:
        """Return the PolicyServiceStub async stub."""
        return PolicyServiceStub(self.client.channel)

    def access_token(
        self,
        resolver_metadata_id: str | None = None,
        tool_name: str | None = None,
        user_token: str | None = None,
    ) -> str | None:
        """Authorizes an agentic service and returns an access token.

        Parameters:
            resolver_metadata_id (str | None): The ResolverMetadata ID of the Agentic Service to authorize for.
            tool_name (str | None): The name of the tool to authorize for.
            user_token (str | None): The user token to use for the token.

        Returns:
            str: The issued access token.
        """
        try:
            auth_response = self.get_auth_service().Authorize(
                AuthorizeRequest(
                    app_id=resolver_metadata_id,
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
        except Exception as e:
            raise RuntimeError(
                f"""Failed to authorize agentic service {resolver_metadata_id}
                with tool {tool_name}: {e}"""
            ) from e

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

    def verify_badge(
        self, badge: str
    ) -> VerificationResult:
        """Verify a badge.

        Parameters:
            badge (str): The badge to verify.

        Returns:
            VerificationResult: The result of the verification.
        """
        return self.get_badge_service().VerifyBadge(
            request=VerifyBadgeRequest(badge=badge)
        )

    async def verify_badge_async(
        self, badge: str
    ) -> VerificationResult:
        """Verify a badge using async method.

        Parameters:
            badge (str): The badge to verify.

        Returns:
            VerificationResult: The result of the verification.
        """
        return await self.get_badge_service().VerifyBadge(
            VerifyBadgeRequest(badge=badge)
        )

    def issue_badge(
        self,
        url: str,
    ):
        """Issue a badge for an agentic service.

        Parameters:
            url (str): The URL of the agentic service to issue a badge for.
        """
        # Fetch the agentic service
        app_info = self.get_auth_service().AppInfo(self.empty_request())

        # Get name and type
        service_name = app_info.app.name
        service_type = app_info.app.type
        service_id = app_info.app.id

        logger.debug(f"Service Name: [bold blue]{service_name}[/bold blue]")
        logger.debug(f"Service Type: [bold blue]{service_type}[/bold blue]")

        # Get claims
        claims = {}

        if service_type == AppType.APP_TYPE_MCP_SERVER:
            logger.debug(
                f"[bold green]Discovering MCP server for {service_name} at {url}[/bold green]"
            )

            # Discover the MCP server
            schema = asyncio.run(discover_mcp(service_name, url))

            claims["mcp"] = {
                "schema_base64": base64.b64encode(schema.encode("utf-8")),
            }
        elif service_type == AppType.APP_TYPE_AGENT_A2A:
            logger.debug(
                f"""[bold green]Discovering A2A agent for {service_name} at
                [bold blue]{url}[/bold blue][/bold green]"""
            )

            # Discover the A2A agent
            schema = discover_a2a(url)

            claims["a2a"] = {
                "schema_base64": base64.b64encode(schema.encode("utf-8")),
            }

        if not claims:
            raise ValueError(
                f"Unsupported service type: {service_type} for service {service_name}"
            )

        # Issue the badge
        self.get_badge_service().IssueBadge(
            request=IssueBadgeRequest(
                app_id=service_id, **claims
            )
        )

    async def issue_badge_async(
        self,
        url: str,
    ):
        """Issue a badge for an agentic service.

        Parameters:
            url (str): The URL of the agentic service to issue a badge for.
        """
        # Fetch the agentic service
        app_info = await self.get_auth_service().AppInfo(self.empty_request())

        # Get name and type
        service_name = app_info.app.name
        service_type = app_info.app.type
        service_id = app_info.app.id

        logger.debug(f"Service Name: [bold blue]{service_name}[/bold blue]")
        logger.debug(f"Service Type: [bold blue]{service_type}[/bold blue]")

        # Get claims
        claims = {}

        if service_type == AppType.APP_TYPE_MCP_SERVER:
            logger.debug(
                f"[bold green]Discovering MCP server for {service_name} at {url}[/bold green]"
            )

            # Discover the MCP server
            schema = await discover_mcp(service_name, url)

            claims["mcp"] = {
                "schema_base64": base64.b64encode(schema.encode("utf-8")),
            }
        elif service_type == AppType.APP_TYPE_AGENT_A2A:
            logger.debug(
                f"""[bold green]Discovering A2A agent for {service_name} at
                [bold blue]{url}[/bold blue][/bold green]"""
            )

            # Discover the A2A agent
            schema = await adiscover_a2a(url)

            claims["a2a"] = {
                "schema_base64": base64.b64encode(schema.encode("utf-8")),
            }

        if not claims:
            raise ValueError(
                f"Unsupported service type: {service_type} for service {service_name}"
            )

        # Issue the badge
        await self.get_badge_service().IssueBadge(
            request=IssueBadgeRequest(
                app_id=service_id, **claims
            )
        )
