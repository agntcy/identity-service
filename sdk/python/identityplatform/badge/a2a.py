# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""MCP Discover for the Identity Service Python SDK."""

import httpx

A2A_WELL_KNOWN_URL = "/.well-known/agent.json"


def discover(well_known_url):
    """Fetch the agent card from the well-known URL."""

    # Ensure the URL ends with a trailing slash
    if not well_known_url.endswith(A2A_WELL_KNOWN_URL):
        well_known_url = well_known_url.rstrip("/") + A2A_WELL_KNOWN_URL

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
