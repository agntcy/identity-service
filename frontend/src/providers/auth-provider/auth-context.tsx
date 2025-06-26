/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AuthContextProps} from '@/types/okta';
import * as React from 'react';

const AuthContext = React.createContext<AuthContextProps | undefined>(undefined);
AuthContext.displayName = 'AuthContext';

export default AuthContext;
