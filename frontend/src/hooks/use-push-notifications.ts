/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {inspectNotifications, subscribeToNotifications} from '@/lib/notifications';
import {useRegisterDevice} from '@/mutations';
import {useState, useCallback, useEffect} from 'react';

export const usePushNotifications = (id?: string) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const registerDeviceMutation = useRegisterDevice({});

  const requestPermission = useCallback(async () => {
    try {
      const granted = await subscribeToNotifications();
      if (typeof granted === 'object') {
        return registerDeviceMutation
          .mutateAsync({
            id: id || '',
            data: {
              subscriptionToken: JSON.stringify(granted)
            }
          })
          .then((resp) => {
            setNotificationsEnabled(true);
            console.log('Device registered successfully:', resp);
            return true;
          })
          .catch((error) => {
            setNotificationsEnabled(false);
            console.error('Failed to register device:', error);
            return false;
          });
      }
      if (granted) {
        setNotificationsEnabled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      return false;
    }
  }, [id, registerDeviceMutation]);

  const disableNotifications = useCallback(async () => {
    try {
      await subscribeToNotifications();
      setNotificationsEnabled(false);
    } catch (error) {
      console.error('Failed to disable notifications:', error);
    }
  }, []);

  useEffect(() => {
    const handleInitialization = async () => {
      try {
        const granted = await inspectNotifications();
        if (granted === true) {
          setNotificationsEnabled(true);
        } else if (granted === false) {
          setNotificationsEnabled(false);
        }
      } catch (error) {
        console.error('Failed to inspect notifications:', error);
        setNotificationsEnabled(false);
      }
    };
    void handleInitialization();
  }, []);

  return {
    notificationsEnabled,
    requestPermission,
    disableNotifications
  };
};
