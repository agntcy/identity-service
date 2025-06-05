/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig, loadEnv} from 'vite';
import svgr from 'vite-plugin-svgr';

/** @type {import('vite').UserConfig} */
export default defineConfig(({mode}) => {
  process.env = {...process.env, ...loadEnv(mode, process.cwd())};
  return {
    server: {
      port: parseInt(process.env.VITE_APP_CLIENT_PORT || '55000'),
      strictPort: true,
      open: true
    },
    preview: {
      port: parseInt(process.env.VITE_APP_CLIENT_PORT || '55000'),
      strictPort: true,
      open: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    build: {
      chunkSizeWarningLimit: 1600
    },
    plugins: [react(), tailwindcss(), svgr()]
  };
});
