/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import config, {AuthType} from '@/config';
import {AuthError} from '../auth-error';
import {SecureRouteProps} from '@/types/auth/common-secure-route';
import {SecureRouteIAM} from './iam/secure-route-iam';
import {SecureRouteOIDC} from './oidc/secure-route-oidc';

export const SecureRoute: React.FC<React.PropsWithChildren<SecureRouteProps>> = (props) => {
  if (!config.AUTH_TYPE) {
    return <AuthError error={new Error('No AUTH_TYPE configured')} />;
  } else if (config.AUTH_TYPE === AuthType.IAM) {
    return <SecureRouteIAM {...props} />;
  } else if (config.AUTH_TYPE === AuthType.OIDC) {
    return <SecureRouteOIDC {...props} />;
  } else {
    return <AuthError error={new Error(`Unknown AUTH_TYPE configured: ${config.AUTH_TYPE}`)} />;
  }
};
