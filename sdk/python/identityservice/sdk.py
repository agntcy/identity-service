# pylint: disable=logging-fstring-interpolation, no-member, no-name-in-module
# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0
"""Identity Service SDK for Python."""

import asyncio
import base64
import inspect
import logging
import os
from importlib import import_module
from pkgutil import iter_modules

import outshift.identity.service.v1alpha1
from dotenv import load_dotenv
from google.protobuf import empty_pb2
from outshift.identity.service.v1alpha1.app_pb2 import AppType

from identityservice import client
from identityservice.badge.a2a import adiscover as adiscover_a2a
from identityservice.badge.a2a import discover as discover_a2a
from identityservice.badge.mcp import discover as discover_mcp

logging.getLogger("identityservice").addHandler(logging.NullHandler())
logger = logging.getLogger("identityservice.sdk")


def _load_grpc_objects(module, path):
    """Load all the objects from the Python Identity SDK."""
    for _, modname, _ in iter_modules(module.__path__):
        # Import the module
        module = import_module(f"{path}.{modname}")
        # Inspect the module and set attributes on Identity SDK for each class found
        for name, obj in inspect.getmembers(module, inspect.isclass):
            setattr(IdentityServiceSdk, name, obj)


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

        # Load dynamically all objects
        _load_grpc_objects(
            outshift.identity.service.v1alpha1,
            "outshift.identity.service.v1alpha1",
        )

        self.client = client.Client(api_key, async_mode)

    def empty_request(self):
        """Return an empty request object."""
        return empty_pb2.Empty()

    def get_settings_service(
        self,
    ) -> "outshift.identity.service.v1alpha1.SettingsService":
        """Return the SettingsService stub."""
        return IdentityServiceSdk.SettingsServiceStub(self.client.channel)

    def get_app_service(
        self,
    ) -> "outshift.identity.service.v1alpha1.AppsService":
        """Return the AppService stub."""
        return IdentityServiceSdk.AppServiceStub(self.client.channel)

    def get_badge_service(
        self,
    ) -> "outshift.identity.service.v1alpha1.BadgeService":
        """Return the BadgeService stub."""
        return IdentityServiceSdk.BadgeServiceStub(self.client.channel)

    def get_auth_service(
        self,
    ) -> "outshift.identity.service.v1alpha1.AuthService":
        """Return the AuthService stub."""
        return IdentityServiceSdk.AuthServiceStub(self.client.channel)

    def access_token(
        self,
        agentic_service_id: str | None = None,
        tool_name: str | None = None,
        user_token: str | None = None,
    ) -> str | None:
        """Authorizes an agentic service and returns an access token.

        Parameters:
            agentic_service_id (str | None): The ID of the Agentic Service to authorize for.
            tool_name (str | None): The name of the tool to authorize for.
            user_token (str | None): The user token to use for the token.

        Returns:
            str: The issued access token.
        """
        try:
            auth_response = self.get_auth_service().Authorize(
                IdentityServiceSdk.AuthorizeRequest(
                    app_id=agentic_service_id,
                    tool_name=tool_name,
                    user_token=user_token,
                )
            )

            token_response = self.get_auth_service().Token(
                IdentityServiceSdk.TokenRequest(
                    authorization_code=auth_response.authorization_code,
                )
            )

            return token_response.access_token
        except Exception as e:
            raise RuntimeError(
                f"""Failed to authorize agentic service {agentic_service_id}
                with tool {tool_name}: {e}"""
            ) from e

    def authorize(self, access_token: str, tool_name: str | None = None):
        """Authorize an agentic service with an access token.

        Parameters:
            access_token (str): The access token to authorize with.
            tool_name (str | None): The name of the tool to authorize for.
        """
        return self.get_auth_service().ExtAuthz(
            IdentityServiceSdk.ExtAuthzRequest(
                access_token=access_token,
                tool_name=tool_name,
            )
        )

    def verify_badge(
        self, badge: str
    ) -> "outshift.identity.service.v1alpha1.VerificationResult":
        """Verify a badge.

        Parameters:
            badge (str): The badge to verify.

        Returns:
            VerificationResult: The result of the verification.
        """
        return self.get_badge_service().VerifyBadge(
            request=IdentityServiceSdk.VerifyBadgeRequest(badge=badge)
        )

    async def averify_badge(
        self, badge: str
    ) -> "outshift.identity.service.v1alpha1.VerificationResult":
        """Verify a badge using async method.

        Parameters:
            badge (str): The badge to verify.

        Returns:
            VerificationResult: The result of the verification.
        """
        return await self.get_badge_service().VerifyBadge(
            IdentityServiceSdk.VerifyBadgeRequest(badge=badge)
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

        if service_type == AppType.Value(
            "APP_TYPE_MCP_SERVER"
        ):  # APP_TYPE_MCP_SERVER
            logger.debug(
                f"[bold green]Discovering MCP server for {service_name} at {url}[/bold green]"
            )

            # Discover the MCP server
            schema = asyncio.run(discover_mcp(service_name, url))

            claims["mcp"] = {
                "schema_base64": base64.b64encode(schema.encode("utf-8")),
            }
        elif service_type == AppType.Value(
            "APP_TYPE_AGENT_A2A"
        ):  # APP_TYPE_AGENT_A2A
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
            request=IdentityServiceSdk.IssueBadgeRequest(
                app_id=service_id, **claims
            )
        )

    async def aissue_badge(
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

        if service_type == AppType.Value(
            "APP_TYPE_MCP_SERVER"
        ):  # APP_TYPE_MCP_SERVER
            logger.debug(
                f"[bold green]Discovering MCP server for {service_name} at {url}[/bold green]"
            )

            # Discover the MCP server
            schema = await discover_mcp(service_name, url)

            claims["mcp"] = {
                "schema_base64": base64.b64encode(schema.encode("utf-8")),
            }
        elif service_type == AppType.Value(
            "APP_TYPE_AGENT_A2A"
        ):  # APP_TYPE_AGENT_A2A
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
            request=IdentityServiceSdk.IssueBadgeRequest(
                app_id=service_id, **claims
            )
        )
