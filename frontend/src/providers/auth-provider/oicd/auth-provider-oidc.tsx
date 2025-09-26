/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import {AuthProvider, AuthProviderProps} from 'react-oidc-context';
import {defaultAuthConfigOptionsOIDC, onSigninCallback} from '@/constants/oicd';
import {getAuthConfig} from '@/utils/auth';
import {AuthConfigOIDC} from '@/types/auth/oidc';
import AuthProviderOIDCHelper from './helper/auth-provider-oidc-helper';
import {AuthError} from '@/components/router/auth-error';

const AuthProviderOIDC: React.FC<React.PropsWithChildren> = ({children}) => {
  const temp = getAuthConfig() as AuthConfigOIDC;

  const authConfig: AuthProviderProps = React.useMemo(() => {
    return {
      authority: temp.oidcIssuer,
      client_id: temp.oidcClient,
      ...defaultAuthConfigOptionsOIDC
    };
  }, [temp.oidcClient, temp.oidcIssuer]);

  const isValidConfig: boolean = React.useMemo(() => {
    if (!temp?.oidcUi || !temp?.oidcIssuer || !temp?.oidcClient) {
      return false;
    }
    return true;
  }, [temp?.oidcUi, temp?.oidcIssuer, temp?.oidcClient]);

  if (!isValidConfig) {
    return (
      <AuthError
        error={
          new Error('No authConfig passed to <AuthProvider> component or invalid config passed to <AuthProvider> component.')
        }
      />
    );
  }

  return (
    <AuthProvider {...authConfig} onSigninCallback={onSigninCallback}>
      <AuthProviderOIDCHelper {...authConfig}>{children}</AuthProviderOIDCHelper>
    </AuthProvider>
  );
};

export default AuthProviderOIDC;
