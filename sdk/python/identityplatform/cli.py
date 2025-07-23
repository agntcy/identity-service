# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Cli binary for the Identity Service Python SDK."""

import typer

from identityplatform.commands import badge

app = typer.Typer()
app.add_typer(
    badge.app, name="badge", help="Handle badges for Agentic Services"
)

if __name__ == "__main__":
    app()
