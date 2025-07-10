# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Main entry point for the AgentExecutor API server."""

import logging

from fastapi import FastAPI, Request
from starlette.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
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
        async def invoke(request: Request):
            """Invoke the agent with the provided request."""
            req = await request.json()
            prompt = req.get("prompt")
            logger.info("Received prompt: %s", prompt)

            return await self.agent.invoke(prompt)

        app.post("/invoke")(invoke)

        return app
