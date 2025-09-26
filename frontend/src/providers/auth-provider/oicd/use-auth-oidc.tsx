/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {AuthContextOIDC as ContextOIDC} from '@/types/auth/oidc';
import * as React from 'react';
import {AuthContextOIDCHelper} from './helper/auth-context-oidc-helper';

export const useAuthOIDC = (): ContextOIDC => {
  const context = React.useContext(AuthContextOIDCHelper);

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useDebugValue(context);
  }

  if (context === undefined) {
    throw new Error(
      'AuthContextOIDC value is undefined. Make sure you use the <AuthProviderOIDC> before using the context.'
    );
  }

  return context;
};
