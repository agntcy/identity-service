/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {createContext, useContext, useEffect, useMemo} from 'react';
import {AnalyticsBrowser} from '@segment/analytics-next';
import React from 'react';
import config from '@/config';
import {useAuth} from '@/hooks';

type AnalyticsProviderState = {
  analytics?: AnalyticsBrowser;
};

const AnalyticsProviderContext = createContext<AnalyticsProviderState | undefined>(undefined);

export const AnalyticsProvider = ({children}: React.PropsWithChildren) => {
  const segmentId = config.SEGMENT_ID as string | undefined;

  const {authInfo} = useAuth();

  const analytics = useMemo(() => {
    if (segmentId) {
      return AnalyticsBrowser.load({writeKey: segmentId});
    }
    return undefined;
  }, [segmentId]);

  useEffect(() => {
    if (authInfo?.isAuthenticated && analytics) {
      void analytics?.identify('USER_LOGGED_IN', {
        userId: authInfo.user?.username,
        name: authInfo.user?.name,
        email: authInfo.user?.username,
        orgId: authInfo.user?.tenant?.id,
        orgName: authInfo.user?.tenant?.name
      });
    }
  }, [analytics, authInfo]);

  const value = {
    analytics
  };

  return <AnalyticsProviderContext.Provider value={value}>{children}</AnalyticsProviderContext.Provider>;
};

export const useAnalyticsContext = () => {
  const context = useContext(AnalyticsProviderContext);
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within a AnalyticsProvider');
  }
  return context;
};
