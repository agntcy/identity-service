#!/bin/sh

envsubst '$VITE_APP_CLIENT_PORT $VITE_API_URL $VITE_APP_LOG_LEVEL $VITE_SEGMENT_ID $VITE_NODE_ENV $VITE_IAM_PRODUCT_ID $VITE_IAM_UI $VITE_IAM_API $VITE_IAM_OIDC_CLIENT_ID $VITE_IAM_OIDC_ISSUER' < /home/web/nginx/nginx.env.conf > /home/web/nginx/nginx.conf
exec "$@"
