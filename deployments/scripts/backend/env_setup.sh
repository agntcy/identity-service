#!/bin/bash
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

BACKEND_ENV=./cmd/webapi/.env
IDENTITY_DEPLOYMENTS_DIR=./deployments/docker-compose/backend

# This script sets up the environment for the Identity Backend service.
# It checks for the existence of a .env file in the backend directory
# and creates one with default values if it doesn't exist.
if [ ! -f "$BACKEND_ENV" ]; then
  echo ".env File not found in the backend directory, using defaults"

  echo "Creating .env file with defaults"
  touch "$BACKEND_ENV" && \
  echo "DB_HOST=identity-postgres" > "$BACKEND_ENV" && \
  echo "DB_PORT=5432" >> "$BACKEND_ENV" && \
  echo "DB_USERNAME=postgres" >> "$BACKEND_ENV" && \
  echo "DB_PASSWORD=postgres" >> "$BACKEND_ENV" && \
  echo "POSTGRES_PASSWORD=postgres" >> "$BACKEND_ENV" && \
  echo "POSTGRES_DB=identity" >> "$BACKEND_ENV"
fi

# Check if the .env file exists in the deployments/docker-compose/backend directory
# If not, create a symlink to the Identity directory .env file
if [ ! -f "$IDENTITY_DEPLOYMENTS_DIR/.env" ]; then
  echo ".env File not found, creating symlink to Identity directory .env file"
  cd "$IDENTITY_DEPLOYMENTS_DIR" && ln -s "../../../$BACKEND_ENV" .
fi
