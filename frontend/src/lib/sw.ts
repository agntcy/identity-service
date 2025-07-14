/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute} from 'workbox-precaching';
import {NavigationRoute, registerRoute} from 'workbox-routing';

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

self.addEventListener('push', (event) => {
  try {
    if (event.data) {
      const notificationData = event.data.text();
      console.log('Push event data:', notificationData);
      // const options = {
      //   body: notificationData.body || '',
      //   icon: notificationData.icon || '/icon.png',
      //   badge: notificationData.badge || '/badge.png',
      //   data: notificationData.data || {}
      // };

      // event.waitUntil(
      //   self.registration.showNotification(notificationData.title || 'New Notification', options)
      // );
    }
  } catch (error) {
    console.error('Error handling push event:', error);
  }
  // let notificationData;
  // try {
  //   if (event.data) {
  //     try {
  //       notificationData = JSON.parse(event.data.text());
  //     } catch (jsonError) {
  //       console.error('Failed to parse JSON from push event data:', jsonError);
  //       notificationData = event.data.text();
  //     }
  //   }
  // } catch (error) {
  //   handleError(error, 'push event data parsing');
  //   return;
  // }

  // console.log(notificationData);

  // // console.log(notificationData)
  // // // Send notification data to the client
  // // self.clients.matchAll({type: 'window', includeUncontrolled: true}).then((clients) => {
  // //   clients.forEach((client) => {
  // //     client.postMessage({
  // //       type: 'PUSH_NOTIFICATION',
  // //       payload: notificationData
  // //     });
  // //   });
  // // });

  // const options = getNotificationOptions(notificationData);
  // if (!options) {
  //   console.error('Invalid notification options, cannot display notification');
  //   return;
  // }

  // try {
  //   event.waitUntil(showNotification(notificationData.title || 'Agent Identity | AGNTCY', options));
  // } catch (error) {
  //   console.error('Error processing notification data:', error);
  //   return;
  // }

  // console.log('Notification options:', options);
  // console.log('Notification options:', options);
  // event.waitUntil(self.registration.showNotification('Agent Identity | AGNTCY', options));
  // console.log('Notification displayed:', options.title || 'New Notification', options.body || '');
});

// self.__WB_MANIFEST is default injection point
precacheAndRoute(self.__WB_MANIFEST);

// clean old assets
cleanupOutdatedCaches();

// to allow work offline
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));
