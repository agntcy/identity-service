/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import {SecureRoutePropsIAM} from './iam';
import {SecureRoutePropsOIDC} from './oidc';

// Generic secure route props that works with both IAM and OIDC
export interface SecureRouteProps {
  isAllowed?: boolean;
  shouldRedirect?: boolean;
  redirectPath?: string;
  errorComponent?: React.FC<{error: Error}>;
  onAuthRequired?: (auth?: any) => Promise<void> | void; // Generic auth handler
}

// Union type for specific implementations
export type SecureRoutePropsUnion = SecureRoutePropsIAM | SecureRoutePropsOIDC;
