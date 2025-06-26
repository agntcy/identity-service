/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import isEnvSet from '@/utils/is-env-set';

declare global {
  interface Window {
    apiUrl?: string;
    logLevel?: string;
    iamProductId?: string;
    iamUi?: string;
    iamApi?: string;
    iamOidcClientId?: string;
    iamOidcIssuer?: string;
    segmentId?: string;
  }
}

export default {
  API_HOST: isEnvSet(import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL : window.apiUrl,
  IAM_PRODUCT_ID: isEnvSet(import.meta.env.VITE_IAM_PRODUCT_ID) ? import.meta.env.VITE_IAM_PRODUCT_ID : window.iamProductId,
  LOG_LEVEL: isEnvSet(import.meta.env.VITE_APP_LOG_LEVEL) ? import.meta.env.VITE_APP_LOG_LEVEL : window.logLevel,
  IAM_UI: isEnvSet(import.meta.env.VITE_IAM_UI) ? import.meta.env.VITE_IAM_UI : window.iamUi,
  IAM_API: isEnvSet(import.meta.env.VITE_IAM_API) ? import.meta.env.VITE_IAM_API : window.iamApi,
  IAM_OIDC_CLIENT_ID: isEnvSet(import.meta.env.VITE_IAM_OIDC_CLIENT_ID) ? import.meta.env.VITE_IAM_OIDC_CLIENT_ID : window.iamOidcClientId,
  IAM_OIDC_ISSUER: isEnvSet(import.meta.env.VITE_IAM_OIDC_ISSUER) ? import.meta.env.VITE_IAM_OIDC_ISSUER : window.iamOidcIssuer,
  SEGMENT_ID: isEnvSet(import.meta.env.VITE_SEGMENT_ID) ? import.meta.env.VITE_SEGMENT_ID : window.segmentId
};
