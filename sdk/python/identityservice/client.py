# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0
"""Client module for the Identity Service Python SDK."""

import base64
import logging
import os

import grpc
from dotenv import load_dotenv

from identityservice import constant

logger = logging.getLogger("identityservice.client")


class Client:  # pylint: disable=too-few-public-methods
    """Client class for the Identity Service Python SDK."""

    def __init__(self, api_key, async_mode=False):
        """Initialize the client."""
        load_dotenv()

        # Get credentials
        grpc_server_url = os.environ.get(
            "IDENTITY_SERVICE_GRPC_SERVER_URL", constant.DEFAULT_GRPC_URL
        )
        call_credentials = grpc.metadata_call_credentials(
            lambda _, callback: callback(
                ((constant.API_KEY_KEY, api_key),), None
            )
        )
        logger.debug("Connecting to %s", grpc_server_url)

        # Options
        options = [
            ("grpc.max_send_message_length", constant.GRPC_MAX_MESSAGE_LENGTH),
            (
                "grpc.max_receive_message_length",
                constant.GRPC_MAX_MESSAGE_LENGTH,
            ),
            ("grpc.keepalive_time_ms", constant.GRPC_KEEP_ALIVE_TIME_MS),
            (
                "grpc.http2.max_pings_without_data",
                constant.GRPC_HTTP2_MAX_PINGS_WITHOUT_DATA,
            ),
            (
                "grpc.keepalive_permit_without_calls",
                constant.GRPC_KEEP_ALIVE_PERMIT_WITHOUT_CALLS,
            ),
        ]

        # Get credentials type
        use_ssl = int(os.environ.get("IDENTITY_SERVICE_USE_SSL", 1))
        use_insecure = int(os.environ.get("IDENTITY_SERVICE_USE_INSECURE", 0))

        logger.debug("Using SSL: %s, Insecure: %s", use_ssl, use_insecure)

        channel_credentials = grpc.local_channel_credentials()
        if use_ssl == 1:
            if use_insecure == 1:
                root_cert = base64.b64decode(
                    os.environ["IDENTITY_SERVICE_INSECURE_ROOT_CA"]
                )
                channel_credentials = grpc.ssl_channel_credentials(
                    root_certificates=root_cert
                )
            else:
                channel_credentials = grpc.ssl_channel_credentials()
        else:
            logger.debug("Using local credentials")

        # Set if async
        secure_channel = (
            grpc.aio.secure_channel if async_mode else grpc.secure_channel
        )

        self.channel = secure_channel(
            grpc_server_url,
            grpc.composite_channel_credentials(
                channel_credentials, call_credentials
            ),
            options=options,
        )
