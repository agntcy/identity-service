# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
# pylint: disable=redefined-outer-name
"""Integration tests for IdentityServiceSdk."""

from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import grpc
import pytest
from google.protobuf.empty_pb2 import Empty  # pylint: disable=no-name-in-module

from agntcy.identity.service.v1alpha1.app_pb2 import App, AppType
from agntcy.identity.service.v1alpha1.auth_service_pb2 import (
    AppInfoResponse,
    AuthorizeResponse,
    TokenResponse,
)
from agntcy.identity.service.v1alpha1.auth_service_pb2_grpc import (
    AuthServiceStub,
)
from agntcy.identity.service.v1alpha1.badge_pb2 import VerificationResult
from agntcy.identity.service.v1alpha1.badge_service_pb2_grpc import (
    BadgeServiceStub,
)
from identityservice.sdk import IdentityServiceSdk


@pytest.fixture
def sdk_with_mock_client() -> IdentityServiceSdk:
    """Create SDK instance with mock client."""
    sdk = IdentityServiceSdk(api_key="api_key")
    sdk.client.channel = MagicMock()
    return sdk


class TestAuthorize:
    """Test authorize method."""

    def test_authorize_success(self, sdk_with_mock_client: IdentityServiceSdk):
        """Test authorize should succeed."""
        with _patch_grpc_service_stub(AuthServiceStub, {"ExtAuthz": Empty()}):
            ret = sdk_with_mock_client.authorize("token")

        assert isinstance(ret, Empty)

    def test_authorize_fail(self, sdk_with_mock_client: IdentityServiceSdk):
        """Test authorize should throw grpc.RpcError."""
        with _patch_grpc_service_stub_with_error(
            AuthServiceStub, {"ExtAuthz": grpc.RpcError()}
        ):
            with pytest.raises(grpc.RpcError) as ext_info:
                sdk_with_mock_client.authorize("token")

            assert isinstance(ext_info.value, grpc.RpcError)


class TestVerifyBadge:
    """Test verify_badge method."""

    def test_verify_badge_success(
        self, sdk_with_mock_client: IdentityServiceSdk
    ):
        """Test verify_badge should succeed."""
        result = VerificationResult()
        result.status = True
        result.controller = "controller"

        with _patch_grpc_service_stub(
            BadgeServiceStub, {"VerifyBadge": result}
        ):
            actual = sdk_with_mock_client.verify_badge("badge")

        assert actual == result

    def test_verify_badge_fail(self, sdk_with_mock_client: IdentityServiceSdk):
        """Test verify_badge should throw grpc.RpcError."""
        with _patch_grpc_service_stub_with_error(
            BadgeServiceStub, {"VerifyBadge": grpc.RpcError()}
        ):
            with pytest.raises(grpc.RpcError) as ext_info:
                sdk_with_mock_client.verify_badge("badge")

            assert isinstance(ext_info.value, grpc.RpcError)


class TestAccessToken:
    """Test access_token method."""

    def test_access_token_success(
        self, sdk_with_mock_client: IdentityServiceSdk
    ):
        """Test access_token should succeed."""
        token = "access_token"

        with _patch_grpc_service_stub(
            AuthServiceStub,
            {
                "Authorize": AuthorizeResponse(authorization_code="auth_code"),
                "Token": TokenResponse(access_token=token),
            },
        ):
            actual = sdk_with_mock_client.access_token("id")

        assert actual == token

    def test_access_token_fail(self, sdk_with_mock_client: IdentityServiceSdk):
        """Test access_token should throw grpc.RpcError."""
        token = "access_token"

        with _patch_grpc_service_stub_with_error(
            AuthServiceStub, {"Authorize": grpc.RpcError()}
        ):
            with pytest.raises(grpc.RpcError) as ext_info:
                sdk_with_mock_client.access_token(token)

        assert isinstance(ext_info.value, grpc.RpcError)


@pytest.fixture
def mock_a2a_client():
    """A fixture that creates a mock A2A client."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = '{"version": "3.0", "agent": "test-agent"}'

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    return mock_client


class TestIssueBadge:
    """Test issue_badge method."""

    def test_issue_badge_success(
        self, mock_a2a_client, sdk_with_mock_client: IdentityServiceSdk
    ):
        """Test issue_badge should succeed."""
        url = "http://some_url"

        with _patch_http_client(mock_a2a_client):
            with _patch_grpc_service_stub(
                AuthServiceStub,
                {
                    "AppInfo": AppInfoResponse(
                        app=App(type=AppType.APP_TYPE_AGENT_A2A)
                    ),
                },
            ):
                badge = sdk_with_mock_client.issue_badge(url)

        assert badge is not None

    def test_issue_badge_fail(self, sdk_with_mock_client: IdentityServiceSdk):
        """Test issue_badge should throw grpc.RpcError."""
        url = "http://some_url"

        with _patch_grpc_service_stub_with_error(
            AuthServiceStub, {"AppInfo": grpc.RpcError()}
        ):
            with pytest.raises(grpc.RpcError) as ext_info:
                sdk_with_mock_client.issue_badge(url)

        assert isinstance(ext_info.value, grpc.RpcError)


def _patch_grpc_service_stub(target: Any, attrs: dict[str, Any]):
    def _factory(self, _):
        for fn, ret in attrs.items():
            setattr(self, fn, MagicMock(return_value=ret))

    return patch.object(target, "__init__", _factory)


def _patch_grpc_service_stub_with_error(
    target: Any, attrs: dict[str, grpc.RpcError]
):
    def _factory(self, _):
        for fn, ret in attrs.items():
            setattr(self, fn, MagicMock(side_effect=ret))

    return patch.object(target, "__init__", _factory)


def _patch_http_client(mock_client: AsyncMock):
    return patch("httpx.AsyncClient", return_value=mock_client)
