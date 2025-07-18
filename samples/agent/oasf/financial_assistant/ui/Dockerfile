# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

# Simple Dockerfile for HTML-based UI
FROM nginx:alpine

# Copy HTML files to nginx
COPY *.html /usr/share/nginx/html/

# Copy a simple nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy init script
COPY init.sh /init.sh
RUN chmod +x /init.sh

# Expose port
EXPOSE 80

# Use init script as entrypoint
CMD ["/init.sh"]
