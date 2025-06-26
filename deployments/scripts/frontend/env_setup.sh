#!/bin/bash
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

FRONTEND_ENV=./frontend/.env
IDENTITY_DEPLOYMENTS_DIR=./deployments/docker-compose/frontend

# This script sets up the environment for the Identity frontend service.
# It checks for the existence of a .env file in the frontend directory
if [ ! -f "$FRONTEND_ENV" ]; then
  echo ".env File not found in the frontend directory, please create one"

  exit 1
fi

# Check if the .env file exists in the deployments/docker-compose/frontend directory
# If not, create a symlink to the Identity directory .env file
if [ ! -f "$IDENTITY_DEPLOYMENTS_DIR/.env" ]; then
  echo ".env File not found, creating symlink to Identity directory .env file"
  cd "$IDENTITY_DEPLOYMENTS_DIR" && ln -s "../../../$FRONTEND_ENV" .
fi
