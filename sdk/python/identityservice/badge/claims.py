# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Generates the badge claims based on the service type."""

import base64
import logging

import identityservice.badge.a2a as a2a
import identityservice.badge.mcp as mcp
from agntcy.identity.service.v1alpha1.app_pb2 import AppType
from identityservice.exceptions import SdkError

logger = logging.getLogger(__name__)


async def create_claims(url: str, service_name: str, service_type: str):
    """Create the input claims for a badge based on the service type."""
    logger.debug(f"Service Name: [bold blue]{service_name}[/bold blue]")
    logger.debug(f"Service Type: [bold blue]{service_type}[/bold blue]")

    # Get claims
    claims = {}

    if service_type == AppType.APP_TYPE_MCP_SERVER:
        logger.debug(
            f"[bold green]Discovering MCP server for {service_name} at {url}[/bold green]"
        )

        # Discover the MCP server
        schema = await mcp.discover(service_name, url)

        claims["mcp"] = {
            "schema_base64": base64.b64encode(schema.encode("utf-8")),
        }
    elif service_type == AppType.APP_TYPE_AGENT_A2A:
        logger.debug(
            f"""[bold green]Discovering A2A agent for {service_name} at
            [bold blue]{url}[/bold blue][/bold green]"""
        )

        # Discover the A2A agent
        schema = await a2a.discover(url)

        claims["a2a"] = {
            "schema_base64": base64.b64encode(schema.encode("utf-8")),
        }

    if not claims:
        raise SdkError(
            f"Unsupported service type: {service_type} for service {service_name}"
        )

    return claims
