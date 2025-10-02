/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {OktaAuth, SignoutOptions, OktaAuthOptions} from '@okta/okta-auth-js';
import {AuthInfo} from './common';

export type OnAuthRequiredFunction = (oktaAuth: OktaAuth | undefined) => Promise<void> | void;
export type OnAuthResumeFunction = () => void;

export type UserAuthInfo = {
  first_name?: string;
  last_name?: string;
};

export interface Tenant {
  id?: string;
  name?: string;
}

export interface AuthConfigIAM {
  iamUI: string;
  iamApi: string;
  productId: string;
  oktaIssuer: string;
  oktaClient: string;
  configOptions?: AuthConfigOptionsIAM;
}

export interface AuthConfigOptionsIAM extends Omit<OktaAuthOptions, 'issuer' | 'clientId' | 'tokenManager' | 'services'> {
  renew?: 'manual' | 'auto';
  devMode?: boolean;
  expireEarlySeconds?: number;
  syncStorage?: boolean;
  renewOnTabActivation?: boolean;
  tabInactivityDuration?: number;
}

export interface AuthContextIAM {
  oktaInstance?: OktaAuth;
  authConfig?: AuthConfigIAM;
  authInfo?: AuthInfo | null;
  loading?: boolean;
  login?: () => void;
  logout?: (params: SignoutOptions | void) => void;
  tokenExpiredHttpHandler?: () => Promise<AuthInfo | undefined>;
  register?: () => void;
  switchTenant?: (tenant?: string | void) => void;
  _onAuthRequired?: OnAuthRequiredFunction;
}

export interface ErrorPropsIAM {
  error?: Error;
}

export interface SecurePropsIAM {
  showError?: boolean;
  isAllowed?: boolean;
  onAuthRequired?: OnAuthRequiredFunction;
  errorComponent?: React.FC<{error: Error}>;
}

export interface SecureRoutePropsIAM {
  isAllowed?: boolean;
  shouldRedirect?: boolean;
  redirectPath?: string;
  onAuthRequired?: OnAuthRequiredFunction;
  errorComponent?: React.FC<{error: Error}>;
}

export interface AuthProvidersPropsIAM {
  authConfig: AuthConfigIAM;
  loadingComponent?: React.ReactNode | React.FC;
  errorComponent?: React.FC<{error: Error}>;
  onAuthRequired?: OnAuthRequiredFunction;
}
