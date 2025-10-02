# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

FROM node:alpine as builder-docs

WORKDIR /build

# Generate docs
COPY docs .
COPY backend/api/spec/static/api ./static/api
RUN cd /build && yarn install && npx docusaurus generate-proto-docs && yarn build

# Build final image for running the APIs and docs
FROM httpd:2.4

COPY --from=builder-docs /build/build /usr/local/apache2/htdocs
