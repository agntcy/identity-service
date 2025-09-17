/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import config from '@/config';
import {AnalyticsService} from '@/types/analytics/analytics';
import {AnalyticsBrowser} from '@segment/analytics-next';

export class SegmentAnalytics implements AnalyticsService {
  private analytics: AnalyticsBrowser | undefined;

  constructor() {
    const segmentId = config.SEGMENT_ID as string | undefined;
    if (segmentId) {
      this.analytics = AnalyticsBrowser.load({writeKey: segmentId});
    }
  }

  track(eventName: string, properties?: Record<string, any>): void {
    void this.analytics?.track(eventName, properties);
  }

  page(pageCategory?: string, pageName?: string, properties?: Record<string, any>): void {
    void this.analytics?.page(pageCategory, pageName, properties);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    void this.analytics?.identify(userId, traits);
  }

  reset(): void {
    void this.analytics?.reset();
    this.analytics = undefined;
  }
}
