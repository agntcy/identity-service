/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {createRoot} from 'react-dom/client';
import App from './app';
import {registerSW} from './lib/pwa';

import '@outshift/spark-design/typography.css';
import './styles/typography.css';
import './styles/index.css';

// Register service worker for PWA functionality
registerSW();

createRoot(document.getElementById('root')!).render(<App />);
