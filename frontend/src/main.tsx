/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {createRoot} from 'react-dom/client';
import App from './app';
import {initPWA} from './lib/pwa';

import '@outshift/spark-design/typography.css';
import './styles/typography.css';
import './styles/index.css';

// Initialize PWA with error handling
try {
  initPWA();
} catch (error) {
  console.error('Failed to initialize PWA:', error);
}

createRoot(document.getElementById('root')!).render(<App />);
