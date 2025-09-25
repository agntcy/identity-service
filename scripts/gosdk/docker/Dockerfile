# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0

FROM golang:1.25-alpine AS builder

ARG BIN="/usr/local/bin"
ARG BUF_VERSION="1.57.2"

WORKDIR /identity

COPY ./scripts/gosdk/docker/entrypoint.sh .
COPY ./scripts/gosdk/docker/templates ./templates

RUN apk update && apk --no-cache add curl git

RUN curl -sSL \
    "https://github.com/bufbuild/buf/releases/download/v${BUF_VERSION}/buf-$(uname -s)-$(uname -m)" \
    -o "${BIN}/buf" && \
    chmod +x "${BIN}/buf"

RUN go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2@latest && \
    go install google.golang.org/protobuf/cmd/protoc-gen-go@latest && \
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest && \
    mkdir go-swagger && \
    git clone https://github.com/go-swagger/go-swagger "./go-swagger"

WORKDIR /identity/go-swagger
RUN go install ./cmd/swagger

WORKDIR /identity

RUN addgroup -S generator && adduser -u 1999 -S -G generator generator

RUN chmod +x entrypoint.sh && \
    chown -R generator:generator .

USER generator

ENTRYPOINT ["./entrypoint.sh"]
