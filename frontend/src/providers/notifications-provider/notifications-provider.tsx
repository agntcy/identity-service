/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {NotificationContent} from '@/components/notifications/notification-content';
import {useWindowSize} from '@/hooks';
import {INotification, NotificationType} from '@/types/sw/notification';
import {PropsWithChildren, useCallback, useEffect, useMemo, useState} from 'react';
import {useNotificationUtils} from '../notification-utils-provider/notification-utils-provider';
import {notificationUtils} from '@/utils/notification-store';
import {cn} from '@/lib/utils';

const TIMER = 1000; // 1 seconds

export const NotificationsProvider: React.FC<PropsWithChildren> = ({children}) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);

  const {isMobile} = useWindowSize();
  const {enabled} = useNotificationUtils();

  const hasNotificationsRequest = useMemo(() => {
    return notifications.filter((n) => n.type === NotificationType.APPROVAL_REQUEST).length > 0;
  }, [notifications]);

  const loadNotifications = useCallback(async () => {
    try {
      const storedNotifications = await notificationUtils.getNotifications();
      setNotifications(storedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  const removeNotification = useCallback(
    async (notification: INotification) => {
      try {
        if (notification.id) {
          await notificationUtils.removeNotification(notification.id);
        }
        await loadNotifications();
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          if (registration.active) {
            registration.active.postMessage({
              type: 'CLOSE_NOTIFICATION',
              notificationId: notification.id
            });
          }
        }
      } catch (error) {
        console.error('Error removing notification:', error);
      }
    },
    [loadNotifications]
  );

  const addNotification = useCallback(async () => {
    try {
      await loadNotifications();
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  }, [loadNotifications]);

  const handleRemoveNotification = useCallback(
    async (notification: INotification) => {
      await removeNotification(notification);
    },
    [removeNotification]
  );

  const handleReceiveNotification = useCallback(
    async (notification: INotification) => {
      if (isMobile && notification.type === NotificationType.APPROVAL_REQUEST) {
        await addNotification();
      }
    },
    [isMobile, addNotification]
  );

  const checkIsExpired = useCallback((notification: INotification) => {
    const now = Date.now();
    if (notification.type === NotificationType.APPROVAL_REQUEST) {
      const timeout = notification.approval_request_info?.timeout_in_seconds || 60;
      return now < (notification.timestamp || 0) + timeout * 1000;
    }
    return false;
  }, []);

  const cleanupExpiredNotifications = useCallback(async () => {
    const expiredNotifications = notifications.filter((notification) => !checkIsExpired(notification));
    if (expiredNotifications.length === 0) {
      return;
    }
    for (const notification of expiredNotifications) {
      if (notification.id) {
        await removeNotification(notification);
      }
    }
  }, [checkIsExpired, notifications, removeNotification]);

  const onHandleRequest = useCallback(
    async (notification?: INotification) => {
      if (notification) {
        await removeNotification(notification);
      }
    },
    [removeNotification]
  );

  useEffect(() => {
    if (isMobile && enabled) {
      void loadNotifications();
    }
  }, [isMobile, enabled, loadNotifications]);

  useEffect(() => {
    let cleanupInterval: NodeJS.Timeout | undefined;
    if (isMobile && notifications.length > 0 && enabled) {
      cleanupInterval = setInterval(() => {
        void cleanupExpiredNotifications();
      }, TIMER);
    }
    return () => {
      if (cleanupInterval) {
        clearInterval(cleanupInterval);
      }
    };
  }, [cleanupExpiredNotifications, enabled, isMobile, notifications]);

  useEffect(() => {
    const listenerPushNotification = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
        void handleReceiveNotification(event.data.payload as INotification);
      }
    };
    if ('serviceWorker' in navigator && isMobile && enabled) {
      navigator.serviceWorker.addEventListener('message', listenerPushNotification);
    }
    return () => {
      if ('serviceWorker' in navigator && isMobile && enabled) {
        navigator.serviceWorker.removeEventListener('message', listenerPushNotification);
      }
    };
  }, [handleReceiveNotification, isMobile, enabled]);

  useEffect(() => {
    const listenerRemoveNotification = (event: MessageEvent) => {
      if (event.data && event.data.type === 'REMOVE_NOTIFICATION') {
        void handleRemoveNotification(event.data.payload as INotification);
      }
    };
    if ('serviceWorker' in navigator && isMobile && enabled) {
      navigator.serviceWorker.addEventListener('message', listenerRemoveNotification);
    }
    return () => {
      if ('serviceWorker' in navigator && isMobile && enabled) {
        navigator.serviceWorker.removeEventListener('message', listenerRemoveNotification);
      }
    };
  }, [handleRemoveNotification, isMobile, enabled]);

  return (
    <>
      <div
        role="presentation"
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-[100] bg-black/50 transition-opacity duration-300',
          hasNotificationsRequest ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />
      {isMobile && hasNotificationsRequest && enabled && (
        <>
          {notifications
            .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
            .map((notification, index) => (
              <NotificationContent
                key={notification.id}
                index={index}
                defaultOpen={checkIsExpired(notification)}
                notification={notification}
                onHandleRequest={onHandleRequest}
              />
            ))}
        </>
      )}
      {children}
    </>
  );
};
