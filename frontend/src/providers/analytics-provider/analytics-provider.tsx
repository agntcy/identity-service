/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import React from 'react';
import config from '@/config';
import {useAuth} from '@/hooks';
import * as CookieConsentVanilla from 'vanilla-cookieconsent';
import {AnalyticsService} from '@/types/analytics/analytics';
import {SegmentAnalytics} from './implementations/segment-analytics';
import {NoOpAnalytics} from './implementations/noop-analytics';

type AnalyticsProviderState = {
  analytics?: AnalyticsService;
  isConsentGiven: boolean;
};

const AnalyticsProviderContext = createContext<AnalyticsProviderState | undefined>(undefined);

export const AnalyticsProvider = ({children}: React.PropsWithChildren) => {
  const [isConsentGiven, setIsConsentGiven] = useState(false);

  const segmentId = config.SEGMENT_ID as string | undefined;

  const {authInfo} = useAuth();

  const analytics = useMemo(() => {
    if (isConsentGiven) {
      if (segmentId) {
        console.log('Initializing Segment Analytics...');
        return new SegmentAnalytics();
      } else {
        return new NoOpAnalytics();
      }
    }
    return undefined;
  }, [isConsentGiven, segmentId]);

  useEffect(() => {
    if (analytics && isConsentGiven && authInfo?.isAuthenticated && authInfo.user && authInfo.user.username) {
      analytics.identify(authInfo.user.username, {
        userId: authInfo.user.username,
        name: authInfo.user.name,
        email: authInfo.user.username,
        orgId: authInfo.user.tenant?.id,
        orgName: authInfo.user.tenant?.name
      });
      void analytics.track('USER_LOGGED_IN', {
        userId: authInfo.user.username,
        name: authInfo.user.name,
        email: authInfo.user.username,
        orgId: authInfo.user.tenant?.id,
        orgName: authInfo.user.tenant?.name
      });
    }
  }, [analytics, isConsentGiven, authInfo]);

  useEffect(() => {
    const listener = () => {
      const preferences = CookieConsentVanilla.getUserPreferences();
      const flag = preferences.acceptedCategories?.includes('analytics') ?? false;
      setIsConsentGiven(flag);
    };
    window.addEventListener('cc:onChange', listener);
    window.addEventListener('cc:onConsent', listener);
    const preferences = CookieConsentVanilla.getUserPreferences();
    const flag = preferences.acceptedCategories?.includes('analytics') ?? false;
    setIsConsentGiven(flag);
    return () => {
      window.removeEventListener('cc:onChange', listener);
      window.removeEventListener('cc:onConsent', listener);
    };
  }, []);

  const value = {
    analytics,
    isConsentGiven
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
