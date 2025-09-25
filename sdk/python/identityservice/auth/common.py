# Copyright 2025 Cisco Systems, Inc. and its affiliates
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Common constants and utility functions for the auth package."""

import json

MCP_PROTECTED_CALLS = ["tools/call", "resources/read"]


def get_mcp_request_tool_name(body: bytes) -> str | None:
    """Extract the tool name from the JSON RPC request body."""
    try:
        jsonrpc_request = json.loads(body)
        if jsonrpc_request.get("method") not in MCP_PROTECTED_CALLS:
            return None

        return jsonrpc_request["params"]["name"]
    except (json.JSONDecodeError, KeyError) as e:
        raise ValueError(f"Failed to extract tool name: {e}") from e
