/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useAnalyticsContext} from '@/providers/analytics-provider/analytics-provider';

export const useAnalytics = () => {
  const {analytics, isConsentGiven} = useAnalyticsContext();

  const analyticsTrack = (eventName: string, properties?: Record<string, any>) => {
    if (!isConsentGiven) {
      return;
    }
    void analytics?.track(eventName, {
      ...properties
    });
  };

  const analyticsPage = (pageCategory: string, pageName: string, properties?: Record<string, any>) => {
    if (!isConsentGiven) {
      return;
    }
    void analytics?.page(pageCategory, pageName, {
      ...properties
    });
  };

  const analyticsIdentify = (userId: string, traits?: Record<string, any>) => {
    if (!isConsentGiven) {
      return;
    }
    void analytics?.identify(userId, {
      ...traits
    });
  };

  const analyticsReset = () => {
    void analytics?.reset();
  };

  return {analyticsTrack, analyticsPage, analyticsIdentify, analyticsReset};
};
