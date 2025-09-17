/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {render} from '@testing-library/react';
import {describe, it, vi, beforeEach, expect} from 'vitest';
import '@testing-library/jest-dom';
import App from './app';

vi.mock('./router/router', () => ({
  Router: () => <div data-testid="router">Router</div>
}));

vi.mock('./providers/auth-provider/auth-provider', () => ({
  default: ({children}: {children: React.ReactNode}) => <div data-testid="auth-provider">{children}</div>
}));

vi.mock('./providers/theme-provider/theme-provider', () => ({
  ThemeProvider: ({children}: {children: React.ReactNode}) => <div data-testid="theme-provider">{children}</div>
}));

vi.mock('./providers/api-provider/api-provider', () => ({
  ApiProvider: ({children}: {children: React.ReactNode}) => <div data-testid="api-provider">{children}</div>
}));

vi.mock('./providers/query-provider/query-provider', () => ({
  QueryProvider: ({children}: {children: React.ReactNode}) => <div data-testid="query-provider">{children}</div>
}));

vi.mock('./providers/feature-flags-provider/feature-flags-provider', () => ({
  FeatureFlagsProvider: ({children}: {children: React.ReactNode}) => (
    <div data-testid="feature-flags-provider">{children}</div>
  )
}));

vi.mock('./providers/analytics-provider/analytics-provider', () => ({
  AnalyticsProvider: ({children}: {children: React.ReactNode}) => <div data-testid="analytics-provider">{children}</div>
}));

vi.mock('./providers/pwa-provider/pwa-provider', () => ({
  PwaProvider: ({children}: {children: React.ReactNode}) => <div data-testid="pwa-provider">{children}</div>
}));

vi.mock('./providers/notifications-provider/notifications-provider', () => ({
  NotificationsProvider: ({children}: {children: React.ReactNode}) => (
    <div data-testid="notifications-provider">{children}</div>
  )
}));

vi.mock('./providers/notification-utils-provider/notification-utils-provider', () => ({
  NotificationUtilsProvider: ({children}: {children: React.ReactNode}) => (
    <div data-testid="notification-utils-provider">{children}</div>
  )
}));

vi.mock('./components/shared/manifest/manifest', () => ({
  Manifest: () => <div data-testid="manifest">Manifest</div>
}));

vi.mock('./components/shared/maze/maze', () => ({
  Maze: () => <div data-testid="maze">Maze</div>
}));

vi.mock('./components/shared/pwa/install-button-pwa', () => ({
  InstallButtonPwa: () => <div data-testid="install-button-pwa">Install Button</div>
}));

vi.mock('./components/router/error-page-boundary', () => ({
  ErrorPageBoundary: () => <div data-testid="error-page-boundary">Error Page</div>
}));

vi.mock('@cisco-eti/spark-design', () => ({
  Toaster: ({children, expand, ...props}: any) => (
    <div data-testid="toaster" data-expand={expand} {...props}>
      {children}
    </div>
  )
}));

vi.mock('vanilla-cookieconsent', () => ({
  run: vi.fn()
}));

vi.mock('./hooks', () => ({
  useWindowSize: vi.fn(() => ({isMobile: false}))
}));

vi.mock('./cookies/config', () => ({
  config: {}
}));

// Mock react-error-boundary
vi.mock('react-error-boundary', () => ({
  ErrorBoundary: ({children}: {children: React.ReactNode}) => <div data-testid="error-boundary">{children}</div>
}));

// Mock react-helmet-async
vi.mock('react-helmet-async', () => ({
  HelmetProvider: ({children}: {children: React.ReactNode}) => <div data-testid="helmet-provider">{children}</div>
}));

const mockUseWindowSize = vi.mocked(await import('./hooks')).useWindowSize;

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<App />);
  });

  it('renders mobile layout when isMobile is true', () => {
    mockUseWindowSize.mockReturnValue({
      windowSize: {width: 375, height: 667},
      isMobile: true,
      isTablet: false
    });

    mockUseWindowSize.mockReturnValue({
      windowSize: {width: 1280, height: 800},
      isMobile: false,
      isTablet: false
    });
  });

  it('renders desktop layout when isMobile is false', () => {
    mockUseWindowSize.mockReturnValue({
      windowSize: {width: 1280, height: 800},
      isMobile: false,
      isTablet: false
    });

    const {getByTestId} = render(<App />);

    expect(getByTestId('toaster')).toBeInTheDocument();
  });

  it('renders all main components', () => {
    const {getByTestId} = render(<App />);

    expect(getByTestId('theme-provider')).toBeInTheDocument();
    expect(getByTestId('error-boundary')).toBeInTheDocument();
    expect(getByTestId('helmet-provider')).toBeInTheDocument();
    expect(getByTestId('manifest')).toBeInTheDocument();
    expect(getByTestId('maze')).toBeInTheDocument();
    expect(getByTestId('router')).toBeInTheDocument();
    expect(getByTestId('install-button-pwa')).toBeInTheDocument();
  });
});
