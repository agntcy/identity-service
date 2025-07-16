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
import {ApiProvider} from './providers/api-provider/api-provider';
import {QueryProvider} from './providers/query-provider/query-provider';
import {FeatureFlagsProvider} from './providers/feature-flags-provider/feature-flags-provider';
import {AnalyticsProvider} from './providers/analytics-provider/analytics-provider';
import {PwaProvider} from './providers/pwa-provider/pwa-provider';
import {NotificationsProvider} from './providers/notifications-provider/notifications-provider';
import {useEffect} from 'react';
import * as CookieConsentVanilla from 'vanilla-cookieconsent';
import {config} from './cookies/config';

const App = () => {
  useEffect(() => {
    if (window) {
      void CookieConsentVanilla.run(config);
    } else {
      console.warn('CookieConsent is not available in this environment.');
    }
  }, []);

  return (
    <ThemeProvider>
      <ErrorBoundary fallbackRender={(props) => <ErrorPage {...props} />}>
        <HelmetProvider>
          <AuthProvider>
            <AnalyticsProvider>
              <ApiProvider>
                <QueryProvider>
                  <Toaster offset={{bottom: '64px', right: '16px'}} expand={false} duration={3500} position="bottom-right" />
                  <FeatureFlagsProvider>
                    <PwaProvider>
                      <NotificationsProvider>
                        <Router />
                      </NotificationsProvider>
                    </PwaProvider>
                  </FeatureFlagsProvider>
                </QueryProvider>
              </ApiProvider>
            </AnalyticsProvider>
          </AuthProvider>
        </HelmetProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
