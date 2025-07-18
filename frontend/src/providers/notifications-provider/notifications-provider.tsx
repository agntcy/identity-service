/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {NotificationContent} from '@/components/notifications/notification-content';
import {useNotifications, useWindowSize} from '@/hooks';
import {INotification, NotificationType} from '@/types/sw/notification';
import {PropsWithChildren, useCallback, useEffect, useState} from 'react';

const TIMER = 1000; // 1,5 seconds

export const NotificationsProvider: React.FC<PropsWithChildren> = ({children}) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);

  const {isMobile} = useWindowSize();
  const {enabled} = useNotifications();

  const removeNotification = useCallback(async (notification: INotification) => {
    try {
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
  }, []);

  const handleReceiveNotification = useCallback(
    (notification: INotification) => {
      if (isMobile && notification.type === NotificationType.APPROVAL_REQUEST && enabled) {
        setNotifications((prev) => {
          const existingNotification = prev.find((n) => n.id === notification.id);
          if (existingNotification) {
            return prev.map((n) => (n.id === notification.id ? {...n, ...notification} : n));
          }
          return [...prev, notification];
        });
      }
    },
    [enabled, isMobile]
  );

  const checkIsExpired = useCallback((notification: INotification) => {
    const now = Date.now();
    if (notification.type === NotificationType.APPROVAL_REQUEST) {
      const timeout = notification.approval_request_info?.timeout_in_seconds || 60;
      return now < (notification.timestamp || 0) + timeout * 1000;
    }
    return false;
  }, []);

  const cleanupExpiredNotifications = useCallback(() => {
    const hasExpired = notifications.some((notification) => !checkIsExpired(notification));
    if (!hasExpired) {
      return;
    }
    setNotifications((prev) => {
      const currentNotifications = prev.filter((notification) => {
        const isValid = checkIsExpired(notification);
        if (!isValid && notification.id) {
          void removeNotification(notification);
        }
        return isValid;
      });
      return currentNotifications;
    });
  }, [checkIsExpired, notifications, removeNotification]);

  const onHandleRequest = useCallback(
    (notification?: INotification) => {
      if (notification?.id) {
        void removeNotification(notification);
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }
    },
    [removeNotification]
  );

  useEffect(() => {
    let cleanupInterval: NodeJS.Timeout | undefined;
    if (isMobile && notifications.length > 0 && enabled) {
      cleanupInterval = setInterval(() => {
        cleanupExpiredNotifications();
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
        handleReceiveNotification(event.data.payload as INotification);
      }
    };
    if ('serviceWorker' in navigator && isMobile && enabled) {
      navigator.serviceWorker.addEventListener('message', listenerPushNotification);
    }
    return () => {
      navigator.serviceWorker.removeEventListener('message', listenerPushNotification);
    };
  }, [enabled, handleReceiveNotification, isMobile]);

  console.log(notifications);

  return (
    <>
      {isMobile &&
        enabled &&
        notifications
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
          .map((notification, index) => (
            <NotificationContent
              useOverlay={index === 0}
              key={notification.id}
              defaultOpen={checkIsExpired(notification)}
              notification={notification}
              onHandleRequest={onHandleRequest}
            />
          ))}
      {children}
    </>
  );
};
