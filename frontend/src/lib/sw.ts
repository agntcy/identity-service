/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {clientsClaim} from 'workbox-core';
import {INotification, NotificationType} from '@/types/sw/notification';
import {generateRandomId} from '@/utils/utils';
import {registerRoute} from 'workbox-routing';
import config from '@/config';
import {ApproveTokenRequest} from '@/types/api/auth';
import {notificationUtils} from '@/utils/notification-store';
import {ExpirationPlugin} from 'workbox-expiration';
import {CacheableResponsePlugin} from 'workbox-cacheable-response';
import {CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate} from 'workbox-strategies';

const ICON_PATH = '/pwa-192x192.png';
const BADGE_PATH = '/pwa-64x64.png';

// NOTE: pay attention to the API endpoint
const API_ENDPOINT = `${config.API_HOST}/v1alpha1/auth/approve_token`;

declare let self: ServiceWorkerGlobalScope;

const cleanupExpiredNotifications = async () => {
  try {
    const notifications = await notificationUtils.getNotifications();
    const now = Date.now();
    for (const notification of notifications) {
      if (
        notification.type === NotificationType.APPROVAL_REQUEST &&
        notification.timestamp &&
        notification.approval_request_info?.timeout_in_seconds
      ) {
        const expiryTime = notification.timestamp + notification.approval_request_info.timeout_in_seconds * 1000;
        if (now > expiryTime && notification.id) {
          await notificationUtils.removeNotification(notification.id);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
  }
};

const aproveToken = (data: ApproveTokenRequest) => {
  return fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deviceId: data.deviceId,
      sessionId: data.sessionId,
      otp: data.otp,
      approve: data.approve
    })
  });
};

const sendNotification = async (payload: any) => {
  try {
    const clients = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
    clients.forEach((client) => {
      client.postMessage({
        type: 'PUSH_NOTIFICATION',
        payload: payload
      });
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

const removeNotification = async (payload: any) => {
  try {
    if (payload.id) {
      await notificationUtils.removeNotification(payload.id as string);
    }
    const clients = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
    clients.forEach((client) => {
      client.postMessage({
        type: 'REMOVE_NOTIFICATION',
        payload: payload
      });
    });
  } catch (error) {
    console.error('Error removing notification:', error);
  }
};

const getNotificationOptions = (data: any) => {
  try {
    const options = {
      body: data.body || 'You have a new notification.',
      icon: data.icon || ICON_PATH,
      badge: data.badge || BADGE_PATH,
      tag: data.tag || 'agntcy-notification',
      actions: data.actions || [],
      vibrate: [200, 100, 200],
      requireInteraction: data.requireInteraction ?? true,
      silent: data.silent ?? false,
      timestamp: Date.now(),
      data: {
        id: data.id || Date.now().toString(),
        ...data.data
      }
    };
    return options;
  } catch (error) {
    console.error('Error creating notification options:', error);
    return null;
  }
};

self.addEventListener('activate', (event) => {
  event.waitUntil(cleanupExpiredNotifications());
});

self.addEventListener('message', async (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    try {
      await self.skipWaiting();
    } catch (error) {
      console.error('Error during service worker skipWaiting:', error);
    }
  } else if (event.data.type === 'CLOSE_NOTIFICATION') {
    try {
      const notifications = await self.registration.getNotifications();
      const notification = notifications.find((n) => n.data?.id === event.data.notificationId);
      if (notification) {
        notification.close();
      }
    } catch (error) {
      console.error('Error closing notification:', error);
    }
  }
});

self.addEventListener('push', async (event) => {
  try {
    if (event.data) {
      const notificationData: INotification | undefined = event.data.json();
      if (notificationData) {
        const id = generateRandomId();
        const idDevice = notificationData.approval_request_info?.device_id;
        const options = getNotificationOptions({
          body: notificationData.body,
          requireInteraction: notificationData.type === NotificationType.APPROVAL_REQUEST ? true : false,
          ...(notificationData.type === NotificationType.APPROVAL_REQUEST && {
            actions: [
              {action: 'deny', title: 'Deny'},
              {action: 'allow', title: 'Allow'}
            ]
          }),
          data: {
            id: id,
            timestamp: Date.now(),
            type: notificationData.type,
            approval_request_info: notificationData.approval_request_info,
            url: idDevice ? `/onboard-device?id=${idDevice}` : `/onboard-device`
          }
        });

        if (!options) {
          console.error('Invalid notification options, cannot display notification');
          return;
        }

        // Add error handling for IndexedDB operations
        try {
          await notificationUtils.addNotification({
            ...notificationData,
            id: id,
            timestamp: Date.now()
          });
        } catch (dbError) {
          console.error('Error saving notification to IndexedDB:', dbError);
        }

        await sendNotification({...notificationData, id, timestamp: Date.now()});
        await self.registration.showNotification('Outshift Agent Identity Service Powered by AGNTCY', options);
      }
    }
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  try {
    const {action, notification} = event;
    const data = notification.data as INotification | undefined;
    if ((action === 'allow' || action === 'deny') && data?.type === NotificationType.APPROVAL_REQUEST) {
      const now = Date.now();
      if (
        data &&
        data.timestamp &&
        data.approval_request_info?.timeout_in_seconds &&
        now < data.timestamp + (data.approval_request_info?.timeout_in_seconds || 60) * 1000
      ) {
        event.waitUntil(
          aproveToken({
            deviceId: data.approval_request_info?.device_id,
            sessionId: data.approval_request_info?.session_id,
            otp: data.approval_request_info?.otp,
            approve: action === 'allow'
          })
            .then(async () => {
              await self.registration.showNotification('Agent Identity Service | AGNTCY', {
                body: `Your request has been ${action === 'allow' ? 'approved' : 'denied'}.`
              });
            })
            .catch((error) => {
              console.error('Error approving notification:', error);
            })
            .finally(() => {
              void removeNotification(data);
              notification.close();
            })
        );
        console.log('Notification action handled successfully');
      } else {
        console.warn('Notification is expired or invalid, ignoring action');
        void removeNotification(data);
        notification.close();
      }
    } else {
      event.waitUntil(
        self.clients
          .matchAll({
            type: 'window',
            includeUncontrolled: true
          })
          .then(function (clientList) {
            for (const client of clientList) {
              if ('focus' in client) {
                event.notification.close();
                return client.focus();
              }
            }
            if (self.clients.openWindow) {
              event.notification.close();
              let url = `${self.location.origin}/onboard-device`;
              if (notification?.data?.url) {
                url = `${self.location.origin}${notification.data.url}`;
              }
              return self.clients.openWindow(url);
            }
          })
      );
    }
  } catch (error) {
    console.error('Error handling notification click:', error);
  }
});

// Disable Workbox dev logs in production
self.__WB_DISABLE_DEV_LOGS = true;

void self.skipWaiting();
clientsClaim();

// Skip caching for v1alpha1 API endpoints - always go to network
registerRoute(({url}) => url.pathname.includes('v1alpha1'), new NetworkOnly());

// Avoid caching, force always go to the server (but exclude v1alpha1)
registerRoute(
  ({url}) => !url.pathname.includes('v1alpha1'),
  new NetworkFirst({
    cacheName: 'agent-identity-service-v1',
    plugins: [new CacheableResponsePlugin({statuses: [-1]})]
  })
);

// Cache CSS, JS, and Web Worker requests with a Stale While Revalidate strategy
registerRoute(
  ({request}) =>
    request.destination === 'style' ||
    request.destination === 'manifest' ||
    request.destination === 'script' ||
    request.destination === 'worker',
  new StaleWhileRevalidate({
    cacheName: 'assets',
    plugins: [new CacheableResponsePlugin({statuses: [200]})]
  })
);

// Cache images with a Cache First strategy
registerRoute(
  ({request}) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({statuses: [200]}),
      // 50 entries max, 30 days max
      new ExpirationPlugin({maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30})
    ]
  })
);
