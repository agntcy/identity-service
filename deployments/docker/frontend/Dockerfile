# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0

FROM node:22-alpine AS build

# Install packages
RUN apk add --update \
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
RUN apk add --update \
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
RUN mkdir ./nginx/logs && \
  mkdir ./nginx/tmp && \
  chown web:web ./nginx/logs && \
  chown web:web ./nginx/tmp

# Add nonce to the script with id "vite-plugin-pwa:inline-sw"
RUN sed -i 's/<script id="vite-plugin-pwa:inline-sw">/<script id="vite-plugin-pwa:inline-sw" nonce="c28133ca-0587-459b-9d44-7015cde0ef83">/g' ./dist/index.html

# Add SSI vars
RUN sed -i 's/<head>/<head>\<script nonce="111dd4a0-4c4e-43a9-8eb4-6446ad2e10c7" language="javascript"\>window.apiUrl=`\<!--#echo var="apiUrl"--\>`;window.logLevel=`\<!--#echo var="logLevel"--\>`;window.authType=`\<!--#echo var="authType"--\>`;window.segmentId=`\<!--#echo var="segmentId"--\>`;window.iamProductId=`\<!--#echo var="iamProductId"--\>`;window.iamUi=`\<!--#echo var="iamUi"--\>`;window.iamApi=`\<!--#echo var="iamApi"--\>`;window.iamOidcClientId=`\<!--#echo var="iamOidcClientId"--\>`;window.iamOidcIssuer=`\<!--#echo var="iamOidcIssuer"--\>`;window.oidcUi=`\<!--#echo var="oidcUi"--\>`;window.oidcClientId=`\<!--#echo var="oidcClientId"--\>`;window.oidcIssuer=`\<!--#echo var="oidcIssuer"--\>`;window.docsUrl=`\<!--#echo var="docsUrl"--\>`;window.mazeId=`\<!--#echo var="mazeId"--\>`;window.iamMultiTenant=`\<!--#echo var="iamMultiTenant"--\>`;window.appBaseName=`\<!--#echo var="appBaseName"--\>`;<\/script>/g' ./dist/index.html

# Set non root user
USER web

ENTRYPOINT ["./entrypoint.sh"]
CMD ["/usr/sbin/nginx", "-c", "/home/web/nginx/nginx.conf", "-g", "daemon off;pid /home/web/nginx/nginx.pid;", "-p", "/home/web/nginx"]
