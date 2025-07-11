/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {arrayBufferToBase64, urlBase64ToUint8Array} from './utils';

export const subscribeToNotifications = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (!('serviceWorker' in navigator)) {
    console.log('This browser does not support service workers');
    return false;
  }

  if (!('PushManager' in window)) {
    console.log('This browser does not support push messaging');
    return false;
  }

  // Request notification permission
  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return false;
    }
  }

  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      return true;
    }

    // Create new subscription
    const vapidPublicKey = 'BIls0VvKWru2ofurFmgPGDNvb0T1sMyVi0zuga5zxYJOHl4lgKE4j3lkp9wi6ZRjODNQIo7Mm4XIQPEevji_qoI';
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    // Send subscription to server
    const subscriptionData = {
      endpoint: subscription.endpoint,
      p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
      auth: arrayBufferToBase64(subscription.getKey('auth')!)
    };

    return subscriptionData;

    // await apiRequest(
    //   "POST",
    //   "https://api.pyramid-platform.staging.outshift.ai/v1alpha1/device/fcb274aa-76d5-4bc5-8f88-af3f72627b3a",
    //   {
    //     subscriptionToken: JSON.stringify(subscriptionData),
    //   }
    // )
    //   .then((res) => {
    //     if (!res.ok) {
    //       throw new Error("Failed to subscribe to push notifications");
    //     }
    //   })
    //   .catch((error) => {
    //     console.error("Error sending subscription to server:", error);
    //     throw error;
    //   });
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return undefined;
  }
};

export async function subscribeFromNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}
