/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {createRoot} from 'react-dom/client';
import App from './app';

import 'vanilla-cookieconsent/dist/cookieconsent.css';
import '@open-ui-kit/core/typography.css';
import './styles/typography.css';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(<App />);
