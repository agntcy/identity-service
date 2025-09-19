/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {AccessToken, IDToken, RefreshToken, OktaAuth, SignoutOptions, OktaAuthOptions} from '@okta/okta-auth-js';

export enum Idp {
  Google = 'Google',
  Github = 'Github',
  LinkedIn = 'LinkedIn',
  Cisco = 'Cisco',
  SecurityCloud = 'SecurityCloud',
  AppD = 'AppD'
}

export type OnAuthRequiredFunction = (oktaAuth: OktaAuth | undefined) => Promise<void> | void;
export type OnAuthResumeFunction = () => void;

export type UserAuthInfo = {
  first_name?: string;
  last_name?: string;
};

export type AuthConfigCommon = {
  oktaIssuer: string;
  oktaClient: string;
  configOptions?: AuthConfigOptions;
};

export interface AuthContextMEMORY {
  user?: User;
  isAuthenticated?: boolean;
  logout?: () => void;
  login?: ({username, password}: {username: string; password: string}) => void;
}

export interface User {
  username?: string;
  name?: string;
  tenant?: Tenant;
  /**
   * @deprecated The role object would be depreceate in favour of {@link User.productRole}
   */
  role?: string;
  productRole?: string;
  allProductRoles?: string[];
  region?: string;
  isCustomerSupport?: boolean;
}

export interface Tenant {
  id?: string;
  name?: string;
}

export interface AuthConfigIAM extends AuthConfigCommon {
  iamUI: string;
  iamApi: string;
  productId: string;
}

export interface AuthConfigOIDC extends AuthConfigCommon {
  oidcUi: string;
}

export interface AuthConfigOptions extends Omit<OktaAuthOptions, 'issuer' | 'clientId' | 'tokenManager' | 'services'> {
  renew?: 'manual' | 'auto';
  devMode?: boolean;
  expireEarlySeconds?: number;
  syncStorage?: boolean;
  renewOnTabActivation?: boolean;
  tabInactivityDuration?: number;
}

export interface AuthInfo {
  accessToken?: AccessToken;
  idToken?: IDToken;
  refreshToken?: RefreshToken;
  isAuthenticated?: boolean;
  userAuthInfo?: UserAuthInfo;
  user?: User;
}

export interface AuthContextCommon {
  authInfo?: AuthInfo | null;
  loading?: boolean;
  login?: () => void;
  logout?: (params: SignoutOptions | void) => void;
  tokenExpiredHttpHandler?: () => Promise<AuthInfo | undefined>;
}

export interface AuthContextIAM extends AuthContextCommon {
  oktaInstance?: OktaAuth;
  authConfig?: AuthConfigIAM;
  register?: () => void;
  switchTenant?: (tenant?: string | void) => void;
  _onAuthRequired?: OnAuthRequiredFunction;
}

export interface AuthContextOIDC extends AuthContextCommon {
  oktaInstance?: OktaAuth;
  authConfig?: AuthConfigOIDC;
  register?: (params: RegisterOIDCFunction | void) => void;
  _onAuthRequired?: OnAuthRequiredFunction;
}

export interface RegisterOIDCFunction {
  registerUrl?: string;
}

export interface LoginToIAMTenantFunction {
  iamUI: string;
  productId: string;
  tenantId: string;
  redirectUri?: string;
  startWithIdp?: Idp;
}

export interface ErrorProps {
  error?: Error;
}

export interface SecureProps {
  showError?: boolean;
  isAllowed?: boolean;
  onAuthRequired?: OnAuthRequiredFunction;
  errorComponent?: React.FC<{error: Error}>;
}

export interface SecureRouteProps {
  isAllowed?: boolean;
  shouldRedirect?: boolean;
  redirectPath?: string;
  onAuthRequired?: OnAuthRequiredFunction;
  errorComponent?: React.FC<{error: Error}>;
}

export interface AuthProvidersPropsOIDC {
  authConfig: AuthConfigOIDC;
  loadingComponent?: React.ReactNode | React.FC;
  errorComponent?: React.FC<{error: Error}>;
  onAuthRequired?: OnAuthRequiredFunction;
}

export interface AuthProvidersPropsIAM {
  authConfig: AuthConfigIAM;
  loadingComponent?: React.ReactNode | React.FC;
  errorComponent?: React.FC<{error: Error}>;
  onAuthRequired?: OnAuthRequiredFunction;
}
