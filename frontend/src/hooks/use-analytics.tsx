/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useAnalyticsContext} from '@/providers/analytics-provider/analytics-provider';

export const useAnalytics = () => {
  const {analytics} = useAnalyticsContext();

  const analyticsTrack = (id: string, params?: Record<string, any>) => {
    void analytics?.track(id, {
      ...params
    });
  };

  const analyticsPage = (id: string, params?: Record<string, any>) => {
    void analytics?.page(id, {
      ...params
    });
  };

  return {analyticsTrack, analyticsPage};
};
