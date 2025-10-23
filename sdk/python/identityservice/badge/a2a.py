# pylint: disable=broad-exception-raised
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""MCP Discover for the Identity Service Python SDK."""

import logging
from urllib.parse import urljoin

import httpx

from identityservice.exceptions import SdkError

A2A_WELL_KNOWN_URL_V2 = "/.well-known/agent.json"
A2A_WELL_KNOWN_URL_V3 = "/.well-known/agent-card.json"

logger = logging.getLogger("identityservice.badge.a2a")


async def discover(well_known_url: str) -> str:
    """Fetch the agent card from the well-known URL asynchronously."""
    # Try V3 first, then fallback to V2
    try:
        return await _discover(well_known_url, A2A_WELL_KNOWN_URL_V3)
    except Exception:  # pylint: disable=broad-except
        logger.warning("Failed to fetch V3 agent card, falling back to V2")

        return await _discover(well_known_url, A2A_WELL_KNOWN_URL_V2)


async def _discover(well_known_url: str, url: str) -> str:
    """Fetch the agent card from the well-known URL."""
    # Ensure the URL ends with a trailing slash
    if not well_known_url.endswith(url):
        well_known_url = urljoin(well_known_url, url)

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(well_known_url)

            if response.status_code != 200:
                raise Exception(
                    f"Failed to get agent card with status code: {response.status_code}"
                )

            return response.text
    except Exception as e:
        raise SdkError(
            f"A2A client: {e}",
            metadata={"wellKnownUrl": well_known_url},
            inner_exception=e,
        ) from e
