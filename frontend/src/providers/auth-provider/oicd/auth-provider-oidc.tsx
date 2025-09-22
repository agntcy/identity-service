/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import OktaAuth, {TokenResponse, SignoutOptions} from '@okta/okta-auth-js';
import {AuthConfigOIDC, AuthInfo, RegisterOIDCFunction, User} from '@/types/okta';
import {getAuthConfig} from '@/utils/get-auth-config';
import {ACCESS_TOKEN_EXPIRED_EVENT, ACCESS_TOKEN_NAME, defaultAuthConfigOptions} from '@/constants/okta';
import {createOktaInstance, getRelativeUrl, getSearchParams} from '@/utils/okta';
import {Loading} from '@/components/ui/loading';
import {AuthError} from '@/components/router/auth-error';
import AuthContextOIDC from './auth-context-oidc';

const AuthProviderOIDC: React.FC<React.PropsWithChildren> = ({children}) => {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [authInfo, setAuthInfo] = React.useState<AuthInfo | undefined>(undefined);
  const [handleError, setHandleError] = React.useState<Error | null>(null);
  const [controller, setController] = React.useState<boolean | undefined>(undefined);

  const authConfig: AuthConfigOIDC = React.useMemo(() => {
    return {
      ...(getAuthConfig() as AuthConfigOIDC)
    };
  }, []);

  const newAuthConfig: AuthConfigOIDC = React.useMemo(() => {
    return {
      ...authConfig,
      oktaClient: authConfig.oktaClient?.trim(),
      oktaIssuer: authConfig.oktaIssuer?.trim(),
      oidcUi: authConfig.oidcUi?.trim(),
      configOptions: {...defaultAuthConfigOptions, ...authConfig?.configOptions}
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

  const isValidCCIConfig: boolean = React.useMemo(() => {
    if (!newAuthConfig?.oidcUi || newAuthConfig?.oidcUi === '') {
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
          if (userAuthInfo?.first_name && userAuthInfo?.last_name) {
            user.name = `${userAuthInfo.first_name} ${userAuthInfo.last_name}`;
          }
          if (newAuthInfo?.accessToken?.claims?.sub) {
            user.username = newAuthInfo.accessToken?.claims?.sub;
          }
          setAuthInfo({accessToken, idToken, refreshToken, isAuthenticated, user, userAuthInfo: undefined});
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

  const login = async () => {
    try {
      await oktaInstance?.token.getWithRedirect({
        scopes: newAuthConfig?.configOptions?.scopes,
        state: JSON.stringify({url: getRelativeUrl()})
      });
    } catch (error) {
      console.error(error);
      setHandleError(new Error('login.'));
    }
  };

  const register = (params?: void | RegisterOIDCFunction) => {
    try {
      const registerUrl =
        typeof params === 'object' && params?.registerUrl ? params.registerUrl : `${newAuthConfig?.oidcUi}/signin/register`;
      window.location.href = registerUrl;
    } catch (error) {
      console.error(error);
      setHandleError(new Error('register.'));
    }
  };

  const logout = async (logoutOptions?: void | SignoutOptions) => {
    try {
      if (isAutoRenew) {
        await oktaInstance?.stop();
      }
      const options = logoutOptions || {};
      await oktaInstance?.signOut(options);
      oktaInstance?.tokenManager.clear();
    } catch (error) {
      console.debug(error);
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

  const startOktaService = async () => {
    try {
      oktaInstance?.authStateManager?.subscribe(async (newAuthInfo: AuthInfo) => {
        try {
          if (newAuthInfo?.isAuthenticated) {
            return await setCredentials(newAuthInfo);
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
            onAccessTokenExpired();
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

  if (!isValidCCIConfig || !isValidOktaConfig) {
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
    tokenExpiredHttpHandler
  };

  return <AuthContextOIDC.Provider value={values}>{children}</AuthContextOIDC.Provider>;
};

export default AuthProviderOIDC;
