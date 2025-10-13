#!/usr/bin/env bash
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

# If .env exists in the frontend directory, use it
# If not, create an env with defaults
./deployments/scripts/frontend/env_setup.sh

# Check if dev option is set
compose_file="./deployments/docker-compose/frontend/docker-compose.yml"
if [ "$1" == "true" ]; then
    echo "Running in dev mode"
    compose_file="./deployments/docker-compose/frontend/docker-compose.dev.yml"
fi

docker compose -f "$compose_file" build --no-cache
docker compose -f "$compose_file" up -d
