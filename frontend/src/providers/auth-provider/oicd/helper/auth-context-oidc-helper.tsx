/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {AuthContextOIDC} from '@/types/auth/oidc';
import * as React from 'react';

export const AuthContextOIDCHelper = React.createContext<AuthContextOIDC | undefined>(undefined);
AuthContextOIDCHelper.displayName = 'AuthContextOIDCHelper';

export default AuthContextOIDCHelper;
