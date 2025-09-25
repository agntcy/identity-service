#!/bin/bash
# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0

FRONTEND_ENV=./frontend/.env
IDENTITY_DEPLOYMENTS_DIR=./deployments/docker-compose/frontend

# This script sets up the environment for the Identity frontend service.
# It checks for the existence of a .env file in the frontend directory
if [ ! -f "$FRONTEND_ENV" ]; then
  echo ".env File not found in the frontend directory, using defaults"

  echo "Creating .env file with defaults"
  touch "$FRONTEND_ENV" && \
  echo "VITE_API_URL=http://0.0.0.0:4000" > "$FRONTEND_ENV" && \
  echo "VITE_AUTH_TYPE=oidc" >> "$FRONTEND_ENV" && \
  echo "VITE_APP_CLIENT_PORT=5500" >> "$FRONTEND_ENV" && \
  echo "VITE_OIDC_ISSUER=${OIDC_ISSUER_URL}" >> "$FRONTEND_ENV" && \
  echo "VITE_OIDC_CLIENT_ID=${OIDC_CLIENT_ID}" >> "$FRONTEND_ENV" && \
  echo "VITE_OIDC_UI=${OIDC_LOGIN_URL}" >> "$FRONTEND_ENV"
fi

# Check if the .env file exists in the deployments/docker-compose/frontend directory
# If not, create a symlink to the Identity directory .env file
if [ ! -f "$IDENTITY_DEPLOYMENTS_DIR/.env" ]; then
  echo ".env File not found, creating symlink to Identity directory .env file"
  cd "$IDENTITY_DEPLOYMENTS_DIR" && ln -s "../../../$FRONTEND_ENV" .
fi
