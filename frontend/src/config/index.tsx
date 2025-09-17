/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import isEnvSet from '@/utils/is-env-set';
import * as CookieConsentVanilla from 'vanilla-cookieconsent';

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
    docsUrl?: string;
    mazeId?: string;
    iamMultiTenant?: boolean;
    appBaseName?: string;
    CookieConsent: typeof CookieConsentVanilla;
  }
}

export default {
  API_HOST: isEnvSet(import.meta.env.VITE_API_URL)
    ? import.meta.env.VITE_API_URL
    : typeof window !== 'undefined'
      ? window.apiUrl
      : undefined,
  IAM_PRODUCT_ID: isEnvSet(import.meta.env.VITE_IAM_PRODUCT_ID)
    ? import.meta.env.VITE_IAM_PRODUCT_ID
    : typeof window !== 'undefined'
      ? window.iamProductId
      : undefined,
  LOG_LEVEL: isEnvSet(import.meta.env.VITE_APP_LOG_LEVEL)
    ? import.meta.env.VITE_APP_LOG_LEVEL
    : typeof window !== 'undefined'
      ? window.logLevel
      : undefined,
  IAM_UI: isEnvSet(import.meta.env.VITE_IAM_UI)
    ? import.meta.env.VITE_IAM_UI
    : typeof window !== 'undefined'
      ? window.iamUi
      : undefined,
  IAM_API: isEnvSet(import.meta.env.VITE_IAM_API)
    ? import.meta.env.VITE_IAM_API
    : typeof window !== 'undefined'
      ? window.iamApi
      : undefined,
  IAM_OIDC_CLIENT_ID: isEnvSet(import.meta.env.VITE_IAM_OIDC_CLIENT_ID)
    ? import.meta.env.VITE_IAM_OIDC_CLIENT_ID
    : typeof window !== 'undefined'
      ? window.iamOidcClientId
      : undefined,
  IAM_OIDC_ISSUER: isEnvSet(import.meta.env.VITE_IAM_OIDC_ISSUER)
    ? import.meta.env.VITE_IAM_OIDC_ISSUER
    : typeof window !== 'undefined'
      ? window.iamOidcIssuer
      : undefined,
  DOCS_URL: isEnvSet(import.meta.env.VITE_DOCS_URL)
    ? import.meta.env.VITE_DOCS_URL
    : typeof window !== 'undefined'
      ? window.docsUrl
      : undefined,
  SEGMENT_ID: isEnvSet(import.meta.env.VITE_SEGMENT_ID)
    ? import.meta.env.VITE_SEGMENT_ID
    : typeof window !== 'undefined'
      ? window.segmentId
      : undefined,
  MAZE_ID: isEnvSet(import.meta.env.VITE_MAZE_ID)
    ? import.meta.env.VITE_MAZE_ID
    : typeof window !== 'undefined'
      ? window.mazeId
      : undefined,
  IAM_MULTI_TENANT: isEnvSet(import.meta.env.VITE_IAM_MULTI_TENANT)
    ? import.meta.env.VITE_IAM_MULTI_TENANT === 'true'
    : typeof window !== 'undefined'
      ? (window.iamMultiTenant ?? true)
      : true,
  APP_BASE_NAME: isEnvSet(import.meta.env.VITE_APP_BASE_NAME)
    ? import.meta.env.VITE_APP_BASE_NAME
    : typeof window !== 'undefined'
      ? window.appBaseName
      : '/'
};
