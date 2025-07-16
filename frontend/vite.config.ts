/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig, loadEnv} from 'vite';
import svgr from 'vite-plugin-svgr';
import {VitePWA} from 'vite-plugin-pwa';

/** @type {import('vite').UserConfig} */
export default defineConfig(({mode}) => {
  process.env = {...process.env, ...loadEnv(mode, process.cwd())};
  return {
    server: {
      port: parseInt(process.env.VITE_APP_CLIENT_PORT || '5500'),
      strictPort: true,
      open: true
    },
    preview: {
      port: parseInt(process.env.VITE_APP_CLIENT_PORT || '5500'),
      strictPort: true,
      open: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    build: {
      chunkSizeWarningLimit: 3200
    },
    plugins: [
      react(),
      tailwindcss(),
      svgr(),
      VitePWA({
        mode: mode === 'development' ? 'development' : 'production',
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'maskable-icon-512x512.png'],
        strategies: 'injectManifest',
        srcDir: 'src/lib',
        filename: 'sw.ts',
        injectRegister: 'inline',
        base: '/',
        injectManifest: {
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          minify: false,
          enableWorkboxModulesLogs: true,
          globPatterns: ['**/*.{js,css,html,svg,png,svg,ico}']
        },
        manifest: {
          name: 'Agent Identity | AGNTCY',
          short_name: 'Agent Identity',
          description: 'AGNTCY Identity management system with push notifications and offline capabilities',
          theme_color: '#eff3fc',
          scope: '/',
          start_url: '/onboard-device',
          background_color: '#eff3fc',
          icons: [
            {
              src: 'pwa-64x64.png',
              sizes: '64x64',
              type: 'image/png'
            },
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,svg,ico}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true
        },
        devOptions: {
          enabled: mode === 'development',
          type: 'module',
          navigateFallback: 'index.html'
        }
      })
    ]
  };
});
