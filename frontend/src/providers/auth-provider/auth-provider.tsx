/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {isMultiTenant} from '@/utils/get-auth-config';
import AuthProviderIAM from './iam/auth-provider-iam';
import AuthProviderOIDC from './oicd/auth-provider-oidc';

const AuthProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  const isMultiTenantResult = isMultiTenant();

  if (isMultiTenantResult) {
    return <AuthProviderIAM>{children}</AuthProviderIAM>;
  }

  return <AuthProviderOIDC>{children}</AuthProviderOIDC>;
};

export default AuthProvider;
