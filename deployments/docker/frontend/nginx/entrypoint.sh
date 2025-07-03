#!/bin/sh
# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0


envsubst '$VITE_APP_CLIENT_PORT $VITE_API_URL $VITE_APP_LOG_LEVEL $VITE_SEGMENT_ID $VITE_NODE_ENV $VITE_IAM_PRODUCT_ID $VITE_IAM_UI $VITE_IAM_API $VITE_IAM_OIDC_CLIENT_ID $VITE_IAM_OIDC_ISSUER $VITE_DOCS_URL' < /home/web/nginx/nginx.env.conf > /home/web/nginx/nginx.conf
exec "$@"
