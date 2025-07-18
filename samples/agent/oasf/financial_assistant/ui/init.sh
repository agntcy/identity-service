#!/bin/sh
# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0


# Default values
AGENT_URL=${AGENT_URL:-"http://localhost:9093/invoke"}

echo "Configuring Financial Assistant UI..."
echo "Agent URL: $AGENT_URL"

# Replace the agent URL in the HTML file
sed -i "s|AGENT_URL_PLACEHOLDER|$AGENT_URL|g" /usr/share/nginx/html/financial-assistant-chat.html

# Update the display URL as well
sed -i "s|AGENT_URL_DISPLAY_PLACEHOLDER|$AGENT_URL|g" /usr/share/nginx/html/financial-assistant-chat.html

echo "Configuration complete!"

# Start nginx
exec nginx -g 'daemon off;'
