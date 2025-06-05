#!/usr/bin/env bash
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

# If .env exists in the webapi directory, use it
# If not, create an env with defaults
./deployments/scripts/backend/env_setup.sh

# Check if dev option is set
compose_file="./deployments/docker-compose/backend/docker-compose.webapi.yml"
if [ "$1" == "true" ]; then
    echo "Running in dev mode"
    compose_file="./deployments/docker-compose/backend/docker-compose.webapi.dev.yml"
fi

docker compose -f "$compose_file" build --no-cache
docker compose -f "$compose_file" up -d
