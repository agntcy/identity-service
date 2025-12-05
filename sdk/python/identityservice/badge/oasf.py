# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""OASF agent discovery utilities for badge claims generation."""

import os

from identityservice.exceptions import SdkError


def discover(url: str) -> str:
    """Load an OASF schema from a local JSON file.

    For OASF, we assume ``url`` is a path to the OASF JSON file that
    should be used when issuing a badge.
    """

    if not os.path.isfile(url):
        raise SdkError(f"OASF schema file not found at path: {url}")

    if os.path.getsize(url) == 0:
        raise SdkError(f"OASF schema file is empty at path: {url}")

    with open(url, "r", encoding="utf-8") as file:
        return file.read()
