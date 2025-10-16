#!/usr/bin/env bash
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

# Setup environment variables for Keycloak
./deployments/scripts/keycloak/env_setup.sh

# Set the compose file for Keycloak
compose_file="./deployments/docker-compose/keycloak/docker-compose.yml"

# Load environment variables from .env file
if [ -f "./deployments/docker-compose/keycloak/.env" ]; then
  export $(grep -v '^#' ./deployments/docker-compose/keycloak/.env | xargs)
fi

# Set defaults if not provided
KEYCLOAK_ADMIN=${KEYCLOAK_ADMIN:-admin}
KEYCLOAK_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD:-admin123}

echo "Starting Keycloak with H2 embedded database..."
echo "Using compose file: $compose_file"

# Build and start Keycloak services
docker compose -f "$compose_file" up -d

echo ""
echo "Waiting for Keycloak to be ready..."
echo ""

# Wait for Keycloak to be fully started (max 60 seconds)
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  # Check if Keycloak responds on the main endpoint
  if curl -sf http://localhost:8080 > /dev/null 2>&1; then
    echo "Keycloak is ready!"
    break
  fi
  attempt=$((attempt + 1))
  echo "Waiting for Keycloak to start... ($attempt/$max_attempts)"
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "Warning: Keycloak did not become ready within the expected time."
  echo "You may need to configure SSL settings manually."
else
  echo ""
  echo "Configuring Keycloak to disable SSL requirement..."
  echo ""
  
  # Configure kcadm credentials
  docker exec identity-keycloak /opt/keycloak/bin/kcadm.sh config credentials \
    --server http://localhost:8080 \
    --realm master \
    --user "$KEYCLOAK_ADMIN" \
    --password "$KEYCLOAK_ADMIN_PASSWORD" 2>/dev/null
  
  # Disable SSL requirement for master realm
  docker exec identity-keycloak /opt/keycloak/bin/kcadm.sh update realms/master \
    -s sslRequired=NONE 2>/dev/null
  
  if [ $? -eq 0 ]; then
    echo "✓ SSL requirement disabled for master realm"
  else
    echo "⚠ Failed to disable SSL requirement. You may need to configure it manually in the Admin Console."
  fi
  
  echo ""
  echo "Configuring identity-service client..."
  
  # Check if client already exists
  CLIENT_ID=$(docker exec identity-keycloak /opt/keycloak/bin/kcadm.sh get clients \
    -r master --fields id,clientId | grep -A1 "identity-service-client" | grep '"id"' | sed 's/.*"id" : "\([^"]*\)".*/\1/' 2>/dev/null)
  
  if [ -z "$CLIENT_ID" ]; then
    echo "Creating identity-service-client..."
    # Create the client
    docker exec identity-keycloak /opt/keycloak/bin/kcadm.sh create clients \
      -r master \
      -s clientId=identity-service-client \
      -s enabled=true \
      -s protocol=openid-connect \
      -s publicClient=true \
      -s standardFlowEnabled=true \
      -s directAccessGrantsEnabled=true 2>/dev/null
    
    if [ $? -eq 0 ]; then
      echo "✓ Client identity-service-client created"
      # Get the client ID for the newly created client
      CLIENT_ID=$(docker exec identity-keycloak /opt/keycloak/bin/kcadm.sh get clients \
        -r master --fields id,clientId | grep -A1 "identity-service-client" | grep '"id"' | sed 's/.*"id" : "\([^"]*\)".*/\1/' 2>/dev/null)
    else
      echo "⚠ Failed to create client"
    fi
  else
    echo "✓ Client identity-service-client already exists"
  fi
  
  # Configure audience mapper if client exists
  if [ -n "$CLIENT_ID" ]; then
    echo "Configuring API audience mapper..."
    docker exec identity-keycloak /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/protocol-mappers/models \
      -r master \
      -s name=api-audience-mapper \
      -s protocol=openid-connect \
      -s protocolMapper=oidc-audience-mapper \
      -s 'config."included.client.audience"=api://default' \
      -s 'config."access.token.claim"=true' 2>/dev/null
    
    if [ $? -eq 0 ]; then
      echo "✓ API audience mapper configured (api://default)"
    else
      echo "⚠ Failed to configure audience mapper (may already exist)"
    fi
  fi
fi

echo ""
echo "Keycloak services started successfully!"
echo ""
echo "Keycloak is available at: http://localhost:8080"
echo "Admin console: http://localhost:8080/admin"
echo ""
echo "Default admin credentials:"
echo "  Username: $KEYCLOAK_ADMIN"
echo "  Password: $KEYCLOAK_ADMIN_PASSWORD"
echo ""
echo "Configured clients:"
echo "  Client ID: identity-service-client"
echo "  Audience: api://default"
echo ""
