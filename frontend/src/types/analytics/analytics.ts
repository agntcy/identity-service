/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Analytics Service Module
 * @description This file defines a generic interface for an analytics service and provides
 * concrete implementations for Segment and Google Analytics. This abstraction allows the
 * application to interact with a consistent API for analytics, regardless of the
 * underlying provider.
 */

// ---------------------------------------------------------------- //
// ------------------- CORE ANALYTICS INTERFACE ------------------- //
// ---------------------------------------------------------------- //

/**
 * @interface AnalyticsService
 * @description Defines the standard contract for any analytics service implementation.
 * It ensures that all analytics providers used in the application adhere to a
 * consistent set of methods for tracking events, page views, and user data.
 */
export interface AnalyticsService {
  /**
   * Tracks a custom event.
   *
   * @param {string} eventName - The name of the event to track (e.g., 'Button Clicked', 'Item Added to Cart').
   * @param {Record<string, any>} [properties] - An optional object of key-value pairs to provide more context about the event.
   */
  track(eventName: string, properties?: Record<string, any>): void;

  /**
   * Tracks a page view event.
   *
   * @param {string} pageCategory - The aggregation category
   * @param {string} pageName - The name or path of the page being viewed (e.g., '/home', 'Product Details Page').
   * @param {Record<string, any>} [properties] - Optional additional properties for the page view.
   */
  page(pageCategory: string, pageName: string, properties?: Record<string, any>): void;

  /**
   * Identifies a user and associates subsequent events with them.
   *
   * @param {string} userId - A unique identifier for the user.
   * @param {Record<string, any>} [traits] - An optional object of user properties (e.g., name, email, subscription plan).
   */
  identify(userId: string, traits?: Record<string, any>): void;

  /**
   * Resets the user identification, logging them out of the analytics context.
   * Useful when a user logs out of the application.
   */
  reset(): void;
}
