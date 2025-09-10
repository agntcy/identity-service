/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import {describe, it, vi, beforeEach, expect} from 'vitest';
import {screen, fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom';
import InfoIdentityProvider from './info-identity-provider';
import {renderWithClient} from '@/utils/tests';
import {PATHS} from '@/router/paths';
import {Settings} from '@/types/api/settings';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useOutletContext: vi.fn()
  };
});

// Mock queries
vi.mock('@/queries', () => ({
  useGetSettings: vi.fn()
}));

// Mock hooks
vi.mock('@/hooks', () => ({
  useAnalytics: vi.fn()
}));

// Mock store
vi.mock('@/store', () => ({
  useSettingsStore: vi.fn()
}));

// Mock zustand
vi.mock('zustand/react/shallow', () => ({
  useShallow: vi.fn((fn) => fn)
}));

// Mock paths
vi.mock('@/router/paths', () => ({
  PATHS: {
    settings: {
      base: '/settings',
      identityProvider: {
        connection: '/settings/identity-provider/connection'
      }
    }
  }
}));

// Mock components
vi.mock('@/components/layout/base-page', () => ({
  BasePage: ({children, title, subNav, breadcrumbs}: any) => (
    <div data-testid="base-page">
      <h1 data-testid="page-title">{title}</h1>
      <div data-testid="sub-nav">{JSON.stringify(subNav)}</div>
      <div data-testid="breadcrumbs">{JSON.stringify(breadcrumbs)}</div>
      {children}
    </div>
  )
}));

vi.mock('@/components/identity-provider/information/information-provider', () => ({
  InformationProvider: ({idpSettings}: any) => (
    <div data-testid="information-provider">
      <div data-testid="idp-settings">{JSON.stringify(idpSettings)}</div>
    </div>
  )
}));

vi.mock('@/components/ui/conditional-query-renderer', () => ({
  ConditionalQueryRenderer: ({
    children,
    itemName,
    data,
    error,
    isLoading,
    useRelativeLoader,
    errorListStateProps,
    emptyListStateProps
  }: any) => (
    <div data-testid="conditional-query-renderer">
      <div data-testid="item-name">{itemName}</div>
      <div data-testid="data">{data === undefined ? 'undefined' : JSON.stringify(data)}</div>
      <div data-testid="error">{JSON.stringify(error)}</div>
      <div data-testid="is-loading">{isLoading?.toString()}</div>
      <div data-testid="use-relative-loader">{useRelativeLoader?.toString()}</div>
      <div data-testid="error-list-state-props-has-callback">{(!!errorListStateProps?.actionCallback).toString()}</div>
      <div data-testid="empty-list-state-props-title">{emptyListStateProps?.title}</div>
      <div data-testid="empty-list-state-props-description">{emptyListStateProps?.description}</div>
      <div data-testid="empty-list-state-props-action-title">{emptyListStateProps?.actionTitle}</div>
      <div data-testid="empty-list-state-props-has-callback">{(!!emptyListStateProps?.actionCallback).toString()}</div>
      <button data-testid="error-action-callback" onClick={() => errorListStateProps?.actionCallback?.()}>
        Retry
      </button>
      <button data-testid="empty-action-callback" onClick={() => emptyListStateProps?.actionCallback?.()}>
        Connect
      </button>
      {data && children}
    </div>
  )
}));

const mockUseNavigate = vi.mocked(await import('react-router-dom')).useNavigate;
const mockUseOutletContext = vi.mocked(await import('react-router-dom')).useOutletContext;
const mockUseGetSettings = vi.mocked(await import('@/queries')).useGetSettings;
const mockUseAnalytics = vi.mocked(await import('@/hooks')).useAnalytics;
const mockUseSettingsStore = vi.mocked(await import('@/store')).useSettingsStore;
const mockUseShallow = vi.mocked(await import('zustand/react/shallow')).useShallow;

describe('InfoIdentityProvider', () => {
  const mockSettingsData = {
    issuerSettings: {
      issuer: 'https://example.com',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      scopes: ['openid', 'profile'],
      redirectUri: 'https://app.example.com/callback'
    }
  };

  const mockSubNav = [
    {label: 'Information', href: '/settings/identity-provider'},
    {label: 'Connection', href: '/settings/identity-provider/connection'}
  ];

  const mockRefetch = vi.fn();
  const mockNavigate = vi.fn();
  const mockAnalyticsTrack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseNavigate.mockReturnValue(mockNavigate);

    mockUseOutletContext.mockReturnValue({
      subNav: mockSubNav
    });

    mockUseGetSettings.mockReturnValue({
      data: mockSettingsData,
      error: null,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<Settings, Error>);

    mockUseAnalytics.mockReturnValue({
      analyticsTrack: mockAnalyticsTrack,
      analyticsPage: vi.fn()
    });

    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: false
    });

    mockUseShallow.mockImplementation((selectorFn) => selectorFn);
  });

  it('renders without crashing', () => {
    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('base-page')).toBeInTheDocument();
    expect(screen.getByTestId('page-title')).toHaveTextContent('Identity Provider');
  });

  it('renders with correct props passed to BasePage', () => {
    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('page-title')).toHaveTextContent('Identity Provider');

    const subNav = screen.getByTestId('sub-nav');
    expect(subNav).toHaveTextContent(JSON.stringify(mockSubNav));

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs).toHaveTextContent('"text":"Settings"');
    expect(breadcrumbs).toHaveTextContent('"link":"/settings"');
    expect(breadcrumbs).toHaveTextContent('"text":"Identity Provider"');
  });

  it('passes correct props to ConditionalQueryRenderer when IDP is not empty', () => {
    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('item-name')).toHaveTextContent('Identity Provider');
    expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(mockSettingsData.issuerSettings));
    expect(screen.getByTestId('error')).toHaveTextContent('null');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('use-relative-loader')).toHaveTextContent('true');
  });

  it('passes undefined data when IDP is empty', () => {
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: true
    });

    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('data')).toHaveTextContent('undefined');
  });

  it('renders InformationProvider when data is available', () => {
    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('information-provider')).toBeInTheDocument();
    expect(screen.getByTestId('idp-settings')).toHaveTextContent(JSON.stringify(mockSettingsData.issuerSettings));
  });

  it('does not render InformationProvider when data is null', () => {
    mockUseGetSettings.mockReturnValue({
      data: null,
      error: null,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<Settings, Error>);

    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(screen.queryByTestId('information-provider')).not.toBeInTheDocument();
  });

  it('handles loading state', () => {
    mockUseGetSettings.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
      isFetching: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<Settings, Error>);

    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
    expect(screen.queryByTestId('information-provider')).not.toBeInTheDocument();
  });

  it('handles fetching state', () => {
    mockUseGetSettings.mockReturnValue({
      data: mockSettingsData,
      error: null,
      isLoading: false,
      isFetching: true,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<Settings, Error>);

    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
  });

  it('handles error state', () => {
    const mockError = new Error('Failed to fetch settings');

    mockUseGetSettings.mockReturnValue({
      data: null,
      error: mockError,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<Settings, Error>);

    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('error')).toHaveTextContent(JSON.stringify(mockError));
    expect(screen.queryByTestId('information-provider')).not.toBeInTheDocument();
  });

  it('provides refetch callback in errorListStateProps', () => {
    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('error-list-state-props-has-callback')).toHaveTextContent('true');
  });

  it('calls refetch when error action callback is invoked', () => {
    const mockError = new Error('Failed to fetch settings');

    mockUseGetSettings.mockReturnValue({
      data: null,
      error: mockError,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<Settings, Error>);

    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    const retryButton = screen.getByTestId('error-action-callback');
    fireEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders empty state props correctly', () => {
    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('empty-list-state-props-title')).toHaveTextContent('Get started with Agent Identity Service');
    expect(screen.getByTestId('empty-list-state-props-description')).toHaveTextContent(
      'Connect your identity provider to create and manage identities for your AI agents and MCP servers, including those supporting A2A-compatible protocols like Google A2A, with support for policies and access controls.'
    );
    expect(screen.getByTestId('empty-list-state-props-action-title')).toHaveTextContent('Connect Identity Provider');
    expect(screen.getByTestId('empty-list-state-props-has-callback')).toHaveTextContent('true');
  });

  it('tracks analytics and navigates when empty action callback is invoked', () => {
    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    const connectButton = screen.getByTestId('empty-action-callback');
    fireEvent.click(connectButton);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_NAVIGATION_CONNECT_IDENTITY_PROVIDER');
    expect(mockNavigate).toHaveBeenCalledWith('/settings/identity-provider/connection');
  });

  it('maintains consistent breadcrumb structure', () => {
    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbsText = screen.getByTestId('breadcrumbs').textContent;
    const breadcrumbs = JSON.parse(breadcrumbsText || '[]');

    expect(breadcrumbs).toHaveLength(2);
    expect(breadcrumbs[0]).toEqual({
      text: 'Settings',
      link: '/settings'
    });
    expect(breadcrumbs[1]).toEqual({
      text: 'Identity Provider'
    });
  });

  it('passes subNav from outlet context to BasePage', () => {
    const customSubNav = [
      {label: 'Custom Info', href: '/custom-info'},
      {label: 'Custom Connection', href: '/custom-connection'}
    ];

    mockUseOutletContext.mockReturnValue({
      subNav: customSubNav
    });

    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    const subNav = screen.getByTestId('sub-nav');
    expect(subNav).toHaveTextContent(JSON.stringify(customSubNav));
  });

  it('handles empty issuerSettings in data', () => {
    mockUseGetSettings.mockReturnValue({
      data: {issuerSettings: null},
      error: null,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<Settings, Error>);

    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('data')).toHaveTextContent('null');
    expect(screen.queryByTestId('information-provider')).not.toBeInTheDocument();
  });

  it('handles undefined data', () => {
    mockUseGetSettings.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<Settings, Error>);

    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('data')).toHaveTextContent('undefined');
    expect(screen.queryByTestId('information-provider')).not.toBeInTheDocument();
  });

  it('passes all required props to ConditionalQueryRenderer', () => {
    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('conditional-query-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('item-name')).toBeInTheDocument();
    expect(screen.getByTestId('data')).toBeInTheDocument();
    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(screen.getByTestId('is-loading')).toBeInTheDocument();
    expect(screen.getByTestId('use-relative-loader')).toBeInTheDocument();
    expect(screen.getByTestId('error-list-state-props-has-callback')).toBeInTheDocument();
    expect(screen.getByTestId('empty-list-state-props-has-callback')).toBeInTheDocument();
  });

  it('uses useShallow with settings store selector', () => {
    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(mockUseSettingsStore).toHaveBeenCalledWith(expect.any(Function));
  });

  it('handles both loading and fetching states correctly', () => {
    mockUseGetSettings.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
      isFetching: true,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<Settings, Error>);

    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
  });

  it('shows data when not loading but was fetching', () => {
    mockUseGetSettings.mockReturnValue({
      data: mockSettingsData,
      error: null,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<Settings, Error>);

    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('information-provider')).toBeInTheDocument();
  });

  it('uses useShallow with correct selector function', () => {
    let capturedSelector: any;

    mockUseShallow.mockImplementation((selectorFn) => {
      capturedSelector = selectorFn;
      return selectorFn;
    });

    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(mockUseShallow).toHaveBeenCalledWith(expect.any(Function));

    // Test the selector function
    const mockState = {
      isEmptyIdp: true,
      otherProperty: 'should not be included',
      anotherProperty: 123
    };

    const result = capturedSelector(mockState);

    expect(result).toEqual({
      isEmptyIdp: true
    });
    expect(result).not.toHaveProperty('otherProperty');
    expect(result).not.toHaveProperty('anotherProperty');
  });

  it('selector function works with different isEmptyIdp values', () => {
    let capturedSelector: any;

    mockUseShallow.mockImplementation((selectorFn) => {
      capturedSelector = selectorFn;
      return selectorFn;
    });

    renderWithClient(<InfoIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    // Test with false
    const stateWithFalse = {isEmptyIdp: false, other: 'data'};
    expect(capturedSelector(stateWithFalse)).toEqual({isEmptyIdp: false});

    // Test with true
    const stateWithTrue = {isEmptyIdp: true, other: 'data'};
    expect(capturedSelector(stateWithTrue)).toEqual({isEmptyIdp: true});

    // Test with undefined
    const stateWithUndefined = {isEmptyIdp: undefined, other: 'data'};
    expect(capturedSelector(stateWithUndefined)).toEqual({isEmptyIdp: undefined});
  });
});
