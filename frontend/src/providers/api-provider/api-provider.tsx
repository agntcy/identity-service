/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {useEffect} from 'react';
import {useAuth} from '@/hooks';
import {Loading} from '@/components/ui/loading';
import {AgenticServicesAPI, DevicesAPI, IamAPI, PolicyAPI, SettingsAPI} from '@/api/services';
import {BadgeAPI} from '@/api/services/badge-api';

export const ApiProvider = ({children}: React.PropsWithChildren) => {
  const [isSet, setIsSet] = React.useState<boolean>(false);
  const {authInfo, tokenExpiredHttpHandler, logout} = useAuth();

  useEffect(() => {
    IamAPI.setTokenExpiredHandlers({tokenExpiredHttpHandler, logout});
    SettingsAPI.setTokenExpiredHandlers({tokenExpiredHttpHandler, logout});
    AgenticServicesAPI.setTokenExpiredHandlers({tokenExpiredHttpHandler, logout});
    BadgeAPI.setTokenExpiredHandlers({tokenExpiredHttpHandler, logout});
    PolicyAPI.setTokenExpiredHandlers({tokenExpiredHttpHandler, logout});
    DevicesAPI.setTokenExpiredHandlers({tokenExpiredHttpHandler, logout});
  }, [tokenExpiredHttpHandler, logout]);

  useEffect(() => {
    if (authInfo && authInfo.isAuthenticated) {
      IamAPI.setAuthInfo(authInfo);
      SettingsAPI.setAuthInfo(authInfo);
      AgenticServicesAPI.setAuthInfo(authInfo);
      BadgeAPI.setAuthInfo(authInfo);
      PolicyAPI.setAuthInfo(authInfo);
      DevicesAPI.setAuthInfo(authInfo);
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
