/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {arrayBufferToBase64, urlBase64ToUint8Array} from './utils';

const VALID_PUBLIC_KEY = 'BIls0VvKWru2ofurFmgPGDNvb0T1sMyVi0zuga5zxYJOHl4lgKE4j3lkp9wi6ZRjODNQIo7Mm4XIQPEevji_qoI';

export const checkNotifications = () => {
  try {
    if (!('serviceWorker' in navigator)) {
      console.log('❌ This browser does not support service workers.');
      return false;
    }
    if (!('Notification' in window)) {
      console.log('❌ This browser does not support notifications.');
      return false;
    }
    if (!('PushManager' in window)) {
      console.log('❌ This browser does not support push messaging.');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error inspecting notifications:', error);
    return false;
  }
};

export const askPermissionNotifications = () => {
  return new Promise(function (resolve, reject) {
    const permissionResult = Notification.requestPermission(function (result) {
      resolve(result);
    });
    if (permissionResult) {
      permissionResult.then(resolve, reject);
    }
  }).then(function (permissionResult) {
    if (permissionResult !== 'granted') {
      throw new Error("❌ We weren't granted permission.");
    }
  });
};

export const getNotificationPermissionState = async () => {
  try {
    if (navigator.permissions) {
      const result = await navigator.permissions.query({name: 'notifications'});
      return result.state; // 'granted', 'denied', or 'prompt'
    }
    // Fallback for browsers without `navigator.permissions`
    return Notification.permission; // 'granted', 'denied', or 'default'
  } catch (error) {
    console.error('Error fetching notification permission state:', error);
    return 'unknown'; // Return a default state in case of an error
  }
};

export const getSWRegistration = () => {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.ready;
  }
  return Promise.reject(new Error('❌ Service workers are not supported in this browser.'));
};

export const subscribeNotifications = () => {
  return getSWRegistration()
    .then((registration) => {
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VALID_PUBLIC_KEY)
      };
      return registration.pushManager.subscribe(subscribeOptions);
    })
    .then((pushSubscription) => {
      return pushSubscription;
    });
};

export const unsubscribeNotifications = () => {
  return getSWRegistration()
    .then((registration) => {
      return registration.pushManager.getSubscription();
    })
    .then((subscription) => {
      if (subscription) {
        return subscription.unsubscribe().then(() => {
          return true;
        });
      }
      return false;
    });
};

export const getCurrentSubscription = () => {
  return getSWRegistration()
    .then((registration) => {
      return registration.pushManager.getSubscription();
    })
    .then((subscription) => {
      if (subscription) {
        return {
          endpoint: subscription.endpoint,
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!)
        };
      }
      return null;
    });
};
