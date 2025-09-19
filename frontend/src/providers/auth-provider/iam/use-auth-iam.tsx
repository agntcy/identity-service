/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {AuthContextIAM as ContextIAM} from '@/types/okta';
import * as React from 'react';
import {AuthContextIAM} from '@/providers/auth-provider/iam/auth-context-iam';

export const useAuthIAM = (): ContextIAM => {
  const context = React.useContext(AuthContextIAM);

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useDebugValue(context);
  }

  if (context === undefined) {
    throw new Error('AuthContextIAM value is undefined. Make sure you use the <AuthProviderIAM> before using the context.');
  }

  return context;
};
