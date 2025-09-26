/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {useAuthIAM} from '@/providers/auth-provider/iam/use-auth-iam';
import {useAuthOIDC} from '@/providers/auth-provider/oicd/use-auth-oidc';
import {AuthContextIAM} from '@/types/auth/iam';
import config, {AuthType} from '@/config';
import {AuthContextOIDC} from '@/types/auth/oidc';

export const useAuth = (): AuthContextIAM | AuthContextOIDC => {
  let auth: typeof useAuthIAM | typeof useAuthOIDC = useAuthOIDC;

  if (!config.AUTH_TYPE) {
    console.warn('No AUTH_TYPE configured...');
  } else if (config.AUTH_TYPE === AuthType.IAM) {
    auth = useAuthIAM;
  } else if (config.AUTH_TYPE === AuthType.OIDC) {
    auth = useAuthOIDC;
  } else {
    console.warn(`Unknown AUTH_TYPE configured: ${config.AUTH_TYPE}`);
  }

  return {...auth()};
};
