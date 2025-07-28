#!/usr/bin/env bash
# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0

# If .env exists in the frontend directory, use it
# If not, create an env with defaults
./deployments/scripts/frontend/env_setup.sh

compose_file="./deployments/docker-compose/frontend/docker-compose.yml"

docker compose -f "$compose_file" build --no-cache
docker compose -f "$compose_file" up -d
