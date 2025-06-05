/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ErrorBoundary} from 'react-error-boundary';
import {HelmetProvider} from 'react-helmet-async';
import {Toaster} from './components/ui/sonner';
import {cn} from './lib/utils';
import {TooltipProvider} from './components/ui/tooltip';
import {Router} from './router/router';
import {ErrorPage} from './components/router/error-page';
import AuthProvider from './providers/auth-provider/auth-provider';

const App = () => {
  return (
    <ErrorBoundary fallbackRender={(props) => <ErrorPage {...props} />}>
      <HelmetProvider>
        <Toaster
          expand
          position="bottom-right"
          richColors
          closeButton
          visibleToasts={3}
          toastOptions={{
            duration: 2500,
            className: cn(
              'bg-background text-foreground',
              '[&>button[data-close-button=true]]:bg-background [&>button[data-close-button=true]]:!-right-3 [&>button[data-close-button=true]]:!left-auto [&>button[data-close-button=true]]:!border-2',
              '[&>div[data-icon]]:mr-2 border-2'
            )
          }}
        />
        <AuthProvider>
          <TooltipProvider>
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
