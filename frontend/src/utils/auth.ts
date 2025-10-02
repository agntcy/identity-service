/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import config, { AuthType } from '@/config';
import {AuthConfigIAM, AuthConfigOptionsIAM} from '@/types/auth/iam';
import { AuthConfigOIDC } from '@/types/auth/oidc';
import {AuthState, OktaAuth, ServiceManagerOptions, TokenManagerOptions, toRelativeUrl} from '@okta/okta-auth-js';

export const transformAuthState = async (oktaAuth: OktaAuth, authState: AuthState): Promise<any> => {
  try {
    if (!authState.isAuthenticated) {
      return authState;
    }
    // extra requirement: user must have valid Okta SSO session
    const user = await oktaAuth.token.getUserInfo();
    authState.isAuthenticated = !!user; // convert to boolean
    authState.userAuthInfo = user; // also store userAuthInfo object on authState
    return authState;
  } catch (error) {
    console.debug(error);
    throw new Error('Error on transformAuthState.');
  }
};

export const createOktaInstance = ({issuer, clientId, config}: {issuer: string; clientId: string; config?: AuthConfigOptionsIAM}): OktaAuth => {
  try {
    const tokenManager: TokenManagerOptions = {
      autoRenew: config?.renew === 'auto',
      autoRemove: config?.renew === 'auto',
      syncStorage: config?.syncStorage
    };
    if (config?.expireEarlySeconds && process.env.NODE_ENV !== 'production') {
      tokenManager.expireEarlySeconds = config.expireEarlySeconds;
    }
    const services: ServiceManagerOptions = {
      autoRenew: config?.renew === 'auto',
      autoRemove: config?.renew === 'auto',
      renewOnTabActivation: config?.renewOnTabActivation,
      tabInactivityDuration: config?.tabInactivityDuration ?? 1800
    };
    return new OktaAuth({
      postLogoutRedirectUri: config?.postLogoutRedirectUri ?? config?.redirectUri,
      ...config,
      issuer: issuer,
      clientId: clientId,
      transformAuthState: transformAuthState as any,
      tokenManager: tokenManager,
      services: services,
    });
  } catch (error) {
    console.debug(error);
    throw new Error('Error on createOktaInstance.');
  }
};

export const getRelativeUrl = () => {
  return toRelativeUrl(window.location.href, `${window.location.origin}/`);
};

export const getSearchParams = () => {
  return new URLSearchParams(document.location.search);
};

export const isMultiTenant = () => {
  const multiTenantFlag = Boolean(config.IAM_MULTI_TENANT);
  const hasIAMConfig = !!(config.IAM_UI && config.IAM_OIDC_ISSUER && config.IAM_OIDC_CLIENT_ID);
  const isIam = config.AUTH_TYPE === AuthType.IAM;
  return multiTenantFlag && hasIAMConfig && isIam;
};

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
      oidcIssuer: ((config.OIDC_ISSUER as string) ?? '').trim(),
      oidcClient: ((config.OIDC_CLIENT_ID as string) ?? '').trim()
    } as AuthConfigOIDC;
  } else {
    console.warn(`Unknown AUTH_TYPE configured: ${config.AUTH_TYPE}`);
    return undefined;
  }
};
