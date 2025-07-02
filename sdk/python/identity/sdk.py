# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Identity SDK for Python."""

import inspect
import logging
import os
from importlib import import_module
from pkgutil import iter_modules

import jwt
from dotenv import load_dotenv

import agntcy.identity.core.v1alpha1
import agntcy.identity.node.v1alpha1
from agntcy.identity.core.v1alpha1.vc_pb2 import (
    EnvelopedCredential,
    VerifiableCredential,
)
from agntcy.identity.node.v1alpha1.vc_service_pb2 import (
    GetVcWellKnownRequest,
    GetVcWellKnownResponse,
    VerifyRequest,
)
from agntcy.identity.node.v1alpha1.vc_service_pb2_grpc import VcServiceStub
from agntcyidentity import client, log

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
            setattr(IdentitySdk, name, obj)


class IdentitySdk:
    """Identity SDK for Python."""

    def __init__(self, async_mode=False):
        """Initialize the Identity SDK."""
        # Load dynamically all objects
        _load_grpc_objects(
            agntcy.identity.node.v1alpha1, "agntcy.identity.node.v1alpha1"
        )
        _load_grpc_objects(
            agntcy.identity.core.v1alpha1, "agntcy.identity.core.v1alpha1"
        )

        self.client = client.Client(async_mode)

    def _get_vc_service(self) -> VcServiceStub:
        """Get the vc service."""
        return VcServiceStub(self.client.channel)

    def get_badge(self, badge_id: str) -> EnvelopedCredential:
        """Returns last badge for a given ID."""
        well_known_response: GetVcWellKnownResponse = (
            self._get_vc_service().GetWellKnown(
                GetVcWellKnownRequest(id=badge_id)
            )
        )

        if not well_known_response.vcs:
            raise ValueError("No badge found for ID: ", badge_id)

        return well_known_response.vcs[0]

    def verify_badge(self, badge: EnvelopedCredential) -> VerifiableCredential:
        """Verify a badge."""
        try:
            self._get_vc_service().Verify(VerifyRequest(vc=badge))
        except Exception as err:
            raise err

        # Decode the badge value to get the claims
        claims = jwt.decode(badge.value, options={"verify_signature": False})

        return VerifiableCredential(
            id=claims["id"],
            type=claims["type"],
            issuer=claims["issuer"],
            content=claims["credentialSubject"],
        )
