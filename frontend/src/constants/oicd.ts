/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {WebStorageStateStore} from 'oidc-client-ts';
import {AuthProviderProps} from 'react-oidc-context';

export const defaultAuthConfigOptionsOIDC: Partial<AuthProviderProps> = {
  scope: 'profile openid email offline_access',
  redirect_uri: `${window.location.protocol}//${window.location.host}`,
  post_logout_redirect_uri: `${window.location.protocol}//${window.location.host}`,
  automaticSilentRenew: true,
  response_type: 'code',
  loadUserInfo: true,
  userStore: new WebStorageStateStore({store: localStorage}),
  stateStore: new WebStorageStateStore({store: localStorage})
};

export const onSigninCallback = () => {
  window.history.replaceState({}, document.title, window.location.pathname);
};
