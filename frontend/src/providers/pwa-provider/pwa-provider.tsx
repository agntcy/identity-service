/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {createContext, useCallback} from 'react';
import {useRegisterSW} from 'virtual:pwa-register/react';
import { pwaInfo } from 'virtual:pwa-info';

interface PwaContextProps {
  offlineReady: boolean;
  needRefresh: boolean;
  closePwa: () => void;
  updateServiceWorker: (reload?: boolean) => Promise<void>;
}

const PwaContext = createContext<PwaContextProps | undefined>(undefined);

const PERIOD = 3600; // 1 hour in seconds

export const PwaProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  const registerPeriodicSync = (period: number, swUrl: string, r: ServiceWorkerRegistration) => {
    if (period <= 0) {
      return; // Skip periodic sync if period is not set
    }

    setInterval(async () => {
      if ('onLine' in navigator && !navigator.onLine) {
        return; // Skip sync if offline
      }

      const resp = await fetch(swUrl, {
        cache: 'no-store',
        headers: {
          cache: 'no-store',
          'cache-control': 'no-cache'
        }
      });

      if (resp?.status === 200) {
        await r.update();
      }
    }, period);
  };

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log('✅ SW registered successfully.');
      if (PERIOD <= 0) {
        return;
      }
      if (r?.active?.state === 'activated') {
        registerPeriodicSync(PERIOD, swUrl, r);
      }
    },
    onRegisterError(error) {
      console.log('❌ SW registration error:', error);
    },
    onOfflineReady() {
      console.log('✅ SW is ready to work offline.');
    },
    onNeedRefresh() {
      console.log('🔄 SW needs refresh.');
    },
    immediate: true
  });

  const closePwa = useCallback(() => {
    setOfflineReady(false);
    setNeedRefresh(false);
  }, [setOfflineReady, setNeedRefresh]);

  console.log('PWA Info:', pwaInfo);

  const values = {
    offlineReady,
    needRefresh,
    closePwa,
    updateServiceWorker
  };

  return <PwaContext.Provider value={values}>{children}</PwaContext.Provider>;
};

export const usePwa = (): PwaContextProps => {
  const context = React.useContext(PwaContext);
  if (!context) {
    throw new Error('usePwa must be used within a PwaProvider');
  }
  return context;
};
