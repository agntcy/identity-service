# pylint: disable=broad-exception-raised
# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0
"""MCP Discover for the Identity Service Python SDK."""

import logging

import httpx

A2A_WELL_KNOWN_URL_V2 = "/.well-known/agent.json"
A2A_WELL_KNOWN_URL_V3 = "/.well-known/agent-card.json"

logger = logging.getLogger("identityservice.badge.a2a")


def discover(well_known_url):
    """Fetch the agent card from the well-known URL."""
    # Try V3 first, then fallback to V2
    try:
        return _discover(well_known_url, A2A_WELL_KNOWN_URL_V3)
    except Exception:  # pylint: disable=broad-except
        logger.warning("Failed to fetch V3 agent card, falling back to V2")

        return _discover(well_known_url, A2A_WELL_KNOWN_URL_V2)


async def adiscover(well_known_url):
    """Fetch the agent card from the well-known URL asynchronously."""
    # Try V3 first, then fallback to V2
    try:
        return await _adiscover(well_known_url, A2A_WELL_KNOWN_URL_V3)
    except Exception:  # pylint: disable=broad-except
        logger.warning("Failed to fetch V3 agent card, falling back to V2")

        return await _adiscover(well_known_url, A2A_WELL_KNOWN_URL_V2)


def _discover(well_known_url, url):
    """Fetch the agent card from the well-known URL."""
    # Ensure the URL ends with a trailing slash
    if not well_known_url.endswith(url):
        well_known_url = well_known_url.rstrip("/") + url

    try:
        # Perform the GET request
        response = httpx.get(well_known_url)

        # Check if the status code is OK
        if response.status_code != 200:
            raise Exception(
                f"Failed to get agent card with status code: {response.status_code}"
            )

        # Return the response body as a string
        return response.text

    except Exception as e:
        # Handle exceptions and re-raise them
        raise e


async def _adiscover(well_known_url, url):
    """Fetch the agent card from the well-known URL."""
    # Ensure the URL ends with a trailing slash
    if not well_known_url.endswith(url):
        well_known_url = well_known_url.rstrip("/") + url

    try:
        # Perform the GET request
        async with httpx.AsyncClient() as client:
            response = await client.get(well_known_url)

            # Check if the status code is OK
            if response.status_code != 200:
                raise Exception(
                    f"Failed to get agent card with status code: {response.status_code}"
                )

            # Return the response body as a string
            return response.text
    except Exception as e:
        # Handle exceptions and re-raise them
        raise e
