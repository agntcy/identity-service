# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""MCP Discover for the Identity Platform Python SDK."""

import requests


def discover(well_known_url):
    """Fetch the agent card from the well-known URL."""

    try:
        # Perform the GET request
        response = requests.get(well_known_url)

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
