#!/bin/bash
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

KEYCLOAK_ENV=./deployments/docker-compose/keycloak/.env
KEYCLOAK_DEPLOYMENTS_DIR=./deployments/docker-compose/keycloak

# This script sets up the environment for the Keycloak service.
# It checks for the existence of a .env file in the deployments directory
if [ ! -f "$KEYCLOAK_ENV" ]; then
  echo ".env File not found, creating with defaults"

  echo "Creating .env file with defaults"
  touch "$KEYCLOAK_ENV" && \
  echo "# Keycloak Configuration" > "$KEYCLOAK_ENV" && \
  echo "# Using H2 embedded database for development" >> "$KEYCLOAK_ENV" && \
  echo "KEYCLOAK_ADMIN=admin" >> "$KEYCLOAK_ENV" && \
  echo "KEYCLOAK_ADMIN_PASSWORD=admin123" >> "$KEYCLOAK_ENV"

  echo "Created .env with default configuration (H2 database)"
else
  echo ".env file already exists"
fi