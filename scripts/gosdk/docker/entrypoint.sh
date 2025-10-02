#!/bin/sh
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0


#-----------------------------------------------------------------------------#
# Globals
ROOT_DIR="/identity"
OUT_DIR="$ROOT_DIR/out"
SDK_DIR="/api/client"
SPEC_DIR="$OUT_DIR/api/spec"
SWAGGER_DIR="generated"
SERVICE_V1ALPHA1_PROTO_PATH="proto/agntcy/identity/service/v1alpha1"
SERVICE_V1ALPHA1_GENERATED_PATH="$ROOT_DIR/generated/openapi/agntcy/identity/service/v1alpha1"
SWAGGER_SECURITY_DEFINITIONS_PATH="$ROOT_DIR/generated/openapi/agntcy/identity/service/v1alpha1/openapi_v2.swagger.json"
#-----------------------------------------------------------------------------#

string_contains() {
  # Arguments: $1 = src, $2 = substr
  case "$1" in
    *"$2"*) return 0 ;;
    *) return 1 ;;
  esac
}

do_cleanup_previous_version() {
  cd $OUT_DIR || exit
  if [ -d "$SDK_DIR/client" ]; then
    rm -rf $SDK_DIR/client
  fi
  if [ -d "$SDK_DIR/models" ]; then
    rm -rf $SDK_DIR/models
  fi
  cd $ROOT_DIR || exit
}

do_cleanup_swagger() {
  cd $OUT_DIR || exit
  if [ -d "$SWAGGER_DIR" ]; then
    rm -rf $SWAGGER_DIR
  fi
  cd $ROOT_DIR || exit
}

do_mixin() {
  cd $OUT_DIR || exit
  for file in "$1"/*.json; do
    fname=$(basename "${file}")
    if string_contains "$fname" "_service"; then
      swagger mixin "$1"/"$fname" "$SWAGGER_SECURITY_DEFINITIONS_PATH" > "$1"/final_"$fname"
      mv -f "$1"/final_"$fname" "$1"/"$fname"
    fi
  done
  cd $ROOT_DIR || exit
}

do_rename() {
  cd $OUT_DIR || exit
  for file in "$1"/*.json; do
    fname=$(basename "${file}")
    if ! string_contains "$fname" "_service"; then
      rm "$1"/"$fname"
    fi
  done
  for file in "$1"/*.json; do
    fname=$(basename "${file}")
    name=${fname%_service*}
    if string_contains "$fname" "_service"; then
      mv "$1"/"$fname" "$1"/"$name"".swagger.json"
    fi
  done
  cd $ROOT_DIR || exit
}

do_generate() {
  cd $SPEC_DIR || exit
  buf generate --template buf.gen.openapiv2.yaml  --output $ROOT_DIR --path "$1"
  cd $ROOT_DIR || exit
}

do_generate_go_client() {
  cd $OUT_DIR || exit
  for file in "$1"/*.json; do
    fname=$(basename "${file}")
    swagger generate client -f "$1"/"$fname" -A identity_service --template-dir "$ROOT_DIR"/templates --target ./"$SDK_DIR"
  done
  cd $ROOT_DIR || exit
}

do_generate_all() {
  do_generate $SERVICE_V1ALPHA1_PROTO_PATH
  do_mixin $SERVICE_V1ALPHA1_GENERATED_PATH
  do_rename $SERVICE_V1ALPHA1_GENERATED_PATH
}

do_generate_go_client_all() {
  do_generate_go_client $SERVICE_V1ALPHA1_GENERATED_PATH
}

# Generate the code

do_cleanup_previous_version
do_generate_all
do_generate_go_client_all
do_cleanup_swagger

echo "Done"
