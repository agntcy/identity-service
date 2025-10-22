#!/bin/bash
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

DOCKER_FILE=./deployments/docker/frontend/Dockerfile.test
TEST_COMMAND='yarn run test:coverage'

echo RUNNING FRONTEND TESTS
docker run --rm "$(docker build --no-cache -f ${DOCKER_FILE} -q .)" $TEST_COMMAND

DOCKER_FILE=./deployments/docker/backend/Dockerfile.test
TEST_COMMAND='go test -cover -v ./...'

echo RUNNING BACKEND TESTS
docker run --rm "$(docker build --no-cache -f ${DOCKER_FILE} -q .)" $TEST_COMMAND

DOCKER_FILE=./deployments/docker/python/Dockerfile.test
TEST_COMMAND='pytest -v -s'

echo RUNNING PYTHON SDK TESTS
docker run --rm "$(docker build --no-cache -f ${DOCKER_FILE} -q .)" $TEST_COMMAND
