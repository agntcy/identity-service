# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

FROM node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402 AS build

# Install packages
RUN apk upgrade --no-cache openssl && \
  apk add --no-cache \
  libpng-dev=~1.6 \
  build-base=~0.5 \
  yarn=~1.22

# Set workdir
WORKDIR /home/web

# Copy src
COPY ./frontend .

# Install libs
RUN yarn install --immutable && yarn build && yarn cache clean

FROM alpine:3.22@sha256:5291449c3df73caf6ed85e649dec1b9e818b39a5d8c871e97afc13e9cd5e8fa8

# Install packages
RUN apk upgrade --no-cache openssl && \
  apk add --no-cache \
  gettext=~0.24 \
  nginx=~1.28

# Create a group and user
RUN addgroup -S web && adduser -S -G web -u 999 web

# Set workdir
WORKDIR /home/web

COPY --from=build /home/web/dist ./dist
COPY --chown=web:web ./deployments/docker/frontend/nginx/entrypoint.sh .
COPY --chown=web:web ./deployments/docker/frontend/nginx/nginx.conf ./nginx/nginx.env.conf
COPY --chown=web:web ./deployments/docker/frontend/nginx/csp-header.env.conf ./nginx/csp-header.env.conf
COPY --chown=web:web ./deployments/docker/frontend/nginx/config.js.ssi ./dist/config.js
RUN mkdir ./nginx/logs && \
  mkdir ./nginx/tmp && \
  chown web:web ./nginx/logs && \
  chown web:web ./nginx/tmp

# Inject config.js as an external script instead of an inline script block
RUN sed -i 's|<head>|<head><script src="/config.js"></script>|g' ./dist/index.html

# Set non root user
USER 999

ENTRYPOINT ["./entrypoint.sh"]
CMD ["/usr/sbin/nginx", "-c", "/home/web/nginx/nginx.conf", "-g", "daemon off;pid /home/web/nginx/nginx.pid;", "-p", "/home/web/nginx"]
