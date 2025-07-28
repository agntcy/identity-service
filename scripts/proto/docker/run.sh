#!/bin/sh
# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0


set -o errexit
set -o nounset

PROTO_PACKAGE_NAME="outshift.identity.service.v1alpha1"
PROTO_PLATFORM_FILE_PATH="outshift/identity/service/v1alpha1/"

get_module_name_from_package() {
  dirname "$1" | xargs basename
}

echo ""
echo " _____         _____      ______          _        "
echo "|  __ \       |_   _|     | ___ \        | |       "
echo "| |  \/ ___     | | ___   | |_/ / __ ___ | |_ ___  "
echo "| | __ / _ \    | |/ _ \  |  __/ '__/ _ \| __/ _ \ "
echo "| |_\ \ (_) |   | | (_) | | |  | | | (_) | || (_) |"
echo " \____/\___/    \_/\___/  \_|  |_|  \___/ \__\___/ "
echo ""

Identity_ROOT=${Identity_ROOT:-}
. "${Identity_ROOT}/protoc.sh"
cd "${Identity_ROOT}"

protoc_install

cd "${Identity_ROOT}/local"

type_files=$(find . -path "*/internal/*/types/types.go")
packages=""

for file in $type_files; do
  dir="${file#./}"
  package=$(dirname "$dir")
  packages="$packages $package"
done

# go-to-protobuf doesn't support protobuf type "google.protobuf.Struct"
# this hack will add support for that.
for file in $type_files; do
  if grep -q "google.protobuf.Struct" "$file"; then
      echo "Tagging 'google.protobuf.Struct' fields..."
      sed -i 's/google\.protobuf\.Struct/GoogleStruct/g' "$file"

      if ! grep -q '^type GoogleStruct struct{}' "$file"; then
          echo "" >> "$file"
          echo "type GoogleStruct struct{}" >> "$file"
          echo "Added 'type GoogleStruct struct{}' at the end of $file."
      fi
  fi
  if grep -q "google.protobuf.Timestamp" "$file"; then
    echo "Tagging 'google.protobuf.Timestamp' fields..."
    sed -i 's/google\.protobuf\.Timestamp/GoogleTimestamp/g' "$file"

    if ! grep -q '^type GoogleTimestamp struct{}' "$file"; then
          echo "" >> "$file"
          echo "type GoogleTimestamp struct{}" >> "$file"
          echo "Added 'type GoogleTimestamp struct{}' at the end of $file."
      fi
  fi
done

packages=$(echo "$packages" | sed 's/\s$//' | sed 's/^\s//')

cd "${Identity_ROOT}/local/github.com/outshift/identity-service"

go get github.com/gogo/protobuf/proto
go mod vendor

packages_comma_separated=$(echo "$packages" | tr ' ' ',')

if [ -n "${packages_comma_separated}" ]; then
  # Detect GO enums
  go-enum-to-proto \
    --packages="${packages_comma_separated}" \
    --output-dir="${Identity_ROOT}/local"

  # Tag the GO enums by changing them to structs so that go-to-protobuf
  # can reference them by name and not by the underlying type (ex: int)
  go-enum-patch --patch="${Identity_ROOT}/local/enums.json" --type=go

  # FIX: quick fix for proto file /usr/local/go/src/time/generated.proto does not exist
  touch /usr/local/go/src/time/generated.proto

  go-to-protobuf \
    --apimachinery-packages="" \
    --proto-import="${Identity_ROOT}/third_party/protos" \
    --output-dir="${Identity_ROOT}/local" \
    --packages="${packages_comma_separated}" \
    --keep-gogoproto=false \
    -v=8

  # Change the enums detected earlier from proto messages to actual proto enums
  go-enum-patch --patch="${Identity_ROOT}/local/enums.json" --type=proto

  cd "${Identity_ROOT}"

  for package in $packages; do
    mkdir -p "local/output"
    module_name=$(get_module_name_from_package "${package}")
    protofile="local/${package}/generated.proto"

    # Patch the google.protobuf.Struct tag
    if grep -q "GoogleStruct" "$protofile"; then
      sed -i 's/optional GoogleStruct/optional \.google\.protobuf\.Struct/g' "$protofile"
      sed -i '/message GoogleStruct {/,/}/d' "$protofile"
      echo "import \"google/protobuf/struct.proto\";" >> "$protofile"
    fi

    # Patch the google.protobuf.Timestamp tag
    if grep -q "GoogleTimestamp" "$protofile"; then
      sed -i 's/optional GoogleTimestamp/optional \.google\.protobuf\.Timestamp/g' "$protofile"
      sed -i '/message GoogleTimestamp {/,/}/d' "$protofile"
      echo "import \"google/protobuf/timestamp.proto\";" >> "$protofile"
    fi

    cp "local/${package}/generated.proto" "local/output/${module_name}.proto"
  done

  protos=$(find local/output -iname "*.proto")

  for m in $protos; do
    sed -i 's/syntax = "proto2";/syntax = "proto3";/g' "${m}"
    sed -i 's|go_package = [^ ]\+|go_package = "github.com/outshift/identity-service/api/server/outshift/identity/service/v1alpha1;identity_service_sdk_go";|g' "${m}"
  done

  for package in $packages; do
    proto_file=$(get_module_name_from_package "${package}")
    import=$(echo "$package" | sed 's|\.|\\.|g')
    for m in $protos; do
      sed -i "s|^package.*|package ${PROTO_PACKAGE_NAME};|g" "${m}"
      sed -i "s|${import}/generated.proto|${PROTO_PLATFORM_FILE_PATH}${proto_file}.proto|g" "${m}"
    done
  done

  cp -r "${Identity_ROOT}/local/output/." "${Identity_ROOT}/code/backend/api/spec/proto/outshift/identity/service/v1alpha1"
fi

echo ""
echo "______ _   _______   _____                           _       "
echo "| ___ \ | | |  ___| |  __ \                         | |      "
echo "| |_/ / | | | |_    | |  \/ ___ _ __   ___ _ __ __ _| |_ ___ "
echo "| ___ \ | | |  _|   | | __ / _ \ '_ \ / _ \ '__/ _  | __/ _ \ "
echo "| |_/ / |_| | |     | |_\ \  __/ | | |  __/ | | (_| | ||  __/"
echo "\____/ \___/\_|      \____/\___|_| |_|\___|_|  \__,_|\__\___|"
echo ""

rm -rvf "${Identity_ROOT}/code/backend/api/server" 2>&1 || true

cd "${Identity_ROOT}/code/backend/api/spec"

# Format
/usr/local/bin/buf format -w

# Go
/usr/local/bin/buf generate --debug -v

# Python
/usr/local/bin/buf generate --include-imports --template buf.gen.python.yaml --output ../../sdk/python

# Openapi
/usr/local/bin/buf generate --template buf.gen.openapi.yaml --output ../spec/static/api/openapi/service/v1alpha1 --path proto/${PROTO_PLATFORM_FILE_PATH}

# Proto
/usr/local/bin/buf generate --template buf.gen.doc.yaml --output ../spec/static/api/proto/v1alpha1
