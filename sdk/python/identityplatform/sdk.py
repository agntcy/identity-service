# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Identity Platform SDK for Python."""

import inspect
import logging
import os
from importlib import import_module
from pkgutil import iter_modules

import agntcy.identity.platform.v1alpha1
from dotenv import load_dotenv
from google.protobuf import empty_pb2

from identityplatform import client, log

logger = logging.getLogger("identity")

if os.getenv("IDENTITY_ENABLE_LOGS", "0") == "1":
    load_dotenv()
    log.configure()


def _load_grpc_objects(module, path):
    """Load all the objects from the Python Identity SDK."""
    for _, modname, _ in iter_modules(module.__path__):
        # Import the module
        module = import_module(f"{path}.{modname}")
        # Inspect the module and set attributes on Identity SDK for each class found
        for name, obj in inspect.getmembers(module, inspect.isclass):
            setattr(IdentityPlatformSdk, name, obj)


class IdentityPlatformSdk:
    """Identity Platform SDK for Python."""

    def __init__(self, api_key, async_mode=False):
        """Initialize the Identity Platform SDK."""
        # Load dynamically all objects
        _load_grpc_objects(agntcy.identity.platform.v1alpha1,
                           "agntcy.identity.platform.v1alpha1")

        self.client = client.Client(api_key, async_mode)

    def empty_request(self):
        """Return an empty request object."""
        return empty_pb2.Empty()

    def get_app_service(
            self) -> "agntcy.identity.platform.v1alpha1.AppsService":
        return IdentityPlatformSdk.AppServiceStub(self.client.channel)

    def get_badge_service(
            self) -> "agntcy.identity.platform.v1alpha1.BadgeService":
        return IdentityPlatformSdk.BadgeServiceStub(self.client.channel)

    def get_auth_service(
            self) -> "agntcy.identity.platform.v1alpha1.AuthService":
        return IdentityPlatformSdk.AuthServiceStub(self.client.channel)

    def verify_badge(self, badge: str) -> str:
        """Verify a badge."""
        return self.get_badge_service().VerifyBadge(
            request=IdentityPlatformSdk.VerifyBadgeRequest(badge=badge)).badge
