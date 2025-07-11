/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {precacheAndRoute} from 'workbox-precaching';

const CACHE_NAME = 'agntcy-identity-v10';
const ICON_PATH = '/pwa-192x192.png';
const BADGE_PATH = '/pwa-64x64.png';
const API_ENDPOINT = '/api/notification-responses';

const urlsToCache = ['/', '/static/js/bundle.js', '/static/css/main.css', '/manifest.json'];

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('install', (event) => {
  console.log('Service Worker installing with CACHE_NAME:', CACHE_NAME);
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
      .catch((error) => handleError(error, 'install'))
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        )
      )
      .then(() => self.clients.claim())
      .catch((error) => handleError(error, 'activate'))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)));
});

self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData = {};
  try {
    if (event.data) {
      notificationData = JSON.parse(event.data.text());
    }
  } catch (error) {
    handleError(error, 'push data parsing');
    notificationData.body = 'You have a new notification!';
  }

  // Send notification data to the client
  self.clients.matchAll({type: 'window', includeUncontrolled: true}).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'PUSH_NOTIFICATION',
        payload: notificationData
      });
    });
  });

  const options = getNotificationOptions(notificationData);

  event.waitUntil(self.registration.showNotification(notificationData.title || 'Agent Identity | AGNTCY', options));
});

self.addEventListener('notificationclick', (event) => {
  const {action, notification} = event;
  const notificationData = notification.data;

  console.log('Notification clicked:', action, notificationData);

  notification.close();

  if (action === 'allow' || action === 'deny') {
    event.waitUntil(
      fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          notificationId: notificationData.notificationId,
          action,
          title: notification.title,
          message: notification.body,
          timestamp: new Date().toISOString()
        })
      })
        .then(() => {
          const options = getNotificationOptions({body: `You ${action === 'allow' ? 'allowed' : 'denied'} the request`}, action);
          return self.registration.showNotification(`Response: ${action.toUpperCase()}`, options);
        })
        .catch((error) => handleError(error, 'notification response'))
    );
  } else {
    const responseUrl = `/?notification=${notificationData.notificationId}&title=${encodeURIComponent(
      notification.title || ''
    )}&message=${encodeURIComponent(notification.body || '')}`;

    event.waitUntil(
      clients
        .matchAll({type: 'window', includeUncontrolled: true})
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url.includes('/mobile')) {
              return client.navigate(responseUrl).then(() => client.focus());
            }
          }
          return clients.openWindow(responseUrl);
        })
        .catch((error) => {
          handleError(error, 'open mobile app');
          return clients.openWindow(responseUrl);
        })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function getNotificationOptions(data, action) {
  const baseOptions = {
    body: data.body || 'Tap Allow or Deny to respond',
    icon: ICON_PATH,
    badge: BADGE_PATH,
    tag: 'agntcy-notification',
    data: {
      notificationId: data.id || Date.now().toString(),
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'allow',
        title: 'Allow'
      },
      {
        action: 'deny',
        title: 'Deny'
      }
    ],
    vibrate: [100, 50, 100],
    requireInteraction: true
  };

  if (action) {
    baseOptions.silent = true;
    baseOptions.requireInteraction = false;
  }

  return baseOptions;
}

function handleError(error, context) {
  console.error(`Error in service worker (${context}):`, error);
}

console.log('Service Worker ready to handle events');
