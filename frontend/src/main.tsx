/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {createRoot} from 'react-dom/client';
import App from './app';

import 'vanilla-cookieconsent/dist/cookieconsent.css';
import '@cisco-eti/spark-design/typography.css';
import './styles/typography.css';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(<App />);
