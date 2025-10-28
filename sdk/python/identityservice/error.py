# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Contains the different functions to handle errors and exceptions."""

import json
from typing import Dict

import grpc
from grpc_status import rpc_status

from rich.console import Console
from rich.emoji import Emoji
from rich.panel import Panel
from rich.text import Text

from google.rpc.status_pb2 import Status  # type: ignore
from google.rpc import error_details_pb2  # type: ignore

from identityservice.exceptions import SdkError

err_console = Console(stderr=True, style="bold red")


def handle_grpc_error(rpc_error: grpc.RpcError):
    """Handle the gRPC errors raised by the Identity Service gRPC client."""
    status: Status = rpc_status.from_call(rpc_error)  # type: ignore
    grpc_status = _get_grpc_status(rpc_error)
    response_metadata = _get_grpc_response_headers(rpc_error)  # type: ignore
    if status is None:
        _print_error(
            rpc_error.details(),
            grpc_status=grpc_status,
            metadata=response_metadata,
        )
    else:
        for detail in status.details:
            if detail.Is(error_details_pb2.ErrorInfo.DESCRIPTOR):
                info = error_details_pb2.ErrorInfo()
                detail.Unpack(info)

                metadata = dict(
                    {"reason": info.reason},
                    **info.metadata,
                    **response_metadata,
                )
                _print_error(status.message, metadata=metadata)


def handle_cli_error(cli_error: SdkError):
    """Handle the SdkError exceptions raised by the SDK."""
    _print_error(cli_error.message, metadata=cli_error.metadata)


def handle_generic_error(error: Exception):
    """Handle the generic exceptions raised by the SDK."""
    raise error


def _get_grpc_status(rpc_error: grpc.RpcError) -> str:
    return rpc_error.code().value[-1]


def _get_grpc_response_headers(call: grpc.Call) -> Dict[str, str]:
    # We only care about the x-request-id
    return {
        md.key: md.value  # type: ignore
        for md in call.initial_metadata()
        if md.key.lower() == "x-request-id"  # type: ignore
    }


def _print_error(
    msg: str | None,
    grpc_status: str | None = None,
    metadata: Dict[str, str] | None = None,
):
    err_console.print(f"\n{Emoji(name='x')} Command failed...\n")
    text = Text()
    if msg is not None:
        text.append(msg)
    if grpc_status is not None:
        text.append(f" (status: {grpc_status})", style="italic bright_black")
    if metadata is not None and bool(metadata):
        text.append("\n\n")
        text.append(
            f"metadata:\n{json.dumps(metadata, indent=2)}", style="bright_black"
        )
    err_console.print(Panel(text, title="Error:", title_align="left"))
