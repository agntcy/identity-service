/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import {AuthInfo} from './common';

export interface AuthConfigOIDC {
  oidcUi: string;
  oidcIssuer: string;
  oidcClient: string;
}

export interface AuthContextOIDC {
  authConfig?: AuthConfigOIDC;
  authInfo?: AuthInfo | null;
  loading?: boolean;
  login?: () => void;
  logout?: () => void;
  tokenExpiredHttpHandler?: () => Promise<AuthInfo | undefined>;
  register?: () => void;
}

export interface SecureRoutePropsOIDC {
  isAllowed?: boolean;
  shouldRedirect?: boolean;
  redirectPath?: string;
  errorComponent?: React.FC<{error: Error}>;
}
