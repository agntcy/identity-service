# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Main cli for the Identity Service Python SDK."""

import dataclasses
import grpc
import typer
from typing_extensions import Annotated

from identityservice import cli
from identityservice.error import (
    handle_cli_error,
    handle_generic_error,
    handle_grpc_error,
)
from identityservice.exceptions import SdkError


@dataclasses.dataclass
class State:
    """A class to represent the global state of the CLI."""

    def __init__(self, debug: bool = False):
        """Initialize the State object."""
        self.debug = debug


state = State()


@cli.app.callback()
def main(
    debug: Annotated[
        bool,
        typer.Option(
            "--debug",
            "-d",
            help="Enable debug mode for verbose logging and detailed error traces",
        ),
    ] = False,
):
    """The main function with a role to set the global state."""
    state.debug = debug


if __name__ == "__main__":
    try:
        cli.app()
    except Exception as e:  # pylint: disable=broad-exception-caught
        if state.debug:
            raise e
        if isinstance(e, grpc.RpcError):
            handle_grpc_error(e)
        elif isinstance(e, SdkError):
            handle_cli_error(e)
        else:
            handle_generic_error(e)
