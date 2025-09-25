# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0
"""Cli binary for the Identity Service Python SDK."""

import typer

from identityservice.commands import badge

app = typer.Typer()
app.add_typer(
    badge.app, name="badge", help="Handle badges for Agentic Services"
)

if __name__ == "__main__":
    app()
