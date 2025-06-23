/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ErrorBoundary} from 'react-error-boundary';
import {HelmetProvider} from 'react-helmet-async';
import {Router} from './router/router';
import {Toaster} from '@outshift/spark-design';
import {ErrorPage} from './components/router/error-page';
import AuthProvider from './providers/auth-provider/auth-provider';
import {ThemeProvider} from './providers/theme-provider/theme-provider';

const App = () => {
  return (
    <ThemeProvider>
      <ErrorBoundary fallbackRender={(props) => <ErrorPage {...props} />}>
        <HelmetProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </HelmetProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
