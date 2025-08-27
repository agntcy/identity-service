# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0

# Docker build args
variable "IMAGE_REPO" {default = ""}
variable "IMAGE_TAG" {default = "v0.0.0"}

function "get_tag" {
  params = [tags, name]
  result = [for tag in tags: "${IMAGE_REPO}/${name}:${tag}"]
}

group "default" {
  targets = [
    "bff",
  ]
}

target "docker-metadata-action" {
  tags = []
}

target "_common" {
  output = [
    "type=image",
  ]
  services = [
    "linux/amd64",
    "linux/arm64",
  ]
}

target "bff" {
  context = "."
  dockerfile = "./deployments/docker/backend/Dockerfile.bff"
  inherits = [
    "_common",
    "docker-metadata-action",
  ]
  tags = get_tag(target.docker-metadata-action.tags, "${target.bff.name}")
}
