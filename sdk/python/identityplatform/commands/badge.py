# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Badge services for the Identity Service Python SDK."""

import asyncio
import base64

import typer
from identityplatform.commands.a2a import discover as discover_a2a
from identityplatform.commands.mcp import discover as discover_mcp
from identityplatform.sdk import IdentityPlatformSdk as Sdk
from rich import print
from typing_extensions import Annotated

app = typer.Typer()


@app.command()
def create(
    url: Annotated[
        str,
        typer.Argument(
            help=
            "The local accessible URL of the agentic service to issue a badge for"
        ), ] = "",
    key: Annotated[str,
                   typer.Option(
                       prompt="Agentic Service API Key",
                       hide_input=True,
                       help="The Agentic Service API Key",
                   ), ] = "",
):
    """Issue a badge for the agentic service."""
    if not url:
        typer.echo("Error: Agentic Service URL is required.")
        raise typer.Exit(code=1)

    # Init the SDK
    identity_sdk = Sdk(api_key=key)

    # Fetch the agentic service
    app_info = identity_sdk._get_auth_service().AppInfo(
        identity_sdk.empty_request())

    # Get name and type
    service_name = app_info.app.name
    service_type = app_info.app.type
    service_id = app_info.app.id

    print(f"Service Name: [bold blue]{service_name}[/bold blue]")
    print(f"Service Type: [bold blue]{service_type}[/bold blue]")

    claims = {}

    if service_type == 3:  # APP_TYPE_MCP_SERVER
        print(
            f"[bold green]Discovering MCP server for {service_name} at {url}[/bold green]"
        )

        # Discover the MCP server
        schema = asyncio.run(discover_mcp(service_name, url))

        claims["mcp"] = {
            "schema_base64": base64.b64encode(schema.encode("utf-8")),
        }
    elif service_type == 1:  # APP_TYPE_A2A_AGENT
        print(
            f"[bold green]Discovering A2A agent for {service_name} at [bold blue]{url}[/bold blue][/bold green]"
        )

        # Discover the A2A agent
        schema = discover_a2a(url)

        claims["a2a"] = {
            "schema_base64": base64.b64encode(schema.encode("utf-8")),
        }

    if not claims:
        typer.echo("Error: No claims found for the agentic service.")
        raise typer.Exit(code=1)

    print(
        f"[bold green]Issuing badge for service [bold blue]{service_id}[/bold blue][/bold green]"
    )

    # Issue the badge
    identity_sdk._get_badge_service().IssueBadge(
        request=Sdk.IssueBadgeRequest(app_id=service_id, **claims))

    print(
        f"[bold green]Badge issued successfully for service [bold blue]{service_id}[/bold blue][/bold green]"
    )
