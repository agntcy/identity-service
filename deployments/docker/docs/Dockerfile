# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

FROM node:alpine as builder-docs

WORKDIR /build

# Generate docs
COPY docs .
COPY backend/api/spec/static/api ./static/api
RUN cd /build && npm install --legacy-peer-deps && npx docusaurus generate-proto-docs && npm run build

# Build final image for running the APIs and docs
FROM httpd:2.4

COPY --from=builder-docs /build/build /usr/local/apache2/htdocs
