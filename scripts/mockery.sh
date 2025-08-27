#!/bin/sh
# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0

docker run --rm -v "$PWD/../backend:/identity" -w /identity vektra/mockery:3
