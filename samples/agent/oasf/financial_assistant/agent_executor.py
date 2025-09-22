# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Main entry point for the AgentExecutor API server."""

import logging
import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware

logger = logging.getLogger(__name__)

app = FastAPI()
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)


class AgentExecutor:
    """Simple AgentExecutor API."""

    def __init__(self, agent):
        self.agent = agent

    def build(self):
        # Get the UI directory path
        ui_dir = Path(__file__).parent / "ui"
        
        async def invoke(request: Request):
            """Invoke the agent with the provided request."""
            req = await request.json()
            prompt = req.get("prompt")
            logger.info("Received prompt: %s", prompt)

            return await self.agent.invoke(prompt)

        # Add the /invoke endpoint for the backend API
        app.post("/invoke")(invoke)

        # Serve static files from the ui directory
        if ui_dir.exists():
            app.mount("/static", StaticFiles(directory=ui_dir), name="static")
            
            # Serve the main UI at the root path
            @app.get("/")
            async def serve_ui():
                return FileResponse(ui_dir / "financial-assistant-chat.html")
        else:
            logger.warning("UI directory not found at %s", ui_dir)

        return app
