import {AccessToken, IDToken, RefreshToken, OktaAuth, SignoutOptions, OktaAuthOptions} from '@okta/okta-auth-js';

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

export interface User {
  username?: string;
  name?: string;
  tenant?: Tenant;
  productRole?: string;
  allProductRoles?: string[];
  region?: string;
  isCustomerSupport?: boolean;
}

export interface AuthConfig {
  oktaIssuer: string;
  oktaClient: string;
  iamUI: string;
  iamApi: string;
  productId: string;
  configOptions?: AuthConfigOptions;
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

export interface AuthContextProps {
  authConfig: AuthConfig;
  oktaInstance: OktaAuth;
  authInfo?: AuthInfo;
  loading: boolean;
  login: () => void;
  register: (params: {registerUrl: string} | void) => void;
  logout: (logoutOptions?: SignoutOptions) => Promise<void>;
  tokenExpiredHttpHandler: () => Promise<AuthInfo | undefined>;
  switchTenant?: (tenant?: string | void) => void;
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

export interface AuthProvidersProps {
  authConfig?: AuthConfig;
  loadingComponent?: React.ReactNode | React.FC;
  errorComponent?: React.FC<{error: Error}>;
  children: React.ReactNode;
  onAuthRequired?: OnAuthRequiredFunction;
}
