# pylint: disable=redefined-builtin, line-too-long
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Badge services for the Identity Service Python SDK."""

import typer
from rich import print
from typing_extensions import Annotated

from agntcy.identity.service.v1alpha1.app_pb2 import AppType
from identityservice.sdk import IdentityServiceSdk as Sdk
from identityservice.sdk import empty_request

app = typer.Typer()


@app.command()
def create(
    url: Annotated[
        str,
        typer.Argument(
            help="The local accessible URL of the agentic service to issue a badge for"
        ),
    ] = "",
    key: Annotated[
        str,
        typer.Option(
            prompt="Agentic Service API Key",
            hide_input=True,
            help="The Agentic Service API Key",
        ),
    ] = "",
):
    """Issue a badge for the agentic service."""
    if not url:
        typer.echo("Error: Agentic Service URL is required.")
        raise typer.Exit(code=1)

    # Init the SDK
    identity_sdk = Sdk(api_key=key)

    # Fetch the agentic service
    app_info = identity_sdk.get_auth_service().AppInfo(empty_request())

    # Get name and type
    service_name = app_info.app.name
    service_type = app_info.app.type
    service_id = app_info.app.id

    print(f"Service Name: [bold blue]{service_name}[/bold blue]")
    print(f"Service Type: [bold blue]{service_type}[/bold blue]")

    if service_type == AppType.APP_TYPE_MCP_SERVER:
        print(
            f"""[bold green]Discovering MCP server for {service_name} at {url}[/bold green]"""
        )
    elif service_type == AppType.APP_TYPE_AGENT_A2A:
        print(
            f"""[bold green]Discovering A2A agent for {service_name} at [bold blue]{url}[/bold blue][/bold green]"""
        )
    elif service_type == AppType.APP_TYPE_AGENT_OASF:
        print(
            f"""[bold green]Processing OASF agent for {service_name} at [bold blue]{url}[/bold blue][/bold green]"""
        )

    print(
        f"[bold green]Issuing badge for service [bold blue]{service_id}[/bold blue][/bold green]"
    )

    # Issue the badge
    identity_sdk.issue_badge(url=url)

    print(
        f"""[bold green]Badge issued successfully for service [bold blue]{service_id}[/bold blue][/bold green]"""
    )
