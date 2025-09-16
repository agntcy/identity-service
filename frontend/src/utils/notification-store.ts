/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { get, set, del } from 'idb-keyval';
import { INotification, NotificationType } from '../types/sw/notification';

const indexDbStore = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await get(name);
      return value || null;
    } catch (error) {
      console.error('Error getting item from IndexedDB:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch (error) {
      console.error('Error setting item in IndexedDB:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch (error) {
      console.error('Error removing item from IndexedDB:', error);
    }
  },
};

const NOTIFICATIONS_KEY = 'agent_identity_notifications';

const notificationUtils = {
  // Get all notifications
  getNotifications: async (): Promise<INotification[]> => {
    try {
      const notifications = await get(NOTIFICATIONS_KEY);
      return notifications || [];
    } catch (error) {
      console.error('Error getting notifications from IndexedDB:', error);
      return [];
    }
  },

  // Add a new notification
  addNotification: async (notification: INotification): Promise<void> => {
    try {
      const notifications = await notificationUtils.getNotifications();
      const newNotification: INotification = {
        ...notification,
        id: notification.id || crypto.randomUUID(),
        timestamp: notification.timestamp || Date.now(),
      };
      notifications.unshift(newNotification);
      await set(NOTIFICATIONS_KEY, notifications);
    } catch (error) {
      console.error('Error adding notification to IndexedDB:', error);
    }
  },

  // Remove a specific notification
  removeNotification: async (notificationId: string): Promise<void> => {
    try {
      const notifications = await notificationUtils.getNotifications();
      const filtered = notifications.filter(notif => notif.id !== notificationId);
      await set(NOTIFICATIONS_KEY, filtered);
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  },

  // Clear all notifications
  clearAllNotifications: async (): Promise<void> => {
    try {
      await set(NOTIFICATIONS_KEY, []);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  },

  // Get notifications by type
  getNotificationsByType: async (type: NotificationType): Promise<INotification[]> => {
    try {
      const notifications = await notificationUtils.getNotifications();
      return notifications.filter(notif => notif.type === type);
    } catch (error) {
      console.error('Error getting notifications by type:', error);
      return [];
    }
  },

  // Get approval request notifications
  getApprovalRequests: async (): Promise<INotification[]> => {
    return notificationUtils.getNotificationsByType(NotificationType.APPROVAL_REQUEST);
  },
};

export { indexDbStore, notificationUtils}
