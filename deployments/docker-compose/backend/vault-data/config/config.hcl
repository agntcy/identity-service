// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

ui = true
disable_mlock = "true"
cluster_addr  = "http://127.0.0.1:8201"
api_addr      = "https://127.0.0.1:8200"

storage "raft" {
  path    = "/vault/data"
  node_id = "node1"
}

listener "tcp" {
  address = "[::]:8200"
  tls_disable = "true"
}