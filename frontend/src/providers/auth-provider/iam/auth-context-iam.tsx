/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {AuthContextIAM as ContextIAM} from '@/types/okta';
import * as React from 'react';

export const AuthContextIAM = React.createContext<ContextIAM | undefined>(undefined);
AuthContextIAM.displayName = 'AuthContextIAM';

export default AuthContextIAM;
