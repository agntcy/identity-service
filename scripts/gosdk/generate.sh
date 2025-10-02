#!/bin/sh
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0


# Generate the BFF client code
cd ./scripts/gosdk/docker &&
    docker compose -f buf-compose.yaml build --no-cache &&
    docker compose -f buf-compose.yaml run --rm buf-go

docker rmi docker-buf-go

echo "Done"
