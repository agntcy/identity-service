/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig, loadEnv} from 'vite';
import svgr from 'vite-plugin-svgr';
import {VitePWA} from 'vite-plugin-pwa';
import {includes} from 'lodash';

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
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.ts',
      include: [
        'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        reportsDirectory: './coverage',
        thresholds: {
          global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50
          }
        },
        exclude: [
          'node_modules/',
          'dev-dist/',
          'dist',
          'src/vite-env.d.ts',
          'src/main.tsx',
          'src/api/generated',
          'src/utils',
          'src/types',
          'src/components/ui',
          'src/providers/auth-provider',
          'src/cookies',
          'src/constants',
          'src/config',
          'src/hooks',
          'src/lib',
          'src/components/shared/maze',
          'src/components/shared/manifest',
          'src/providers/analytics-provider/implementations',
          'src/components/shared/agentic-services',
          'src/components/router/secure-route'
        ],
        include: ['src/']
      }
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
          injectionPoint: undefined
        },
        manifest: false,
        devOptions: {
          enabled: mode === 'development',
          type: 'module',
          navigateFallback: 'index.html'
        }
      })
    ]
  };
});
