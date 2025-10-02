/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AnalyticsService} from '@/types/analytics/analytics';

/**
 * @class NoOpAnalytics
 * @implements {AnalyticsService}
 * @description A "do-nothing" implementation of the analytics service. It is used when
 * no analytics provider is configured, preventing runtime errors and removing the need
 * for conditional checks in the application code.
 */
export class NoOpAnalytics implements AnalyticsService {
  public track(eventName: string, _properties?: Record<string, any>): void {
    console.log(`[No-Op Analytics] Event not sent: "${eventName}"`);
  }

  public page(pageCategory?: string, pageName?: string, _properties?: Record<string, any>): void {
    console.log(`[No-Op Analytics] PageView not sent: "${pageName}"`);
  }

  public identify(userId: string, _traits?: Record<string, any>): void {
    console.log(`[No-Op Analytics] User not identified: ${userId}`);
  }

  public reset(): void {
    console.log('[No-Op Analytics] User not reset.');
  }
}
