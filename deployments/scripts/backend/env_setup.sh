#!/bin/bash
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

BACKEND_ENV=./backend/cmd/bff/.env
IDENTITY_DEPLOYMENTS_DIR=./deployments/docker-compose/backend

# This script sets up the environment for the Identity Backend service.
# It checks for the existence of a .env file in the backend directory
if [ ! -f "$BACKEND_ENV" ]; then
  echo ".env File not found in the backend directory, please create one"

  exit 1
fi

# Check if the .env file exists in the deployments/docker-compose/backend directory
# If not, create a symlink to the Identity directory .env file
if [ ! -f "$IDENTITY_DEPLOYMENTS_DIR/.env" ]; then
  echo ".env File not found, creating symlink to Identity directory .env file"
  cd "$IDENTITY_DEPLOYMENTS_DIR" && ln -s "../../../$BACKEND_ENV" .
fi
