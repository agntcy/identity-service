/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {useAnalyticsContext} from '@/providers/analytics-provider/analytics-provider';

export const useAnalytics = () => {
  const {analytics, isConsentGiven} = useAnalyticsContext();

  const analyticsTrack = (id: string, params?: Record<string, any>) => {
    if (!isConsentGiven) {
      return;
    }
    void analytics?.track(id, {
      ...params
    });
  };

  const analyticsPage = (id: string, params?: Record<string, any>) => {
    if (!isConsentGiven) {
      return;
    }
    void analytics?.page(id, {
      ...params
    });
  };

  return {analyticsTrack, analyticsPage};
};
