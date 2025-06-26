/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {createRoot} from 'react-dom/client';
import App from './app';

import '@outshift/spark-design/typography.css';
import './styles/typography.css';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(<App />);
