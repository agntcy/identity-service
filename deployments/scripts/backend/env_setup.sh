#!/bin/bash
# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0

BACKEND_ENV=./backend/cmd/bff/.env
IDENTITY_DEPLOYMENTS_DIR=./deployments/docker-compose/backend

# This script sets up the environment for the Identity Backend service.
# It checks for the existence of a .env file in the backend directory
if [ ! -f "$BACKEND_ENV" ]; then
  echo ".env File not found in the backend directory, using defaults"

  echo "Creating .env file with defaults"
  touch "$BACKEND_ENV" && \
  echo "DB_HOST=identity-postgres" > "$BACKEND_ENV" && \
  echo "DB_PORT=5432" >> "$BACKEND_ENV" && \
  echo "DB_USERNAME=postgres" >> "$BACKEND_ENV" && \
  echo "DB_PASSWORD=postgres" >> "$BACKEND_ENV" && \
  echo "POSTGRES_PASSWORD=postgres" >> "$BACKEND_ENV" && \
  echo "POSTGRES_DB=identity" >> "$BACKEND_ENV" && \
  echo "WEB_APPROVAL_EMAIL=default" >> "$BACKEND_ENV" && \
  echo "WEB_APPROVAL_PUB_KEY=default" >> "$BACKEND_ENV" && \
  echo "WEB_APPROVAL_PRIV_KEY=default" >> "$BACKEND_ENV" && \
  echo "VAULT_HOST=identity-vault" >> "$BACKEND_ENV" && \
  echo "VAULT_DEV_ROOT_TOKEN=default" >> "$BACKEND_ENV"
  echo "GO_ENV=development" >> "$BACKEND_ENV" && \
  echo "IDENTITY_HOST=identity-node" >> "$BACKEND_ENV" && \
  echo "IDENTITY_PORT=4000" >> "$BACKEND_ENV" && \
  echo "IAM_ORGANIZATION=default" >> "$BACKEND_ENV" && \
  echo "SECRETS_CRYPTO_KEY=defaultcryptokey" >> "$BACKEND_ENV" && \
  echo "IAM_ISSUER=${OIDC_ISSUER_URL}" >> "$BACKEND_ENV" && \
  echo "IAM_USER_CID=${OIDC_CLIENT_ID}" >> "$BACKEND_ENV"
fi

# Check if the .env file exists in the deployments/docker-compose/backend directory
# If not, create a symlink to the Identity directory .env file
if [ ! -f "$IDENTITY_DEPLOYMENTS_DIR/.env" ]; then
  echo ".env File not found, creating symlink to Identity directory .env file"
  cd "$IDENTITY_DEPLOYMENTS_DIR" && ln -s "../../../$BACKEND_ENV" .
fi
