#!/usr/bin/env bash
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

# If .env exists in the node directory, use it
# If not, create an env with defaults
./deployments/scripts/backend/env_setup.sh

docker compose -f ./deployments/docker-compose/backend/docker-compose.bff.yml down
docker compose -f ./deployments/docker-compose/backend/docker-compose.bff.dev.yml down
