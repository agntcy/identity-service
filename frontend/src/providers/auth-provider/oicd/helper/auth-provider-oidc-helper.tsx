/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import {Loading} from '@/components/ui/loading';
import {AuthError} from '@/components/router/auth-error';
import {AuthProviderProps, useAuth} from 'react-oidc-context';
import {getAuthConfig} from '@/utils/auth';
import AuthContextOIDCHelper from './auth-context-oidc-helper';
import {AuthInfo, User} from '@/types/auth/common';
import {AuthConfigOIDC} from '@/types/auth/oidc';

const AuthProviderOIDCHelper: React.FC<React.PropsWithChildren<AuthProviderProps>> = ({children, ...props}) => {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [authInfo, setAuthInfo] = React.useState<AuthInfo | undefined>(undefined);
  const [handleError, setHandleError] = React.useState<Error | null>(null);
  const [controller, setController] = React.useState<boolean | undefined>(undefined);

  const auth = useAuth();

  const setCredentials = () => {
    return new Promise<AuthInfo>((resolve, reject) => {
      try {
        if (auth.user?.access_token && auth.user.id_token && auth.user.profile) {
          const {access_token, id_token, profile, refresh_token} = auth.user;
          const user: User = {};
          if (profile.name) {
            user.name = profile.name;
          } else if (profile.nickname) {
            user.name = profile.nickname;
          } else if (profile.given_name && profile.family_name) {
            user.name = `${profile.given_name} ${profile.family_name}`;
          }
          if (profile.email) {
            user.username = profile.email;
          } else if (profile.preferred_username) {
            user.username = profile.preferred_username;
          } else if (profile.ccoid) {
            user.username = profile.ccoid as string;
          }
          const newAuthInfo: AuthInfo = {
            accessToken: {accessToken: access_token} as any,
            idToken: {idToken: id_token} as any,
            refreshToken: {refreshToken: refresh_token} as any,
            isAuthenticated: auth.isAuthenticated,
            user,
            userAuthInfo: undefined
          };
          setAuthInfo(newAuthInfo);
          setController(true);
          resolve(newAuthInfo);
        } else {
          reject(new Error('No accessToken, idToken or userAuthInfo found in newAuthInfo.'));
        }
      } catch (error) {
        console.debug(error);
        reject(new Error('Error on setCredentials.'));
      }
    });
  };

  const login = async () => {
    try {
      await auth.signinRedirect({
        scope: props.userManager?.settings.scope
      });
    } catch (error) {
      console.error(error);
      setHandleError(new Error('login.'));
    }
  };

  const register = () => {
    try {
      const temp = getAuthConfig() as AuthConfigOIDC;
      window.location.href = temp.oidcUi;
    } catch (error) {
      console.error(error);
      setHandleError(new Error('register.'));
    }
  };

  const logout = async () => {
    try {
      cleanCredentials();
      auth.stopSilentRenew();
      await auth.clearStaleState();
      await auth.removeUser();
      await auth.revokeTokens(['access_token', 'refresh_token']);
    } catch (error) {
      console.debug(error);
    }
  };

  const cleanCredentials = () => {
    try {
      setController(false);
      setAuthInfo(undefined);
    } catch (error) {
      console.error(error);
    }
  };

  const tokenExpiredHttpHandler = async (): Promise<AuthInfo | undefined> => {
    try {
      const user = await auth.signinSilent();
      if (user && user.access_token) {
        const updatedAuthInfo = await setCredentials();
        return updatedAuthInfo;
      }
      cleanCredentials();
      return undefined;
    } catch (error) {
      console.debug('Token renewal failed:', error);
      if (auth.user && auth.isAuthenticated) {
        try {
          const updatedAuthInfo = await setCredentials();
          return updatedAuthInfo;
        } catch (setError) {
          console.debug('Failed to set credentials:', setError);
        }
      }
      cleanCredentials();
      return undefined;
    }
  };

  React.useEffect(() => {
    if (controller === undefined) {
      return;
    }
    setLoading(false);
  }, [controller]);

  React.useEffect(() => {
    return auth.events.addAccessTokenExpiring(() => {
      console.warn('Access token expiring...');
      void auth.signinSilent();
    });
  }, [auth, auth.events, auth.signinSilent]);

  React.useEffect(() => {
    const main = async () => {
      try {
        if (auth.isLoading) {
          return;
        } else if (!auth.isAuthenticated || !auth.user) {
          cleanCredentials();
          return;
        } else if (auth.isAuthenticated && auth.user) {
          auth.startSilentRenew(); // start silent renew
          await setCredentials();
          return;
        } else {
          cleanCredentials();
          return;
        }
      } catch (error) {
        console.debug(error);
        setHandleError(new Error('Error in authentication process.'));
      }
    };
    void main();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  if (auth.isLoading || loading) {
    return <Loading />;
  }

  if (auth.error) {
    return <AuthError error={auth.error} />;
  }

  if (handleError) {
    return <AuthError error={handleError} />;
  }

  const values = {
    authConfig: {
      oidcUi: (getAuthConfig() as AuthConfigOIDC).oidcUi,
      oidcIssuer: (getAuthConfig() as AuthConfigOIDC).oidcIssuer,
      oidcClient: (getAuthConfig() as AuthConfigOIDC).oidcClient
    },
    authInfo,
    loading: auth.isLoading || loading,
    login,
    register,
    logout,
    tokenExpiredHttpHandler
  };

  return <AuthContextOIDCHelper.Provider value={values}>{children}</AuthContextOIDCHelper.Provider>;
};

export default AuthProviderOIDCHelper;
