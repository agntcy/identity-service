# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""A2A Agent Executor Example."""

import logging

from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.server.tasks import TaskUpdater
from a2a.types import (InternalError, InvalidParamsError, Part, Task,
                       TaskState, TextPart, UnsupportedOperationError)
from a2a.utils import new_agent_text_message, new_task
from a2a.utils.errors import ServerError

from agent import CurrencyAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CurrencyAgentExecutor(AgentExecutor):
    """Currency Conversion AgentExecutor Example."""

    def __init__(self, ollama_host, ollama_model, mcp_server_url) -> None:
        self.agent = CurrencyAgent(
            ollama_base_url=ollama_host,
            ollama_model=ollama_model,
            mcp_server_url=mcp_server_url,
        )

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        """Executes the agent with the given context and event queue."""
        error = self._validate_request(context)
        if error:
            raise ServerError(error=InvalidParamsError())

        # Initialize the agent and tools
        await self.agent.init_model_and_tools()

        query = context.get_user_input()
        task = context.current_task
        if not task:
            task = new_task(context.message)
            event_queue.enqueue_event(task)
        updater = TaskUpdater(event_queue, task.id, task.contextId)
        try:
            async for item in self.agent.stream(query, task.contextId):
                is_task_complete = item["is_task_complete"]
                require_user_input = item["require_user_input"]

                if not is_task_complete and not require_user_input:
                    updater.update_status(
                        TaskState.working,
                        new_agent_text_message(
                            item["content"],
                            task.contextId,
                            task.id,
                        ),
                    )
                elif require_user_input:
                    updater.update_status(
                        TaskState.input_required,
                        new_agent_text_message(
                            item["content"],
                            task.contextId,
                            task.id,
                        ),
                        final=True,
                    )
                    break
                else:
                    updater.add_artifact(
                        [Part(root=TextPart(text=item["content"]))],
                        name="conversion_result",
                    )
                    updater.complete()
                    break

        except Exception as e:
            logger.error("An error occurred while streaming the response: %e", e)
            raise ServerError(error=InternalError()) from e

    def _validate_request(self, _: RequestContext) -> bool:
        """Validates the request parameters."""
        return False

    async def cancel(self, _: RequestContext, _2: EventQueue) -> Task | None:
        """Cancels the current task."""
        raise ServerError(error=UnsupportedOperationError())
