/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import isEnvSet from '@/utils/is-env-set';
import * as CookieConsentVanilla from 'vanilla-cookieconsent';

export enum AuthType {
  IAM = 'iam',
  OIDC = 'oidc'
}

declare global {
  interface Window {
    apiUrl?: string;
    logLevel?: string;
    authType?: AuthType;
    iamProductId?: string;
    iamUi?: string;
    iamApi?: string;
    iamOidcClientId?: string;
    iamOidcIssuer?: string;
    iamMultiTenant?: boolean;
    oidcUi?: string;
    oidcClientId?: string;
    oidcIssuer?: string;
    segmentId?: string;
    docsUrl?: string;
    mazeId?: string;
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
      : import.meta.env.MODE === 'test' ? 'test-product-id' : undefined,
  LOG_LEVEL: isEnvSet(import.meta.env.VITE_APP_LOG_LEVEL)
    ? import.meta.env.VITE_APP_LOG_LEVEL
    : typeof window !== 'undefined'
      ? window.logLevel
      : undefined,
  AUTH_TYPE: isEnvSet(import.meta.env.VITE_AUTH_TYPE)
    ? (import.meta.env.VITE_AUTH_TYPE as AuthType)
    : typeof window !== 'undefined'
      ? window.authType
      : import.meta.env.MODE === 'test'
        ? AuthType.IAM
        : undefined,
  IAM_UI: isEnvSet(import.meta.env.VITE_IAM_UI)
    ? import.meta.env.VITE_IAM_UI
    : typeof window !== 'undefined'
      ? window.iamUi
      : import.meta.env.MODE === 'test' ? 'http://localhost:3000' : undefined,
  IAM_API: isEnvSet(import.meta.env.VITE_IAM_API)
    ? import.meta.env.VITE_IAM_API
    : typeof window !== 'undefined'
      ? window.iamApi
      : import.meta.env.MODE === 'test' ? 'http://localhost:8080' : undefined,
  IAM_OIDC_CLIENT_ID: isEnvSet(import.meta.env.VITE_IAM_OIDC_CLIENT_ID)
    ? import.meta.env.VITE_IAM_OIDC_CLIENT_ID
    : typeof window !== 'undefined'
      ? window.iamOidcClientId
      : import.meta.env.MODE === 'test' ? 'test-client-id' : undefined,
  IAM_OIDC_ISSUER: isEnvSet(import.meta.env.VITE_IAM_OIDC_ISSUER)
    ? import.meta.env.VITE_IAM_OIDC_ISSUER
    : typeof window !== 'undefined'
      ? window.iamOidcIssuer
      : import.meta.env.MODE === 'test' ? 'http://localhost:8080/oauth2/default' : undefined,
  IAM_MULTI_TENANT: isEnvSet(import.meta.env.VITE_IAM_MULTI_TENANT)
    ? import.meta.env.VITE_IAM_MULTI_TENANT === 'true'
    : typeof window !== 'undefined'
      ? window.iamMultiTenant
      : import.meta.env.MODE === 'test'
        ? true
        : undefined,
  OIDC_UI: isEnvSet(import.meta.env.VITE_OIDC_UI)
    ? import.meta.env.VITE_OIDC_UI
    : typeof window !== 'undefined'
      ? window.oidcUi
      : undefined,
  OIDC_CLIENT_ID: isEnvSet(import.meta.env.VITE_OIDC_CLIENT_ID)
    ? import.meta.env.VITE_OIDC_CLIENT_ID
    : typeof window !== 'undefined'
      ? window.oidcClientId
      : undefined,
  OIDC_ISSUER: isEnvSet(import.meta.env.VITE_OIDC_ISSUER)
    ? import.meta.env.VITE_OIDC_ISSUER
    : typeof window !== 'undefined'
      ? window.oidcIssuer
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
  APP_BASE_NAME: isEnvSet(import.meta.env.VITE_APP_BASE_NAME)
    ? import.meta.env.VITE_APP_BASE_NAME
    : typeof window !== 'undefined'
      ? window.appBaseName
      : '/'
};
