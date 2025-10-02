#!/bin/sh
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0


set -o errexit
set -o nounset

PROTOC_VERSION=25.6

util_host_os() {
  case "$(uname -s)" in
    Linux)
      host_os=linux
      ;;
    Darwin)
      host_os=darwin
      ;;
    *)
      echo "ERROR: Unsupported OS. Only Linux and Mac OS X are supported."
      exit 1
      ;;
  esac
  echo "${host_os}"
}

util_host_arch() {
  case "$(uname -m)" in
    x86_64*)
      host_arch=x86_64
      ;;
    i?86_64*)
      host_arch=x86_64
      ;;
    amd64*)
      host_arch=x86_64
      ;;
    aarch64*)
      host_arch=aarch_64
      ;;
    arm64*)
      host_arch=aarch_64
      ;;
    ppc64le*)
      host_arch=ppcle_64
      ;;
    *)
      echo "ERROR: Unsupported host arch. Must be x86_64, arm64 or ppc64le."
      exit 1
      ;;
  esac
  echo "${host_arch}"
}

protoc_install() {
  (
    os=$(util_host_os)
    arch=$(util_host_arch)
    folder="protoc-${PROTOC_VERSION}-${os}-${arch}"
    file="${folder}.zip"

    ROOT=${Identity_ROOT:-}
    cd "${ROOT}/third_party" || return 1

    wget -O "${file}" "https://github.com/protocolbuffers/protobuf/releases/download/v${PROTOC_VERSION}/${file}"
    unzip -d "${folder}" -o "${file}"
    mv "${folder}/bin/protoc" /usr/local/bin
    mv "${folder}/include/google" protos
    rm -rf "${folder}"
    rm "${file}"
  )
}
