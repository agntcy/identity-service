/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {registerSW as vitePwaRegisterSW} from 'virtual:pwa-register';

// Global variable to store the install prompt
let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function isPWAInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone || document.referrer.includes('android-app://')
  );
}

export function canInstallPWA(): boolean {
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasPrompt = deferredPrompt !== null;
  const isInstalled = isPWAInstalled();
  return hasServiceWorker && hasPrompt && !isInstalled;
}

// Setup install prompt listener
export function setupInstallPrompt(): void {
  console.log('Setting up install prompt listeners...');

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    console.log('✅ beforeinstallprompt event fired!');
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('PWA install prompt available', deferredPrompt);

    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA was installed');
    deferredPrompt = null;

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
}

// Check PWA installability criteria
export function checkInstallCriteria(): void {
  console.log('🔍 Checking PWA install criteria:');
  console.log('- HTTPS:', location.protocol === 'https:' || location.hostname === 'localhost');
  console.log('- Service Worker support:', 'serviceWorker' in navigator);
  console.log('- Already installed:', isPWAInstalled());
  console.log('- beforeinstallprompt fired:', deferredPrompt !== null);

  // Check manifest
  const manifestLink = document.querySelector('link[rel="manifest"]');
  console.log('- Manifest link:', !!manifestLink);
  if (manifestLink) {
    console.log('- Manifest href:', (manifestLink as HTMLLinkElement).href);
  }
}

// Prompt user to install PWA
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.warn('❌ Install prompt not available');
    checkInstallCriteria(); // Debug why it's not available
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const {outcome} = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('Error showing install prompt:', error);
    return false;
  }
}

// Service worker registration optimized for autoUpdate
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    try {
      vitePwaRegisterSW({
        onNeedRefresh() {
          console.log('New content available - auto-updating...');
        },
        onOfflineReady() {
          console.log('✅ App ready to work offline');
        },
        onRegistered(registration: ServiceWorkerRegistration | undefined) {
          console.log('✅ SW Registered: ', registration);

          // Check install criteria after SW registration
          setTimeout(() => {
            checkInstallCriteria();
          }, 1000);
        },
        onRegisterError(error: any) {
          console.error('❌ SW registration error:', error);
        }
      });
    } catch (error) {
      console.error('Failed to register service worker:', error);
    }
  }
}

// Legacy function name for backward compatibility
export function registerSW(): void {
  registerServiceWorker();
}

// Simplified update checker for autoUpdate mode
export function checkForSWUpdate(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service worker updated automatically');
    });
  }
}

// Get PWA installation status and capabilities
export function getPWAStatus(): {
  isInstalled: boolean;
  canInstall: boolean;
  isStandalone: boolean;
  supportsServiceWorker: boolean;
} {
  return {
    isInstalled: isPWAInstalled(),
    canInstall: canInstallPWA(),
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    supportsServiceWorker: 'serviceWorker' in navigator
  };
}

// Update initPWA to handle start_url better
export function initPWA(): void {
  console.log('🚀 Initializing PWA...');

  // Log PWA launch context
  console.log('PWA Context:', {
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    currentPath: window.location.pathname,
    referrer: document.referrer
  });
  setupInstallPrompt();
  registerServiceWorker();

  checkForSWUpdate();

  // Log status after a delay to allow events to fire
  setTimeout(() => {
    console.log('PWA initialized with autoUpdate', getPWAStatus());
  }, 2000);
}
// Type definitions
declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }
}
