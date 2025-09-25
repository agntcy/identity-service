#!/bin/sh
# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0


# Generate the BFF client code
cd ./scripts/gosdk/docker &&
    docker compose -f buf-compose.yaml build --no-cache &&
    docker compose -f buf-compose.yaml run --rm buf-go

docker rmi docker-buf-go

echo "Done"
