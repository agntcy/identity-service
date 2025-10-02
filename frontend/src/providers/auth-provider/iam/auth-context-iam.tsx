/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AuthContextIAM as ContextIAM} from '@/types/auth/iam';
import * as React from 'react';

export const AuthContextIAM = React.createContext<ContextIAM | undefined>(undefined);
AuthContextIAM.displayName = 'AuthContextIAM';

export default AuthContextIAM;
