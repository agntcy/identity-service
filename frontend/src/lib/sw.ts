/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute} from 'workbox-precaching';
import {NavigationRoute, registerRoute} from 'workbox-routing';

const ICON_PATH = '/pwa-192x192.png';
const BADGE_PATH = '/pwa-64x64.png';

declare let self: ServiceWorkerGlobalScope;

self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    try {
      await self.skipWaiting();
    } catch (error) {
      console.error('Error during service worker skipWaiting:', error);
    }
  }
});

// self.__WB_MANIFEST is default injection point
precacheAndRoute(self.__WB_MANIFEST);

// clean old assets
cleanupOutdatedCaches();

/** @type {RegExp[] | undefined} */
let allowlist;
// in dev mode, we disable precaching to avoid caching issues
if (import.meta.env.DEV) {
  allowlist = [/^\/$/];
}

// to allow work offline
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), {allowlist}));

// SW logic for push notifications //

const sendNotification = async (payload: any) => {
  try {
    await self.clients.matchAll({type: 'window', includeUncontrolled: true}).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'PUSH_NOTIFICATION',
          payload: payload
        });
      });
    });
  } catch (error) {
    console.error('Error sending notification:', error);
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

self.addEventListener('push', async (event) => {
  try {
    if (event.data) {
      const notificationData = event.data.text();
      let parsedData;
      try {
        parsedData = JSON.parse(notificationData);
      } catch (jsonError) {
        parsedData = notificationData; // Fallback to raw text if JSON parsing fails
        console.error('Failed to parse JSON from push event data:', jsonError);
      }
      if (parsedData) {
        await sendNotification(parsedData);
        const options = getNotificationOptions(parsedData);
        if (!options) {
          console.error('Invalid notification options, cannot display notification');
          return;
        }
        await self.registration.showNotification((parsedData?.title as string) || 'Agent Identity | AGNTCY', options);
      }
    }
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  const {action, notification} = event;
  console.log('Notification click event:', event);
});
