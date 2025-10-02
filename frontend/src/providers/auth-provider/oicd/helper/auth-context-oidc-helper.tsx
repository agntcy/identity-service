/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AuthContextOIDC} from '@/types/auth/oidc';
import * as React from 'react';

export const AuthContextOIDCHelper = React.createContext<AuthContextOIDC | undefined>(undefined);
AuthContextOIDCHelper.displayName = 'AuthContextOIDCHelper';

export default AuthContextOIDCHelper;
