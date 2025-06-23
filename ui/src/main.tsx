/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {createRoot} from 'react-dom/client';
import App from './app';

import './styles/index.css';
import './styles/typography.css';
import '@outshift/spark-design/typography.css';

createRoot(document.getElementById('root')!).render(<App />);
