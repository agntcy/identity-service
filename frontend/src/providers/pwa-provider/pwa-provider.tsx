/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {createContext, useCallback} from 'react';
import {useRegisterSW} from 'virtual:pwa-register/react';

interface PwaContextProps {
  offlineReady: boolean;
  needRefresh: boolean;
  closePwa: () => void;
  updateServiceWorker: (reload?: boolean) => Promise<void>;
}

const PwaContext = createContext<PwaContextProps | undefined>(undefined);

export const PwaProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW() {
      console.log('✅ SW registered successfully.');
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
