# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Generates the badge claims based on the service type."""

import base64
import logging

from agntcy.identity.service.v1alpha1.app_pb2 import AppType
from identityservice.badge import a2a
from identityservice.badge import mcp
from identityservice.badge import oasf
from identityservice.exceptions import SdkError

logger = logging.getLogger(__name__)


async def create_claims(url: str, service_name: str, service_type: AppType):
    """Create the input claims for a badge based on the service type."""
    logger.debug("Service Name: [bold blue]%s[/bold blue]", service_name)
    logger.debug("Service Type: [bold blue]%s[/bold blue]", service_type)

    # Get claims
    claims = {}

    if service_type == AppType.APP_TYPE_MCP_SERVER:
        logger.debug(
            "[bold green]Discovering MCP server for %s at %s[/bold green]",
            service_name,
            url,
        )

        # Discover the MCP server
        schema = await mcp.discover(service_name, url)

        claims["mcp"] = {
            "schema_base64": base64.b64encode(schema.encode("utf-8")),
        }
    elif service_type == AppType.APP_TYPE_AGENT_A2A:
        logger.debug(
            "[bold green]Discovering A2A agent for %s at [bold blue]%s[/bold blue][/bold green]",
            service_name,
            url,
        )

        # Discover the A2A agent
        schema = await a2a.discover(url)

        claims["a2a"] = {
            "schema_base64": base64.b64encode(schema.encode("utf-8")),
        }
    elif service_type == AppType.APP_TYPE_AGENT_OASF:
        logger.debug(
            "[bold green]Processing OASF agent for %s at [bold blue]%s[/bold blue][/bold green]",
            service_name,
            url,
        )

        # For OASF, we assume the URL is a path to the OASF JSON file
        schema = oasf.discover(url)

        claims["oasf"] = {
            "schema_base64": base64.b64encode(schema.encode("utf-8")),
        }

    if not claims:
        raise SdkError(
            f"Unsupported service type: {service_type} for service {service_name}"
        )

    return claims
