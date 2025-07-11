/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {apiRequest} from '@/lib/utils';
import {toast} from '@outshift/spark-design';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';

interface Notification {
  notificationId?: string;
  title?: string;
  message?: string;
}

export const Notifications = () => {
  const [notification, setNotification] = useState<Notification | undefined>();

  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();
  const notificationId = searchParams.get('notification');
  const notificationTitle = searchParams.get('title');
  const notificationMessage = searchParams.get('message');

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
      toast({
        title: 'Response Sent',
        description: 'Your response has been recorded',
        type: 'info'
      });
      setNotification(undefined);
      setSearchParams({});
    }
  });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
          setNotification({
            notificationId: event.data.payload.notificationId,
            title: event.data.payload.title,
            message: event.data.payload.message
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    if (notificationId) {
      setNotification({
        notificationId,
        title: notificationTitle || 'Notification',
        message: notificationMessage || 'You have a new notification'
      });
    }
  }, [notificationId, notificationTitle, notificationMessage]);

  return null;
};
