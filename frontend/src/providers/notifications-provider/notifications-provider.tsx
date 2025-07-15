/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {apiRequest} from '@/lib/utils';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {PropsWithChildren, useEffect} from 'react';

export const NotificationsProvider: React.FC<PropsWithChildren> = ({children}) => {
  const queryClient = useQueryClient();

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
          console.log('Received notification from service worker:', event.data);
        }
      });
    }
  }, []);

  return <>{children}</>;
};
