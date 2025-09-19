#!/bin/bash
# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0

DOCKER_FILE=./deployments/docker/frontend/Dockerfile.test
TEST_COMMAND='yarn run test:coverage'

echo RUNNING FRONTEND TESTS
docker run "$(docker build --no-cache --build-arg -f ${DOCKER_FILE} -q .)" $TEST_COMMAND

DOCKER_FILE=./deployments/docker/backend/Dockerfile.test
TEST_COMMAND='go test -cover -v ./...'

echo RUNNING BACKEND TESTS
docker run "$(docker build --no-cache -f ${DOCKER_FILE} -q .)" $TEST_COMMAND
