# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

FROM python:3.12-slim

# Install nginx for serving UI
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

WORKDIR /code
COPY ./samples/agent/oasf/financial_assistant/* .
COPY ./sdk/python/ ./sdk/python/
RUN pip install --no-cache-dir .

# Install identity platform dependency
RUN pip install sdk/python

# Copy UI files to nginx
COPY ./samples/agent/oasf/financial_assistant/ui/*.html /var/www/html/

# Create simple nginx config
RUN echo 'server { \
    listen 80; \
    root /var/www/html; \
    index index.html; \
    location /invoke { \
        proxy_pass http://localhost:9093/invoke; \
        proxy_set_header Host $host; \
    } \
}' > /etc/nginx/sites-available/default

# Create start script
RUN echo '#!/bin/bash\n\
echo "Starting nginx in background..."\n\
nginx -g "daemon off;" &\n\
echo "Waiting for nginx to start..."\n\
sleep 2\n\
echo "Starting Financial Assistant backend..."\n\
python main.py' > /start.sh && chmod +x /start.sh

# Expose both ports
EXPOSE 9093 80

CMD ["/start.sh"]
