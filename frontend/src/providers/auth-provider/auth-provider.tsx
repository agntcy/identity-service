/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import AuthProviderIAM from './iam/auth-provider-iam';
import AuthProviderOIDC from './oicd/auth-provider-oidc';
import config, {AuthType} from '@/config';
import {AuthError} from '@/components/router/auth-error';

const AuthProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  if (!config.AUTH_TYPE) {
    return <AuthError error={new Error('No AUTH_TYPE configured')} />;
  } else if (config.AUTH_TYPE === AuthType.IAM) {
    return <AuthProviderIAM>{children}</AuthProviderIAM>;
  } else if (config.AUTH_TYPE === AuthType.OIDC) {
    return <AuthProviderOIDC>{children}</AuthProviderOIDC>;
  } else {
    return <AuthError error={new Error(`Unknown AUTH_TYPE configured: ${config.AUTH_TYPE}`)} />;
  }
};

export default AuthProvider;
