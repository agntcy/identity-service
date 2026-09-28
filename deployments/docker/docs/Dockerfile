# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS builder-docs

WORKDIR /build

# Generate docs
COPY docs .
COPY backend/api/spec/static/api ./static/api
RUN yarn install && npx docusaurus generate-proto-docs && yarn build

# Build final image for running the APIs and docs
FROM httpd:2.4@sha256:03f858efb82c25cb0f9962946615cdcdaf26927cb971722149b563197cfd0fdd

COPY --from=builder-docs /build/build /usr/local/apache2/htdocs
