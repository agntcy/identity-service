# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Unit tests for identityservice.badge.claims."""

import base64
import json
from unittest.mock import AsyncMock, patch

import pytest

from agntcy.identity.service.v1alpha1.app_pb2 import AppType
from identityservice.badge.claims import create_claims
from identityservice.exceptions import SdkError


@pytest.mark.asyncio
async def test_create_claims_for_mcp_server():
    """Test create_claims for MCP server."""
    # Arrange
    service_url = "http://some_url"
    service_name = "test-mcp-server"
    service_type = AppType.APP_TYPE_MCP_SERVER
    mcp_schema = json.dumps({"tools": [], "resources": []})
    expected_schema = base64.b64encode(mcp_schema.encode("utf-8"))

    # Act
    with patch(
        "identityservice.badge.mcp.discover",
        new_callable=AsyncMock,
        return_value=mcp_schema,
    ) as mock_mcp_discover:
        claims = await create_claims(service_url, service_name, service_type)

    # Assert
    mock_mcp_discover.assert_called_once_with(service_name, service_url)
    assert "mcp" in claims
    assert claims["mcp"]["schema_base64"] == expected_schema


@pytest.mark.asyncio
async def test_create_claims_for_a2a_agent():
    """Test create_claims for A2A agent."""
    # Arrange
    service_url = "http://some_url"
    service_type = AppType.APP_TYPE_AGENT_A2A
    a2a_schema = json.dumps({"version": "3.0", "name": "Test Agent"})
    expected_schema = base64.b64encode(a2a_schema.encode("utf-8"))

    # Act
    with patch(
        "identityservice.badge.a2a.discover",
        new_callable=AsyncMock,
        return_value=a2a_schema,
    ) as mock_a2a_discover:
        claims = await create_claims(service_url, "", service_type)

    # Assert
    mock_a2a_discover.assert_called_once_with(service_url)
    assert "a2a" in claims
    assert claims["a2a"]["schema_base64"] == expected_schema


@pytest.mark.asyncio
async def test_create_claims_for_oasf_agent():
    """Test create_claims for OASF agent."""
    # Arrange
    service_url = "/path/to/oasf.json"
    service_type = AppType.APP_TYPE_AGENT_OASF
    oasf_schema = json.dumps({"version": "1.0.0", "name": "Test OASF Agent"})
    expected_schema = base64.b64encode(oasf_schema.encode("utf-8"))

    # Act
    with patch(
        "identityservice.badge.oasf.discover",
        return_value=oasf_schema,
    ) as mock_oasf_discover:
        claims = await create_claims(service_url, "", service_type)

    # Assert
    mock_oasf_discover.assert_called_once_with(service_url)
    assert "oasf" in claims
    assert claims["oasf"]["schema_base64"] == expected_schema


@pytest.mark.asyncio
async def test_create_claims_for_unsupported_service_type():
    """Test create_claims for unsupported service type should fail."""
    # Arrange
    service_url = "http://some_url"
    service_name = "some_app"
    invalid_service_type = AppType.APP_TYPE_UNSPECIFIED

    # Act
    with pytest.raises(SdkError) as exc_info:
        await create_claims(service_url, service_name, invalid_service_type)

    # Assert
    assert "Unsupported service type" in str(exc_info.value)
    assert service_name in str(exc_info.value)
