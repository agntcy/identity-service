#!/usr/bin/env bash
# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

# If .env exists in the webapi directory, use it
# If not, create an env with defaults
./deployments/scripts/docs/env_setup.sh

docker compose -f ./deployments/docker-compose/docs/docker-compose.yml down
