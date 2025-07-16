/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {NotificationContent} from '@/components/notifications/notification-content';
import {useWindowSize} from '@/hooks';
import {apiRequest} from '@/lib/utils';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {PropsWithChildren, useCallback, useEffect, useState} from 'react';

export const NotificationsProvider: React.FC<PropsWithChildren> = ({children}) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: '',
      title: '',
      message: '',
      timestamp: '',
      defaultOpen: true
    },
    {
      id: '',
      title: '',
      message: '',
      timestamp: '',
      defaultOpen: true
    }
  ]);

  const {width} = useWindowSize();
  const queryClient = useQueryClient();
  const isMobile = width < 768;

  const handleOpenNotification = useCallback((value: boolean) => {
    setOpen(value);
  }, []);

  const handleReceiveNotification = useCallback(
    (notification: any) => {
      if (isMobile) {
        handleOpenNotification(true);
        console.log(notification);
      }
    },
    [handleOpenNotification, isMobile]
  );

  const responseMutation = useMutation({
    mutationFn: (data: {action: string; notificationId: string; title?: string; message?: string}) => {
      return apiRequest('POST', '/api/notification-responses', {
        notificationId: data.notificationId,
        action: data.action,
        title: data.title,
        message: data.message,
        timestamp: new Date().toISOString()
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['/api/notification-responses']});
    }
  });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
          handleReceiveNotification(event.data.payload);
        }
      });
    }
  }, [handleReceiveNotification]);

  return (
    <>
      {isMobile &&
        notifications.map((notification, index) => (
          <NotificationContent key={notification.id || index} defaultOpen={notification.defaultOpen} />
        ))}
      {children}
    </>
  );
};
