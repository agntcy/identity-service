/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {createContext, useContext, useState, useCallback, useEffect, ReactNode} from 'react';
import {
  askPermissionNotifications,
  checkNotifications,
  getCurrentSubscription,
  getNotificationPermissionState,
  subscribeNotifications,
  unsubscribeNotifications
} from '@/lib/notifications';
import {arrayBufferToBase64} from '@/lib/utils';
import {useRegisterDevice} from '@/mutations';
import {usePwa} from '@/providers/pwa-provider/pwa-provider';
import {toast} from '@outshift/spark-design';
import getDeviceInfo from '@/lib/device';

interface NotificationUtilsContextType {
  loading: boolean;
  enabled: boolean;
  supported: boolean;
  enableNotifications: (id?: string) => Promise<void>;
  disableNotifications: () => Promise<void>;
  handleToggleNotifications: (id?: string) => void;
  fixNotifications: () => Promise<void>;
  init: () => Promise<void>;
}

const NotificationUtilsContext = createContext<NotificationUtilsContextType | undefined>(undefined);

interface NotificationUtilsProviderProps {
  children: ReactNode;
}

export const NotificationUtilsProvider: React.FC<NotificationUtilsProviderProps> = ({children}) => {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(false);

  const registerDeviceMutation = useRegisterDevice({});
  const {updateServiceWorker} = usePwa();

  const subscribeDevice = useCallback(
    (sub: PushSubscription, id?: string) => {
      const subscriptionData = {
        endpoint: sub.endpoint,
        p256dh: arrayBufferToBase64(sub.getKey('p256dh')!),
        auth: arrayBufferToBase64(sub.getKey('auth')!)
      };
      const {name} = getDeviceInfo();
      return registerDeviceMutation.mutateAsync({
        id: id || '',
        data: {
          subscriptionToken: JSON.stringify(subscriptionData),
          name: name || 'Unknown Device'
        }
      });
    },
    [registerDeviceMutation]
  );

  const enableNotifications = useCallback(
    async (id?: string) => {
      try {
        setLoading(true);
        await askPermissionNotifications();
        try {
          const subscription = await getCurrentSubscription();
          if (subscription) {
            toast({
              title: 'Notifications Enabled',
              description: 'You will now receive push notifications.',
              type: 'success',
              showCloseButton: false
            });
            setEnabled(true);
          } else {
            const newSubscription = await subscribeNotifications();
            try {
              await subscribeDevice(newSubscription, id);
              setEnabled(true);
              toast({
                title: 'Notifications Enabled',
                description: 'You will now receive push notifications.',
                type: 'success',
                showCloseButton: false
              });
              setEnabled(true);
            } catch (error) {
              console.error('Failed to subscribe device:', error);
              toast({
                title: 'Subscription Failed',
                description: 'Please try again later.',
                type: 'error',
                showCloseButton: false
              });
              setEnabled(false);
            } finally {
              setLoading(false);
            }
          }
        } catch (error) {
          console.error('Failed to subscribe to notifications:', error);
          toast({
            title: 'Subscription Failed',
            description: 'Please try again later.',
            type: 'error',
            showCloseButton: false
          });
          setEnabled(false);
        } finally {
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to request notification permission:', error);
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser settings',
          type: 'error',
          showCloseButton: false
        });
        setEnabled(false);
      } finally {
        setLoading(false);
      }
    },
    [subscribeDevice]
  );

  const disableNotifications = useCallback(async () => {
    try {
      setLoading(true);
      await unsubscribeNotifications();
      setEnabled(false);
      toast({
        title: 'Notifications Disabled',
        description: 'You will no longer receive push notifications.',
        type: 'success',
        showCloseButton: false
      });
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      toast({
        title: 'Unsubscribe Failed',
        description: 'Please try again later.',
        type: 'error',
        showCloseButton: false
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleNotifications = useCallback(
    (id?: string) => {
      if (supported) {
        if (!enabled) {
          void enableNotifications(id);
        } else {
          void disableNotifications();
        }
      }
    },
    [disableNotifications, enableNotifications, enabled, supported]
  );

  const fixNotifications = useCallback(async () => {
    try {
      setLoading(true);
      await updateServiceWorker();
      toast({
        title: 'Notifications Fixed',
        description: 'Your notification issues have been resolved.',
        type: 'success',
        showCloseButton: false
      });
    } catch (error) {
      console.error('Failed to fix notifications:', error);
      toast({
        title: 'Fix Failed',
        description: 'Please try again later.',
        type: 'error',
        showCloseButton: false
      });
    } finally {
      setLoading(false);
    }
  }, [updateServiceWorker]);

  const init = async () => {
    try {
      const supported = checkNotifications();
      if (!supported) {
        toast({
          title: 'Notifications Not Supported',
          description: 'Your browser does not support push notifications.',
          type: 'error',
          showCloseButton: false
        });
      }
      setSupported(supported);
      const permission = await getNotificationPermissionState();
      if (permission === 'granted') {
        const subscription = await getCurrentSubscription();
        if (subscription) {
          setEnabled(true);
        } else {
          setEnabled(false);
        }
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      setEnabled(false);
      setSupported(false);
    }
  };

  useEffect(() => {
    void init();
  }, []);

  const value: NotificationUtilsContextType = {
    loading,
    enabled,
    supported,
    enableNotifications,
    disableNotifications,
    handleToggleNotifications,
    fixNotifications,
    init
  };

  return <NotificationUtilsContext.Provider value={value}>{children}</NotificationUtilsContext.Provider>;
};

export const useNotificationUtils = (): NotificationUtilsContextType => {
  const context = useContext(NotificationUtilsContext);
  if (context === undefined) {
    throw new Error('useNotificationUtils must be used within a NotificationUtilsProvider');
  }
  return context;
};
