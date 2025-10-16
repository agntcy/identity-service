#!/usr/bin/env bash
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

# Setup environment variables for Keycloak
./deployments/scripts/keycloak/env_setup.sh

# Set the compose file for Keycloak
compose_file="./deployments/docker-compose/keycloak/docker-compose.yml"

echo "Stopping Keycloak services..."
echo "Using compose file: $compose_file"

# Stop Keycloak services
docker compose -f "$compose_file" down

echo "Keycloak services stopped successfully!"
echo ""
echo "Note: H2 database files are preserved in the keycloak-data volume."
echo "To completely remove Keycloak data:"
echo "  docker volume rm identity-keycloak_keycloak-data"