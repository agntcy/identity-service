/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {registerSW as vitePwaRegisterSW} from 'virtual:pwa-register';

// Simplified service worker registration using Vite PWA
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    vitePwaRegisterSW({
      onNeedRefresh() {
        console.log('New content available, refreshing...');
        // Reload the page to get the new content
        window.location.reload();
      },
      onOfflineReady() {
        console.log('App ready to work offline');
      },
      onRegistered(r: ServiceWorkerRegistration | undefined) {
        console.log('SW Registered: ', r);
      },
      onRegisterError(error: any) {
        console.log('SW registration error', error);
      }
    });
  }
}

// Legacy function name for backward compatibility
export function registerSW(): void {
  registerServiceWorker();
}

export function checkForSWUpdate(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }
}
