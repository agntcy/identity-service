/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {createContext, useState, useContext, ReactNode, useCallback, useEffect} from 'react';
import {useShallow} from 'zustand/react/shallow';
import {Banner} from '@outshift/spark-design';
import {useLocalStore} from '@/store';

interface Banner {
  id: string;
  text: string;
}

interface BannerContextProps {
  banners: Banner[];
  addBanner: (text: string) => void;
  removeBanner: (id: string) => void;
}

const BannerContext = createContext<BannerContextProps | undefined>(undefined);

export const BannerProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [banners, setBanners] = useState<Banner[]>([]);

  const {onBoarded, setOnBoarded} = useLocalStore(
    useShallow((state) => ({
      onBoarded: state.onBoarded,
      setOnBoarded: state.setOnBoarded
    }))
  );

  const addBanner = useCallback((text: string, id?: string) => {
    const customId = id || `banner-${Date.now()}`;
    setBanners((prev) => [...prev, {id: customId, text}]);
  }, []);

  const removeBanner = useCallback(
    (id: string) => {
      if (id === 'email-confirmation-banner') {
        setOnBoarded(true);
      }
      setBanners((prev) => prev.filter((banner) => banner.id !== id));
    },
    [setOnBoarded]
  );

  useEffect(() => {
    const emailConfirmationBanner = banners.find((banner) => banner.id === 'email-confirmation-banner');
    if (!onBoarded && !emailConfirmationBanner) {
      addBanner('Check your inbox and confirm your email in order to activate your account', 'email-confirmation-banner');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banners, onBoarded]);

  return (
    <BannerContext.Provider value={{banners, addBanner, removeBanner}}>
      <div className="fixed top-14 w-full z-50">
        {banners.map((banner) => (
          <Banner key={banner.id} text={banner.text} onClose={() => removeBanner(banner.id)} />
        ))}
      </div>
      {children}
    </BannerContext.Provider>
  );
};

export const useBanner = (): BannerContextProps => {
  const context = useContext(BannerContext);
  if (!context) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
};
