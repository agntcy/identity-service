# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Tests for A2A security scheme validation in the Starlette middleware."""

from unittest.mock import patch

import pytest
from a2a.types import AgentCard, HTTPAuthSecurityScheme, SecurityScheme
from starlette.applications import Starlette

from identityservice.auth.starlette import IdentityServiceA2AMiddleware


@pytest.mark.skipif(
    not hasattr(SecurityScheme, "DESCRIPTOR"),
    reason="a2a-sdk 0.x uses Pydantic security schemes",
)
@pytest.mark.parametrize(
    ("scheme", "bearer_format", "expected_error"),
    [
        ("bearer", "JWT", None),
        ("basic", "JWT", "bearer token scheme"),
        ("bearer", "opaque", "JWT bearer format"),
    ],
)
def test_a2a_protobuf_security_scheme(scheme, bearer_format, expected_error):
    """Validate bearer JWT settings in current protobuf A2A agent cards."""
    card = AgentCard(
        security_schemes={
            "auth": SecurityScheme(
                http_auth_security_scheme=HTTPAuthSecurityScheme(
                    scheme=scheme, bearer_format=bearer_format
                )
            )
        }
    )

    with patch("identityservice.auth.starlette.Sdk"):
        if expected_error:
            with pytest.raises(ValueError, match=expected_error):
                IdentityServiceA2AMiddleware(Starlette(), agent_card=card)
        else:
            IdentityServiceA2AMiddleware(Starlette(), agent_card=card)
