/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import config from '@/config';
import { AuthConfig } from '@/types/okta';

export const getAuthConfig = () => {
  const iamConfig: AuthConfig = {
    iamUI: (config.IAM_UI as string) ?? '',
    iamApi: (config.IAM_API as string) ?? '',
    productId: (config.IAM_PRODUCT_ID as string) ?? '',
    oktaIssuer: (config.IAM_OIDC_ISSUER as string) ?? '',
    oktaClient: (config.IAM_OIDC_CLIENT_ID as string) ?? ''
  };
  return iamConfig;
};
