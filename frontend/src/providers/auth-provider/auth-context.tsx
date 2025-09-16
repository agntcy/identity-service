/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {AuthContextProps} from '@/types/okta';
import * as React from 'react';

const AuthContext = React.createContext<AuthContextProps | undefined>(undefined);
AuthContext.displayName = 'AuthContext';

export default AuthContext;
