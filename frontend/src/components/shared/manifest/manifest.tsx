/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */
import {useMemo} from 'react';
import {Helmet} from 'react-helmet-async';

export const Manifest = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const id = searchParams.get('id');

  const manifestHref = useMemo(() => {
    const manifest = {
      name: 'Outshift Agent Identity Service Powered by AGNTCY',
      short_name: 'Agent Identity Service',
      description:
        'Outshift Agent Identity Service is powered by AGNTCY, providing secure and efficient identity management for agents.',
      theme_color: '#eff3fc',
      display: 'standalone',
      display_override: ['tabbed'],
      orientation: 'portrait',
      scope: window.location.origin,
      start_url: id ? `${window.location.origin}/onboard-device?id=${id}` : `${window.location.origin}/onboard-device`,
      background_color: '#eff3fc',
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
      <link rel="manifest" href={manifestHref} />
    </Helmet>
  );
};
