/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import config, { AuthType } from '@/config';
import { AuthConfigIAM, AuthConfigOIDC } from '@/types/okta';

export const getAuthConfig = () => {
  if (!config.AUTH_TYPE) {
    console.warn('No AUTH_TYPE configured...');
    return undefined;
  } else if (config.AUTH_TYPE === AuthType.IAM) {
    return {
      iamUI: ((config.IAM_UI as string) ?? '').trim(),
      iamApi: ((config.IAM_API as string) ?? '').trim(),
      productId: ((config.IAM_PRODUCT_ID as string) ?? '').trim(),
      oktaIssuer: ((config.IAM_OIDC_ISSUER as string) ?? '').trim(),
      oktaClient: ((config.IAM_OIDC_CLIENT_ID as string) ?? '').trim()
    } as AuthConfigIAM;
  } else if (config.AUTH_TYPE === AuthType.OIDC) {
    return {
      oidcUi: ((config.OIDC_UI as string) ?? '').trim(),
      oktaIssuer: ((config.OIDC_ISSUER as string) ?? '').trim(),
      oktaClient: ((config.OIDC_CLIENT_ID as string) ?? '').trim()
    } as AuthConfigOIDC;
  } else {
    console.warn(`Unknown AUTH_TYPE configured: ${config.AUTH_TYPE}`);
    return undefined;
  }
};

export const isMultiTenant = () => {
  const multiTenantFlag = Boolean(config.IAM_MULTI_TENANT);
  const hasIAMConfig = !!(config.IAM_UI && config.IAM_OIDC_ISSUER && config.IAM_OIDC_CLIENT_ID);
  const isIam = config.AUTH_TYPE === AuthType.IAM;
  return multiTenantFlag && hasIAMConfig && isIam;
};
