/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AuthConfigOptions} from '@/types/okta';

export const defaultAuthConfigOptions: AuthConfigOptions = {
  scopes: ['openid', 'offline_access'],
  renew: 'auto',
  redirectUri: `${window.location.protocol}//${window.location.host}/`,
  devMode: false,
  renewOnTabActivation: true,
  tabInactivityDuration: 1800, // 30 minutes
  syncStorage: true
};

export const ACCESS_TOKEN_NAME = 'accessToken';
export const ACCESS_TOKEN_EXPIRED_EVENT = 'expired';
