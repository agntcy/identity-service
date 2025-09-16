/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import AuthContext from '@/providers/auth-provider/auth-context';
import * as React from 'react';

export const useAuth = () => {
  const context = React.useContext(AuthContext);

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useDebugValue(context);
  }

  if (context === undefined) {
    throw new Error('AuthContext value is undefined. Make sure you use the <AuthProvider> before using the context.');
  }

  return context;
};
