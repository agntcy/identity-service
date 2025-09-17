/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {createContext, useState, useContext, ReactNode, useCallback, useMemo} from 'react';
import {Banner, BannerProps} from '@cisco-eti/spark-design';
import {useWindowSize} from '@/hooks';
import {docs} from '@/utils/docs';

interface BannerType extends BannerProps {
  id: string;
}

interface BannerContextProps {
  banners: BannerType[];
  hasBanners: boolean;
  addBanner: (text: string) => void;
  removeBanner: (id: string) => void;
}

const BannerContext = createContext<BannerContextProps | undefined>(undefined);

export const BannerProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [banners, setBanners] = useState<BannerType[]>([
    {
      id: 'docs-banner',
      text: (
        <>
          <span className="text-[10px] lg:text-[16px]">
            This is a reference implementation of the AGNTCY Agent Identity Service intended for testing and demonstration
            purposes only.
          </span>{' '}
          <a className="underline text-[10px] lg:text-[16px]" href={docs()} target="_blank" rel="noopener noreferrer">
            Service Documentation
          </a>
        </>
      ),
      showCloseButton: false
    }
  ]);

  const {isMobile, isTablet} = useWindowSize();

  const hasBanners = useMemo(() => banners.length > 0 && !isMobile, [banners.length, isMobile]);

  const addBanner = useCallback((text: string, id?: string) => {
    const customId = id || `banner-${Date.now()}`;
    setBanners((prev) => [...prev, {id: customId, text}]);
  }, []);

  const removeBanner = useCallback((id: string) => {
    setBanners((prev) => prev.filter((banner) => banner.id !== id));
  }, []);

  const values = {
    banners,
    hasBanners,
    addBanner,
    removeBanner
  };

  return (
    <BannerContext.Provider value={values}>
      <div className="pt-[56px]">
        {hasBanners && (
          <div className="grid grid-cols-1">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className="col-start-1 row-start-1"
                style={{
                  zIndex: index + 1
                }}
              >
                <Banner
                  {...banner}
                  onClose={() => removeBanner(banner.id)}
                  sx={{
                    borderLeft: 'none',
                    borderRight: 'none',
                    '& .MuiAlert-icon': {
                      visibility: isMobile || isTablet ? 'hidden' : 'visible'
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}
        {children}
      </div>
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
