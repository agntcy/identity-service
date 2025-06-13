/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AuthConfigOptions} from '@/types/okta';
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

export const createOktaInstance = ({issuer, clientId, config}: {issuer: string; clientId: string; config?: AuthConfigOptions}): OktaAuth => {
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
