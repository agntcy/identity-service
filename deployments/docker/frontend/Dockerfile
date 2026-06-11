# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

FROM node:22-alpine AS build

# Install packages
RUN apk upgrade --no-cache openssl && \
  apk add --update \
  libpng-dev \
  build-base \
  nodejs \
  npm \
  yarn

# Set workdir
WORKDIR /home/web

# Copy src
COPY ./frontend .

# Install libs
RUN yarn install
RUN yarn build

FROM alpine:3.22

# Install packages
RUN apk upgrade --no-cache openssl && \
  apk add --update \
  gettext \
  nginx

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
USER web

ENTRYPOINT ["./entrypoint.sh"]
CMD ["/usr/sbin/nginx", "-c", "/home/web/nginx/nginx.conf", "-g", "daemon off;pid /home/web/nginx/nginx.pid;", "-p", "/home/web/nginx"]
