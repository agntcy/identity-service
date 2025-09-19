/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {isMultiTenant} from '@/utils/get-auth-config';
import {useAuthIAM} from '@/providers/auth-provider/iam/use-auth-iam';
import {useAuthOIDC} from '@/providers/auth-provider/oicd/use-auth-oidc';
import {AuthContextIAM, AuthContextOIDC} from '@/types/okta';

export const useAuth = (): AuthContextIAM | AuthContextOIDC => {
  const multiTenant = isMultiTenant();
  let auth: typeof useAuthIAM | typeof useAuthOIDC = useAuthOIDC;

  switch (multiTenant) {
    case true:
      auth = useAuthIAM;
      break;
    case false:
      auth = useAuthOIDC;
      break;
  }

  return {...auth()};
};
