/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {AuthProviderProps} from 'react-oidc-context';

export const defaultAuthConfigOptionsOIDC: Partial<AuthProviderProps> = {
  scope: 'profile openid email offline_access',
  redirect_uri: `${window.location.protocol}//${window.location.host}`,
  post_logout_redirect_uri: `${window.location.protocol}//${window.location.host}`,
  automaticSilentRenew: true,
  response_type: 'code',
  loadUserInfo: true
};

// Callback to handle successful signin and clean up URL
export const onSigninCallback = () => {
  // Remove the payload from the URL after successful login
  // This ensures signinSilent works properly for token renewal
  window.history.replaceState({}, document.title, window.location.pathname);
};

export const ACCESS_TOKEN_NAME = 'accessToken';
export const ACCESS_TOKEN_EXPIRED_EVENT = 'expired';
