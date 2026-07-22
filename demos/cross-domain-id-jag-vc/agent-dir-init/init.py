# Copyright 2026 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

# assisted-by claude code claude-sonnet-4-6
"""One-shot init: push static OASF agent records to the AGNTCY Directory Node."""
import os
import time
import sys
from datetime import datetime, timezone

import grpc
from agntcy.dir.core.v1 import record_pb2
from agntcy.dir.store.v1 import store_service_pb2_grpc
from google.protobuf import struct_pb2

DIR_APISERVER_URL = os.environ.get("DIR_APISERVER_URL", "dir-apiserver:8888")
SCHEMA_VERSION = "1.1.0"
CREATED_AT = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

AGENTS = [
    {
        "name": "opencode-agent",
        "version": "0.1.0",
        "schema_version": SCHEMA_VERSION,
        "description": "Org A AI coding agent - scans repos for CVEs, delegates remediation cross-domain via ID-JAG",
        "authors": ["cross-domain-demo"],
        "created_at": CREATED_AT,
        "skills": [
            {"name": "cybersecurity/vulnerability_management/dependency_security", "id": 100304},
            {"name": "software_engineering/code_quality/code_review", "id": 60701},
        ],
        "domains": [
            {"name": "technology/security", "id": 107},
            {"name": "technology/software_engineering", "id": 102},
        ],
        "locators": [{"type": "url", "urls": ["http://opencode-agent:8100"]}],
        "annotations": {"org": "org-a", "cross_domain": "true", "client_id": "opencode-agent"},
    },
    {
        "name": "triage-agent",
        "version": "0.1.0",
        "schema_version": SCHEMA_VERSION,
        "description": "Org B AI remediation agent - creates tickets, plans fixes, spawns sub-agents",
        "authors": ["cross-domain-demo"],
        "created_at": CREATED_AT,
        "skills": [
            {"name": "research_knowledge_productivity/project_task_management/issue_tracking", "id": 130801},
            {"name": "software_engineering/code_quality/code_review", "id": 60701},
        ],
        "domains": [
            {"name": "technology/security", "id": 107},
        ],
        "locators": [{"type": "url", "urls": [
            "http://triage-agent:8200",
            "http://triage-agent:8200/.well-known/agent.json",
        ]}],
        "annotations": {"org": "org-b", "cross_domain": "true", "client_id": "triage-agent"},
    },
    {
        "name": "sub-agent",
        "version": "0.1.0",
        "schema_version": SCHEMA_VERSION,
        "description": "Org B sub-agent - bounded privilege, creates PRs in Gitea (gitea:write gitea:pr only)",
        "authors": ["cross-domain-demo"],
        "created_at": CREATED_AT,
        "skills": [
            {"name": "software_engineering/version_control/pull_request_management", "id": 61003},
            {"name": "software_engineering/version_control/commit_authoring", "id": 61002},
        ],
        "domains": [
            {"name": "technology/security", "id": 107},
        ],
        "locators": [{"type": "url", "urls": ["http://sub-agent:8300"]}],
        "annotations": {"org": "org-b", "cross_domain": "true", "client_id": "sub-agent", "bounded_privilege": "true"},
    },
]


def wait_for_directory(max_tries=30, interval=3.0):
    """Poll until dir-apiserver gRPC port responds."""
    print(f"Waiting for directory at {DIR_APISERVER_URL}...")
    for i in range(max_tries):
        try:
            channel = grpc.insecure_channel(DIR_APISERVER_URL)
            stub = store_service_pb2_grpc.StoreServiceStub(channel)
            # Test with empty push (will return immediately or error on stream)
            list(stub.Push(iter([])))
            channel.close()
            print("Directory is ready.")
            return True
        except grpc.RpcError:
            # Any RPC error (including server-side stream termination) means port is open
            channel.close()
            print("Directory is ready.")
            return True
        except Exception as e:
            if i < max_tries - 1:
                print(f"  attempt {i+1}/{max_tries}: {e} — retrying in {interval}s")
                time.sleep(interval)
    print("ERROR: Directory not ready after all retries.", file=sys.stderr)
    return False


def push_agents():
    """Push all agent OASF records to the directory."""
    channel = grpc.insecure_channel(DIR_APISERVER_URL)
    stub = store_service_pb2_grpc.StoreServiceStub(channel)

    records = []
    for agent_def in AGENTS:
        data = struct_pb2.Struct()
        data.update(agent_def)
        records.append(record_pb2.Record(data=data))

    def record_gen():
        for r in records:
            yield r

    refs = list(stub.Push(record_gen()))
    channel.close()

    for agent_def, ref in zip(AGENTS, refs):
        print(f"  ✓ {agent_def['name']} → CID: {ref.cid}")
    return refs


if __name__ == "__main__":
    if not wait_for_directory():
        sys.exit(1)
    print("Pushing agent OASF records...")
    refs = push_agents()
    print(f"Done. Pushed {len(refs)} agent records.")
