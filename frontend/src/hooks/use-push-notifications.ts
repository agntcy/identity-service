/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {subscribeToNotifications} from '@/lib/notifications';
import {useState, useCallback} from 'react';

export const usePushNotifications = (id?: string) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const requestPermission = useCallback(async () => {
    try {
      const granted = await subscribeToNotifications();
      // if (granted) {
      //   setNotificationsEnabled(true);
      //   // showToast(
      //   //   "Push notifications enabled!",
      //   //   "You will receive notifications from AGNTCY Identity"
      //   // );
      //   return true;
      // }
      return false;
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      return false;
    }
  }, []);

  const disableNotifications = useCallback(async () => {
    try {
      await subscribeToNotifications();
      setNotificationsEnabled(false);
      // showToast(
      //   "Notifications Disabled",
      //   "You will no longer receive push notifications"
      // );
    } catch (error) {
      console.error('Failed to disable notifications:', error);
    }
  }, []);

  return {
    notificationsEnabled,
    requestPermission,
    disableNotifications
  };
};
