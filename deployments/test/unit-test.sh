#!/bin/bash
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

run_unit_tests_container() {
  # $1 -> docker file
  # $2 -> test command

  # shellcheck disable=SC2086
  docker run --rm "$(docker build --no-cache -f "$1" -q .)" $2
}

echo RUNNING FRONTEND TESTS
run_unit_tests_container "./deployments/docker/frontend/Dockerfile.test" "yarn run test:coverage"

echo RUNNING BACKEND TESTS
run_unit_tests_container "./deployments/docker/backend/Dockerfile.test" "go test -cover -v ./..."

echo RUNNING PYTHON SDK TESTS
run_unit_tests_container "./deployments/docker/python/Dockerfile.test" "pytest -v -s"
