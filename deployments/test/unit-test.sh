#!/bin/bash
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0


DOCKER_FILE=./deployments/docker/backend/Dockerfile.test
TEST_COMMAND='go test -cover -v ./...'

echo RUNNING TESTS
docker run "$(docker build --no-cache -f ${DOCKER_FILE} -q .)" $TEST_COMMAND
