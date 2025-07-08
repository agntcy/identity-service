/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {createContext, useState, useContext, ReactNode, useCallback} from 'react';
import {Banner} from '@outshift/spark-design';

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

  const addBanner = useCallback((text: string, id?: string) => {
    const customId = id || `banner-${Date.now()}`;
    setBanners((prev) => [...prev, {id: customId, text}]);
  }, []);

  const removeBanner = useCallback((id: string) => {
    setBanners((prev) => prev.filter((banner) => banner.id !== id));
  }, []);

  return (
    <BannerContext.Provider value={{banners, addBanner, removeBanner}}>
      {/* Ensure the banners are displayed at the top of the page */}
      <div className="pt-[56px]">
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
