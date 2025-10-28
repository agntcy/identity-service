# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Contains the custom exceptions raised by the SDK."""

from typing import Any, Dict, Optional


class SdkError(Exception):
    """
    A custom SDK exception raised when a domain
    logic fails or as a wrapper for other exceptions.
    """

    def __init__(
        self,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
        inner_exception: Optional[Exception] = None,
    ):
        """Initialize the SdkError object."""
        self.message = message
        self.metadata = metadata
        self.inner_exception = inner_exception
        super().__init__(self.message)
