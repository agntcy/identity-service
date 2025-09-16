/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {ErrorBoundary} from 'react-error-boundary';
import {HelmetProvider} from 'react-helmet-async';
import {Router} from './router/router';
import {Toaster} from '@outshift/spark-design';
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
import {config as cookieConfig} from './cookies/config';
import {InstallButtonPwa} from './components/shared/pwa/install-button-pwa';
import {useWindowSize} from './hooks';
import {Manifest} from './components/shared/manifest/manifest';
import {NotificationUtilsProvider} from './providers/notification-utils-provider/notification-utils-provider';
import {ErrorPageBoundary} from './components/router/error-page-boundary';
import {Maze} from './components/shared/maze/maze';

const App = () => {
  const {isMobile} = useWindowSize();

  useEffect(() => {
    if (window) {
      void CookieConsentVanilla.run(cookieConfig);
    } else {
      console.warn('CookieConsent is not available in this environment.');
    }
  }, []);

  return (
    <ThemeProvider>
      <ErrorBoundary
        fallbackRender={(props) => <ErrorPageBoundary {...props} resetErrorBoundary={() => window.location.reload()} />}
      >
        <HelmetProvider>
          <Manifest />
          <Maze />
          <AuthProvider>
            <AnalyticsProvider>
              <ApiProvider>
                <QueryProvider>
                  <Toaster
                    offset={isMobile ? undefined : {top: '64px', right: '16px'}}
                    expand={false}
                    duration={3500}
                    position={isMobile ? 'top-center' : 'top-right'}
                  />
                  <FeatureFlagsProvider>
                    <PwaProvider>
                      <NotificationUtilsProvider>
                        <NotificationsProvider>
                          <Router />
                        </NotificationsProvider>
                      </NotificationUtilsProvider>
                    </PwaProvider>
                  </FeatureFlagsProvider>
                </QueryProvider>
              </ApiProvider>
            </AnalyticsProvider>
          </AuthProvider>
          <InstallButtonPwa />
        </HelmetProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
