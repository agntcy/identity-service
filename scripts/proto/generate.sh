#!/bin/sh
# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0


reset_generated_pb_go() {
  (
    cd ../..
    pb_files=$(git status --porcelain | grep api/server | sed s/^...// | tr '\n' ' ')

    for f in $pb_files; do
      echo "Resetting $f"
      git checkout -- "$f"
    done
  )
}

reset_generated_pb_go

cd docker &&
  docker compose -f buf-compose.yaml build --no-cache &&
  docker compose -f buf-compose.yaml run --rm -w /identity/code/api/spec buf-go run.sh
docker rmi docker-buf-go

if [ -d "../../api/server" ]; then
  cd ../../api/server &&
    grep -rl gnostic . | xargs sed -i '' 's|github.com/google/gnostic/openapiv3|github.com/google/gnostic-models/openapiv3|g'
fi
