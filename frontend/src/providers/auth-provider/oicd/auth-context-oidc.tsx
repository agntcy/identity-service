/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {AuthContextOIDC as ContextOIDC} from '@/types/okta';
import * as React from 'react';

export const AuthContextOIDC = React.createContext<ContextOIDC | undefined>(undefined);
AuthContextOIDC.displayName = 'AuthContextOIDC';

export default AuthContextOIDC;
