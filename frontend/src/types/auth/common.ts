/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {AccessToken, IDToken, RefreshToken} from '@okta/okta-auth-js';
import {Tenant, UserAuthInfo} from './iam';

export interface User {
  username?: string;
  name?: string;
  tenant?: Tenant;
  productRole?: string;
  allProductRoles?: string[];
  region?: string;
  isCustomerSupport?: boolean;
}

export interface AuthInfo {
  accessToken?: AccessToken;
  idToken?: IDToken;
  refreshToken?: RefreshToken;
  isAuthenticated?: boolean;
  userAuthInfo?: UserAuthInfo;
  user?: User;
}
