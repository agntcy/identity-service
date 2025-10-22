# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Unit tests for identityservice.badge.a2a."""

from unittest.mock import AsyncMock, MagicMock, patch
from urllib.parse import urljoin

import httpx
import pytest

from identityservice.badge.a2a import (
    A2A_WELL_KNOWN_URL_V2,
    A2A_WELL_KNOWN_URL_V3,
    discover,
)
from identityservice.exceptions import SdkError


@pytest.mark.asyncio
async def test_discover_success_with_v3():
    """Test successful discovery using v3 agent card."""
    # Arrange
    base_url = "https://some_url"
    expected_response = '{"version": "3.0", "agent": "test-agent"}'

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = expected_response

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    # Act
    with _patch_http_client(mock_client):
        actual = await discover(base_url)

    # Assert
    assert actual == expected_response
    mock_client.get.assert_called_once_with(
        f"{base_url}{A2A_WELL_KNOWN_URL_V3}"
    )


@pytest.mark.asyncio
async def test_discover_fallback_to_v2():
    """Test fallback to v2 when v3 fails."""
    # Arrange
    base_url = "https://some_url"
    v2_response = '{"version": "2.0", "agent": "test-agent"}'

    # Mock v3 failure
    mock_v3_response = MagicMock()
    mock_v3_response.status_code = 404

    # Mock v2 success
    mock_v2_response = MagicMock()
    mock_v2_response.status_code = 200
    mock_v2_response.text = v2_response

    mock_client = AsyncMock()
    # First call fails (v3), second call succeeds (v2)
    mock_client.get = AsyncMock(
        side_effect=[Exception("v3 not found"), mock_v2_response]
    )
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    # Act
    with _patch_http_client(mock_client):
        actual = await discover(base_url)

    # Assert
    assert actual == v2_response
    assert mock_client.get.call_count == 2
    mock_client.get.assert_called_with(f"{base_url}{A2A_WELL_KNOWN_URL_V2}")


@pytest.mark.asyncio
async def test_discover_both_versions_fail():
    """Test when both V3 and V2 fail."""
    # Arrange
    base_url = "https://some_url"

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(side_effect=Exception("Connection failed"))
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    # Act & Assert
    with _patch_http_client(mock_client):
        with pytest.raises(SdkError) as exc_info:
            await discover(base_url)

        assert "Connection failed" in str(exc_info.value)


@pytest.mark.asyncio
async def test_discover_url_formatting():
    """Test that discover correctly formats URLs."""
    # Arrange
    test_cases = [
        "https://some_url",
        "https://some_url/",
        "https://some_url/.well-known/agent-card.json",
    ]

    expected_response = '{"agent": "test"}'
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = expected_response

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    for input_url in test_cases:
        # Act
        with _patch_http_client(mock_client):
            result = await discover(input_url)

        # Assert
        assert result == expected_response
        mock_client.get.assert_called_with(
            urljoin("https://some_url", A2A_WELL_KNOWN_URL_V3)
        )
        mock_client.get.reset_mock()


@pytest.mark.asyncio
async def test_discover_non_200_status():
    """Test discover raises exception for non-200 status codes."""
    # Arrange
    base_url = "https://some_url"

    mock_response = MagicMock()
    mock_response.status_code = 400

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    # Act & Assert
    with _patch_http_client(mock_client):
        with pytest.raises(Exception) as exc_info:
            await discover(base_url)

        assert "Failed to get agent card with status code: 400" in str(
            exc_info.value
        )


@pytest.mark.asyncio
async def test_discover_error():
    """Test discover handles errors."""
    # Arrange
    test_cases = [
        httpx.ConnectError("Network unreachable"),
        httpx.TimeoutException("Request timeout"),
    ]
    base_url = "https://some_url"

    for in_err in test_cases:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(side_effect=in_err)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)

        # Act
        with _patch_http_client(mock_client):
            with pytest.raises(SdkError) as ex:
                await discover(base_url)

        # Assert
        assert ex.value.inner_exception == in_err


def _patch_http_client(mock_client: AsyncMock):
    return patch("httpx.AsyncClient", return_value=mock_client)
