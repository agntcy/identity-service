/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {useMemo} from 'react';
import OktaAuth, {SignoutOptions, TokenResponse} from '@okta/okta-auth-js';
import {createOktaInstance, getAuthConfig, getRelativeUrl, getSearchParams} from '@/utils/auth';
import {AuthConfigIAM, Tenant} from '@/types/auth/iam';
import {Loading} from '@/components/ui/loading';
import {AuthError} from '@/components/router/auth-error';
import AuthContextIAM from './auth-context-iam';
import {ACCESS_TOKEN_EXPIRED_EVENT, ACCESS_TOKEN_NAME, defaultAuthConfigOptionsIAM} from '@/constants/iam';
import {AuthInfo, User} from '@/types/auth/common';

const AuthProviderIAM: React.FC<React.PropsWithChildren> = ({children}) => {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [authInfo, setAuthInfo] = React.useState<AuthInfo | undefined>(undefined);
  const [handleError, setHandleError] = React.useState<Error | null>(null);
  const [controller, setController] = React.useState<boolean | undefined>(undefined);

  const authConfig: AuthConfigIAM = useMemo(() => {
    return {
      ...(getAuthConfig() as AuthConfigIAM)
    };
  }, []);

  const newAuthConfig: AuthConfigIAM = React.useMemo(() => {
    return {
      ...authConfig,
      iamUI: authConfig?.iamUI?.trim().replace(/\/+$/g, ''),
      productId: authConfig?.productId?.trim(),
      oktaClient: authConfig.oktaClient?.trim(),
      oktaIssuer: authConfig.oktaIssuer?.trim(),
      configOptions: {...defaultAuthConfigOptionsIAM, ...authConfig?.configOptions}
    };
  }, [authConfig]);

  const isValidOktaConfig: boolean = React.useMemo(() => {
    if (
      !newAuthConfig?.oktaIssuer ||
      newAuthConfig?.oktaIssuer === '' ||
      !newAuthConfig?.oktaClient ||
      newAuthConfig?.oktaClient === ''
    ) {
      return false;
    }
    return true;
  }, [newAuthConfig]);

  const isValidConfig: boolean = React.useMemo(() => {
    if (
      !newAuthConfig?.iamApi ||
      newAuthConfig?.iamApi === '' ||
      !newAuthConfig?.iamUI ||
      newAuthConfig?.iamUI === '' ||
      !newAuthConfig?.productId ||
      newAuthConfig?.productId === ''
    ) {
      return false;
    }
    return true;
  }, [newAuthConfig]);

  const oktaInstance: OktaAuth | null = React.useMemo(() => {
    if (!isValidOktaConfig) {
      return null;
    }
    return createOktaInstance({
      issuer: newAuthConfig?.oktaIssuer,
      clientId: newAuthConfig?.oktaClient,
      config: newAuthConfig.configOptions
    });
  }, [newAuthConfig, isValidOktaConfig]);

  const isAutoRenew = newAuthConfig?.configOptions?.renew === 'auto';

  const searchParams = getSearchParams();

  const setCredentials = (newAuthInfo: AuthInfo) => {
    return new Promise((resolve, reject) => {
      try {
        if (newAuthInfo?.accessToken && newAuthInfo?.idToken && newAuthInfo?.userAuthInfo) {
          const {accessToken, idToken, refreshToken, userAuthInfo, isAuthenticated} = newAuthInfo;
          const user: User = {};
          const tenant: Tenant = {};
          if (userAuthInfo?.first_name && userAuthInfo?.last_name) {
            user.name = `${userAuthInfo.first_name} ${userAuthInfo.last_name}`;
          }
          if (accessToken?.claims?.sub) {
            user.username = accessToken?.claims?.sub;
          }
          if (accessToken?.claims?.tenant_name) {
            tenant.id = accessToken.claims.tenant as string;
            tenant.name = accessToken.claims.tenant_name as string;
          } else if (idToken?.claims?.tenant_name) {
            tenant.id = idToken.claims.tenant as string;
            tenant.name = idToken.claims.tenant_name as string;
          }
          user.tenant = tenant;
          if (accessToken?.claims?.product_roles) {
            if (typeof accessToken.claims.product_roles === 'string') {
              user.productRole = accessToken.claims.product_roles;
            } else if (Array.isArray(accessToken.claims.product_roles)) {
              user.allProductRoles = accessToken.claims.product_roles as string[];
            }
          } else if (idToken.claims.product_roles) {
            if (typeof idToken.claims.product_roles === 'string') {
              user.productRole = idToken.claims.product_roles;
            } else if (Array.isArray(idToken.claims.product_roles)) {
              user.allProductRoles = idToken.claims.product_roles as string[];
            }
          }
          const isCustomerSupport =
            (accessToken?.claims?.customer_support as boolean | undefined) ||
            (idToken?.claims?.customer_support as boolean | undefined);
          if (isCustomerSupport) {
            oktaInstance?.tokenManager.removeRefreshToken();
          }
          user.isCustomerSupport = isCustomerSupport;
          setAuthInfo({
            accessToken,
            idToken,
            refreshToken: isCustomerSupport ? undefined : refreshToken,
            isAuthenticated,
            user,
            userAuthInfo: undefined
          });
          setController(true);
          resolve({});
        }
        reject(new Error('No accessToken, idToken or userAuthInfo found in newAuthInfo.'));
      } catch (error) {
        console.debug(error);
        reject(new Error('Error on setCredentials.'));
      }
    });
  };

  const cleanCredentials = () => {
    try {
      setController(false);
      setAuthInfo(undefined);
    } catch (error) {
      console.error(error);
    }
  };

  const logout = async (logoutOptions: void | SignoutOptions = {}) => {
    try {
      if (isAutoRenew) {
        await oktaInstance?.stop();
      }
      await oktaInstance?.signOut(logoutOptions || {});
      oktaInstance?.tokenManager.clear();
    } catch (error) {
      console.error(error);
    }
  };

  const login = () => {
    try {
      const queryParams = new URLSearchParams({
        ...(newAuthConfig?.configOptions?.redirectUri
          ? {redirectUri: newAuthConfig?.configOptions?.redirectUri?.trim()}
          : {})
      });
      window.location.href = `${newAuthConfig?.iamUI}/${newAuthConfig?.productId}/login?${queryParams.toString()}`;
    } catch (error) {
      console.error(error);
      setHandleError(new Error('login.'));
    }
  };

  const register = () => {
    try {
      const queryParams = new URLSearchParams({
        ...(newAuthConfig?.configOptions?.redirectUri
          ? {redirectUri: newAuthConfig?.configOptions?.redirectUri?.trim()}
          : {})
      });
      window.location.href = `${newAuthConfig?.iamUI}/${newAuthConfig?.productId}/register?${queryParams.toString()}`;
    } catch (error) {
      console.error(error);
      setHandleError(new Error('register.'));
    }
  };

  const getAndSetTokens = () => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<TokenResponse>(async (resolve, reject) => {
      try {
        if (oktaInstance?.isLoginRedirect()) {
          const tokenResponse = await oktaInstance?.token?.parseFromUrl();
          if (tokenResponse?.tokens) {
            oktaInstance?.tokenManager?.setTokens(tokenResponse.tokens);
            resolve(tokenResponse);
          }
        }
        reject(new Error('No tokens found in getAndSetTokens.'));
      } catch (error) {
        console.debug(error);
        reject(new Error('Error on getAndSetTokens.'));
      }
    });
  };

  const onAccessTokenExpired = () => {
    return oktaInstance?.tokenManager.on(ACCESS_TOKEN_EXPIRED_EVENT, async (key) => {
      if (key === ACCESS_TOKEN_NAME) {
        const accessToken = await oktaInstance?.getOrRenewAccessToken();
        if (accessToken) {
          void updateAuthState();
        } else {
          void logout();
        }
      }
    });
  };

  const addTokenExpiredHandler = () => {
    onAccessTokenExpired();
  };

  const tokenExpiredHttpHandler = async () => {
    try {
      const accessToken = await oktaInstance?.getOrRenewAccessToken();
      if (accessToken) {
        const newAuthInfo = (await oktaInstance?.authStateManager?.updateAuthState()) as AuthInfo;
        if (newAuthInfo?.isAuthenticated) {
          await setCredentials(newAuthInfo);
          return newAuthInfo;
        } else {
          cleanCredentials();
          return;
        }
      } else {
        cleanCredentials();
        return;
      }
    } catch (error) {
      console.debug(error);
      cleanCredentials();
      return;
    }
  };

  const switchTenant = (tenant?: string | void) => {
    try {
      const queryParams = new URLSearchParams({
        ...(tenant ? {tenant} : {}),
        ...(newAuthConfig?.configOptions?.redirectUri
          ? {redirectUri: newAuthConfig?.configOptions?.redirectUri?.trim()}
          : {})
      });
      window.location.href = `${newAuthConfig?.iamUI}/${newAuthConfig?.productId}/tenants?${queryParams.toString()}`;
    } catch (error) {
      console.debug(error);
    }
  };

  const signIn = (state: any) => {
    try {
      void oktaInstance?.token.getWithRedirect({
        scopes: newAuthConfig?.configOptions?.scopes,
        state: JSON.stringify(state ?? {url: getRelativeUrl()})
      });
    } catch (error) {
      console.debug(error);
    }
  };

  const updateAuthState = async () => {
    try {
      const newAuthInfo = (await oktaInstance?.authStateManager?.updateAuthState()) as AuthInfo;
      if (newAuthInfo?.isAuthenticated) {
        await setCredentials(newAuthInfo);
      }
    } catch (error) {
      console.debug(error);
      cleanCredentials();
    }
  };

  const authStart = async () => {
    try {
      await getAndSetTokens();
      if (!isAutoRenew) {
        void updateAuthState();
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      try {
        if (!isAutoRenew) {
          void updateAuthState();
          if (!authInfo?.accessToken) {
            cleanCredentials();
          } else if (oktaInstance?.tokenManager.hasExpired(authInfo.accessToken)) {
            return switchTenant(authInfo.accessToken.claims.tenant as string);
          }
        } else {
          const isAuth = await oktaInstance?.isAuthenticated();
          if (!isAuth) {
            cleanCredentials();
          }
        }
      } catch (error) {
        console.debug(error);
        cleanCredentials();
      }
    }
  };

  const startOktaService = async () => {
    try {
      oktaInstance?.authStateManager?.subscribe(async (newAuthInfo: AuthInfo) => {
        try {
          if (newAuthInfo?.isAuthenticated) {
            await setCredentials(newAuthInfo);
          }
        } catch (error) {
          console.debug(error);
          cleanCredentials();
        }
      });
      void updateAuthState();
      await oktaInstance?.start();
    } catch (error) {
      console.debug(error);
      cleanCredentials();
    }
  };

  React.useEffect(() => {
    if (controller === undefined) {
      return;
    }
    setLoading(false);
  }, [controller]);

  React.useEffect(() => {
    const main = () => {
      try {
        const sessionRequest = searchParams.get('request');
        if (sessionRequest) {
          signIn({sessionRequest});
        } else {
          if (!isAutoRenew) {
            addTokenExpiredHandler();
          }
          void authStart();
          if (isAutoRenew) {
            void startOktaService();
          }
        }
      } catch (error) {
        console.debug(error);
      }
    };
    void main();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (!isValidConfig || !isValidOktaConfig) {
    return (
      <AuthError
        error={
          new Error('No authConfig passed to <AuthProvider> component or invalid config passed to <AuthProvider> component.')
        }
      />
    );
  }

  if (isAutoRenew && !newAuthConfig?.configOptions?.scopes?.includes('offline_access')) {
    return <AuthError error={new Error('Error on renew options.')} />;
  }

  if (!isAutoRenew && newAuthConfig.configOptions?.renewOnTabActivation) {
    return <AuthError error={new Error('Error on renewOnTabActivation options (renew needs to be set to "auto").')} />;
  }

  if (!oktaInstance) {
    return <AuthError error={new Error('No oktaInstance created in <AuthProvider> component.')} />;
  }

  if (handleError) {
    return <AuthError error={handleError} />;
  }

  if (!oktaInstance._oktaUserAgent) {
    console.warn('_oktaUserAgent is not available on auth SDK instance. Please use okta-auth-js@^5.3.1.');
  }

  if (newAuthConfig?.configOptions?.expireEarlySeconds) {
    console.warn(
      "expireEarlySeconds option it's only to be used in local development, in production it's disabled by default."
    );
  }

  const values = {
    authConfig: {...newAuthConfig},
    oktaInstance,
    authInfo,
    loading,
    login,
    register,
    logout,
    tokenExpiredHttpHandler,
    switchTenant
  };

  return <AuthContextIAM.Provider value={values}>{children}</AuthContextIAM.Provider>;
};

export default AuthProviderIAM;
