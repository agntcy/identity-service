#!/bin/sh
# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0


envsubst '$VITE_APP_CLIENT_PORT $VITE_API_URL $VITE_APP_LOG_LEVEL $VITE_SEGMENT_ID $VITE_NODE_ENV $VITE_IAM_PRODUCT_ID $VITE_IAM_UI $VITE_IAM_API $VITE_IAM_OIDC_CLIENT_ID $VITE_IAM_OIDC_ISSUER $VITE_AUTH_TYPE $VITE_OIDC_UI $VITE_OIDC_CLIENT_ID $VITE_OIDC_ISSUER $VITE_IAM_MULTI_TENANT $VITE_DOCS_URL $VITE_MAZE_ID $VITE_APP_BASE_NAME' < /home/web/nginx/nginx.env.conf > /home/web/nginx/nginx.conf
envsubst '$VITE_OIDC_UI $VITE_API_URL' < /home/web/nginx/csp-header.env.conf > /home/web/nginx/csp-header.conf
exec "$@"
