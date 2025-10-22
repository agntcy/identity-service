# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Unit tests for identityservice.badge.mcp."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pydantic
import pytest

from identityservice.badge.mcp import MCP_SUFFIX, discover
from identityservice.exceptions import SdkError


@pytest.mark.asyncio
async def test_discover_should_return_tools_and_resources():
    """Test successful discovery of MCP server with tools and resources."""
    # Arrange
    server_name = "test-server"
    base_url = "http://some_url/api"
    expected_url = f"{base_url}{MCP_SUFFIX}"

    mock_tool = MagicMock()
    mock_tool.name = "test_tool"
    mock_tool.description = "A test tool"
    mock_tool.inputSchema = {
        "type": "object",
        "properties": {"param1": {"type": "string"}},
    }

    mock_tools_response = MagicMock()
    mock_tools_response.tools = [mock_tool]

    mock_resource = MagicMock()
    mock_resource.name = "test_resource"
    mock_resource.description = "A test resource"
    mock_resource.uri = pydantic.AnyUrl("resource://test")

    mock_resources_response = MagicMock()
    mock_resources_response.resources = [mock_resource]

    mock_session = AsyncMock()
    mock_session.initialize = AsyncMock()
    mock_session.list_tools = AsyncMock(return_value=mock_tools_response)
    mock_session.list_resources = AsyncMock(
        return_value=mock_resources_response
    )
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(
        return_value=(MagicMock(), MagicMock(), None)
    )
    mock_client.__aexit__ = AsyncMock(return_value=None)

    # Act
    with _patch_streamablehttp_client(mock_client):
        with _patch_client_session(mock_session):
            actual = await discover(server_name, base_url)

    # Assert
    result_dict = json.loads(actual)
    assert result_dict["name"] == server_name
    assert result_dict["url"] == expected_url
    assert len(result_dict["tools"]) == 1
    assert result_dict["tools"][0]["name"] == "test_tool"
    assert result_dict["tools"][0]["description"] == "A test tool"
    assert len(result_dict["resources"]) == 1
    assert result_dict["resources"][0]["name"] == "test_resource"
    assert result_dict["resources"][0]["uri"] == "resource://test"


@pytest.mark.asyncio
async def test_discover_url_formatting():
    """Test that URLs are correctly formatted with MCP_SUFFIX."""
    # Arrange
    test_cases = [
        ("http://some_url", "http://some_url/mcp"),
        ("http://some_url/", "http://some_url/mcp"),
        ("http://some_url/mcp", "http://some_url/mcp"),
    ]

    # Mock responses
    mock_tools_response = MagicMock()
    mock_tools_response.tools = []
    mock_resources_response = MagicMock()
    mock_resources_response.resources = []

    mock_session = AsyncMock()
    mock_session.initialize = AsyncMock()
    mock_session.list_tools = AsyncMock(return_value=mock_tools_response)
    mock_session.list_resources = AsyncMock(
        return_value=mock_resources_response
    )
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(
        return_value=(MagicMock(), MagicMock(), None)
    )
    mock_client.__aexit__ = AsyncMock(return_value=None)

    for input_url, expected_url in test_cases:
        # Act
        with _patch_streamablehttp_client(mock_client):
            with _patch_client_session(mock_session):
                result = await discover("test-server", input_url)

        # Assert
        result_dict = json.loads(result)
        assert result_dict["url"] == expected_url, (
            f"Failed for input: {input_url}"
        )


@pytest.mark.asyncio
async def test_discover_exception_group():
    """Test that discover raises SdkError exception when discovery fails with an ExceptionGroup."""
    # Arrange
    server_name = "test-server"
    base_url = "http://some_url"

    # Mock client to raise exception
    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(
        side_effect=ExceptionGroup("", [ConnectionError("Connection failed")])
    )

    # Act & Assert
    with _patch_streamablehttp_client(mock_client):
        with pytest.raises(SdkError) as exc_info:
            await discover(server_name, base_url)

        assert "Connection failed" in str(exc_info.value)
        assert isinstance(exc_info.value.inner_exception, ExceptionGroup)


@pytest.mark.asyncio
async def test_discover_general_error():
    """Test that discover raises SdkError exception when catching non ExceptionGroup exception."""
    # Arrange
    server_name = "test-server"
    base_url = "http://some_url"

    # Mock client to raise exception
    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(
        side_effect=ConnectionError("Connection failed")
    )

    # Act & Assert
    with _patch_streamablehttp_client(mock_client):
        with pytest.raises(SdkError) as exc_info:
            await discover(server_name, base_url)

        assert "MCP server discovery failed" in str(exc_info.value)
        assert "Connection failed" in str(exc_info.value.inner_exception)
        assert isinstance(exc_info.value.inner_exception, ConnectionError)


@pytest.mark.asyncio
async def test_discover_empty_tools_and_resources():
    """Test discovery when server has no tools or resources."""
    # Arrange
    server_name = "empty-server"
    base_url = "http://some_url"

    # Mock empty responses
    mock_tools_response = MagicMock()
    mock_tools_response.tools = []
    mock_resources_response = MagicMock()
    mock_resources_response.resources = []

    mock_session = AsyncMock()
    mock_session.initialize = AsyncMock()
    mock_session.list_tools = AsyncMock(return_value=mock_tools_response)
    mock_session.list_resources = AsyncMock(
        return_value=mock_resources_response
    )
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(
        return_value=(MagicMock(), MagicMock(), None)
    )
    mock_client.__aexit__ = AsyncMock(return_value=None)

    # Act
    with _patch_streamablehttp_client(mock_client):
        with _patch_client_session(mock_session):
            result = await discover(server_name, base_url)

    # Assert
    result_dict = json.loads(result)
    assert result_dict["name"] == server_name
    assert len(result_dict["tools"]) == 0
    assert len(result_dict["resources"]) == 0


def _patch_streamablehttp_client(mock_client: AsyncMock):
    return patch(
        "identityservice.badge.mcp.streamablehttp_client",
        return_value=mock_client,
    )


def _patch_client_session(mock_session: AsyncMock):
    return patch(
        "identityservice.badge.mcp.ClientSession", return_value=mock_session
    )
