/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import config from '@/config';
import { AuthConfigIAM, AuthConfigOIDC } from '@/types/okta';

export const getAuthConfig = () => {
  if (config.MULTI_TENANT) {
    const iamConfig: AuthConfigIAM = {
      iamUI: ((config.IAM_UI as string) ?? '').trim(),
      iamApi: ((config.IAM_API as string) ?? '').trim(),
      productId: ((config.IAM_PRODUCT_ID as string) ?? '').trim(),
      oktaIssuer: ((config.IAM_OIDC_ISSUER as string) ?? '').trim(),
      oktaClient: ((config.IAM_OIDC_CLIENT_ID as string) ?? '').trim()
    };
    return iamConfig;
  } else {
    const oidcConfig: AuthConfigOIDC = {
      oidcUi: ((config.OIDC_UI as string) ?? '').trim(),
      oktaIssuer: ((config.OIDC_ISSUER as string) ?? '').trim(),
      oktaClient: ((config.OIDC_CLIENT_ID as string) ?? '').trim()
    };
    return oidcConfig;
  }
};

export const isMultiTenant = () => {
  const multiTenantFlag = Boolean(config.MULTI_TENANT);
  const hasIAMConfig = !!(config.IAM_UI && config.IAM_OIDC_ISSUER && config.IAM_OIDC_CLIENT_ID);
  return multiTenantFlag && hasIAMConfig;
};
