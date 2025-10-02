# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
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
    "ui",
    "bff",
    "docs",
  ]
}

target "docker-metadata-action" {
  tags = []
}

target "_common" {
  output = [
    "type=image",
  ]
  platforms = [
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

target "ui" {
  context = "."
  dockerfile = "./deployments/docker/frontend/Dockerfile"
  inherits = [
    "_common",
    "docker-metadata-action",
  ]
  tags = get_tag(target.docker-metadata-action.tags, "${target.ui.name}")
}

target "docs" {
  context = "."
  dockerfile = "./deployments/docker/docs/Dockerfile"
  inherits = [
    "_common",
    "docker-metadata-action",
  ]
  tags = get_tag(target.docker-metadata-action.tags, "${target.docs.name}")
}
