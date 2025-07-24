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
        includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png', 'maskable-icon-512x512.png'],
        srcDir: 'src/lib',
        filename: 'sw.ts',
        injectRegister: 'inline',
        base: '/',
        strategies: 'injectManifest',
        injectManifest: {
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          minify: false,
          enableWorkboxModulesLogs: true,
          globPatterns: ['**/*.{js,css,html,svg,png,svg,ico}']
        },
        manifest: false,
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,svg,ico}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024 // 4MB
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
