#!/bin/bash
# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0

DOCS_ENV=./docs/.env
IDENTITY_DEPLOYMENTS_DIR=./deployments/docker-compose/docs

# This script sets up the environment for the Identity Docs service.
# It checks for the existence of a .env file in the docs directory
if [ ! -f "$DOCS_ENV" ]; then
  echo ".env File not found in the docs directory, please create one"

  exit 1
fi

# Check if the .env file exists in the deployments/docker-compose/backend directory
# If not, create a symlink to the Identity directory .env file
if [ ! -f "$IDENTITY_DEPLOYMENTS_DIR/.env" ]; then
  echo ".env File not found, creating symlink to Identity directory .env file"
  cd "$IDENTITY_DEPLOYMENTS_DIR" && ln -s "../../../$DOCS_ENV" .
fi
