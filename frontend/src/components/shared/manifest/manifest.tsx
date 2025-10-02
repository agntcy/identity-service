/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */
import config from '@/config';
import {globalConfig} from '@/config/global';
import {useMemo} from 'react';
import {Helmet} from 'react-helmet-async';

export const Manifest = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const id = searchParams.get('id');

  const manifestHref = useMemo(() => {
    const manifest = {
      name: globalConfig.pwa.name,
      short_name: globalConfig.pwa.shortName,
      description: globalConfig.pwa.description,
      theme_color: globalConfig.pwa.themeColor,
      display: 'standalone',
      display_override: ['tabbed'],
      orientation: 'portrait',
      scope: window.location.origin,
      start_url: id
        ? `${window.location.origin}${config.APP_BASE_NAME}/onboard-device?id=${id}`
        : `${window.location.origin}${config.APP_BASE_NAME}/onboard-device`,
      background_color: globalConfig.pwa.backgroundColor,
      icons: [
        {
          src: `${window.location.origin}/pwa-64x64.png`,
          sizes: '64x64',
          type: 'image/png'
        },
        {
          src: `${window.location.origin}/pwa-192x192.png`,
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: `${window.location.origin}/pwa-512x512.png`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: `${window.location.origin}/maskable-icon-512x512.png`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    };
    const dataUri = `data:application/json;base64,${btoa(JSON.stringify(manifest))}`;
    return dataUri;
  }, [id]);

  return (
    <Helmet>
      <title>{globalConfig.title}</title>
      <meta name="description" content={globalConfig.description} />
      <link rel="manifest" href={manifestHref} />
    </Helmet>
  );
};
