/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {useAuth} from '@/hooks';
import {Loading} from '@/components/ui/loading';
import {IamAPI, SettingsAPI} from '@/api/services';

export const ApiProvider = ({children}: React.PropsWithChildren) => {
  const [isSet, setIsSet] = React.useState<boolean>(false);
  const {authInfo, tokenExpiredHttpHandler, logout} = useAuth();

  React.useEffect(() => {
    IamAPI.setTokenExpiredHandlers({tokenExpiredHttpHandler, logout});
    SettingsAPI.setTokenExpiredHandlers({tokenExpiredHttpHandler, logout});
  }, [tokenExpiredHttpHandler, logout]);

  React.useEffect(() => {
    if (authInfo && authInfo.isAuthenticated) {
      IamAPI.setAuthInfo(authInfo);
      SettingsAPI.setAuthInfo(authInfo);
      setIsSet(true);
    } else {
      setIsSet(true);
    }
  }, [authInfo]);

  if (!isSet) {
    return <Loading />;
  }

  return <>{children}</>;
};
