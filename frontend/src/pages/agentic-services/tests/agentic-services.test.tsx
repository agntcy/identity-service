/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import {screen, fireEvent} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach} from 'vitest';
import AgentServices from '../agentic-services';
import {useSettingsStore} from '@/store';
import {useGetSettings} from '@/queries';
import {useAnalytics} from '@/hooks';
import {PATHS} from '@/router/paths';
import {renderWithClient} from '@/utils/tests';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({children, to, onClick}: any) => (
      <a data-testid="link" href={to} onClick={onClick}>
        {children}
      </a>
    )
  };
});

// Mock the query hook
vi.mock('@/queries', () => ({
  useGetSettings: vi.fn()
}));

// Mock the analytics hook
vi.mock('@/hooks', () => ({
  useAnalytics: vi.fn()
}));

// Mock the settings store
vi.mock('@/store', () => ({
  useSettingsStore: vi.fn()
}));

// Mock zustand shallow
vi.mock('zustand/react/shallow', () => ({
  useShallow: vi.fn((fn) => fn)
}));

// Mock components
vi.mock('@/components/layout/base-page', () => ({
  BasePage: ({children, title, rightSideItems}: any) => (
    <div data-testid="base-page">
      <h1 data-testid="page-title">{title}</h1>
      <div data-testid="right-side-items">{rightSideItems}</div>
      {children}
    </div>
  )
}));

vi.mock('@/components/agentic-services/list/list-agentic-services', () => ({
  ListAgenticServices: () => <div data-testid="list-agentic-services">ListAgenticServices</div>
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
  }: any) => {
    if (isLoading) {
      return <div data-testid="loading">Loading {itemName}</div>;
    }
    if (error) {
      return (
        <div data-testid="error">
          Error loading {itemName}
          <button data-testid="retry-button" onClick={errorListStateProps?.actionCallback}>
            Retry
          </button>
        </div>
      );
    }
    if (!data && emptyListStateProps) {
      return (
        <div data-testid="empty-state">
          <h2 data-testid="empty-title">{emptyListStateProps.title}</h2>
          <p data-testid="empty-description">{emptyListStateProps.description}</p>
          <button data-testid="empty-action" onClick={emptyListStateProps.actionCallback}>
            {emptyListStateProps.actionTitle}
          </button>
        </div>
      );
    }
    return (
      <div data-testid="conditional-renderer" data-use-relative-loader={useRelativeLoader}>
        {children}
      </div>
    );
  }
}));

// Mock external dependencies
vi.mock('lucide-react', () => ({
  PlusIcon: ({className}: any) => (
    <div data-testid="plus-icon" className={className}>
      PlusIcon
    </div>
  )
}));

vi.mock('@outshift/spark-design', () => ({
  Button: ({children, startIcon, variant, sx, ...props}: any) => (
    <button data-testid="spark-button" data-variant={variant} style={sx} {...props}>
      {startIcon}
      {children}
    </button>
  )
}));

const mockUseSettingsStore = vi.mocked(useSettingsStore);
const mockUseGetSettings = vi.mocked(useGetSettings);
const mockUseAnalytics = vi.mocked(useAnalytics);
const mockUseShallow = vi.mocked(await import('zustand/react/shallow')).useShallow;

describe('AgentServices', () => {
  const mockAnalyticsTrack = vi.fn();
  const mockRefetch = vi.fn();

  const mockSettings = {
    issuerSettings: {
      issuer: 'https://example.com',
      clientId: 'test-client-id'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAnalytics.mockReturnValue({
      analyticsTrack: mockAnalyticsTrack,
      analyticsPage: vi.fn()
    });

    mockUseShallow.mockImplementation((selectorFn) => selectorFn);

    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: false
    });

    mockUseGetSettings.mockReturnValue({
      data: mockSettings,
      error: null,
      isLoading: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);
  });

  it('renders without crashing', () => {
    renderWithClient(<AgentServices />);
    expect(screen.getByTestId('base-page')).toBeInTheDocument();
  });

  it('renders with correct title', () => {
    renderWithClient(<AgentServices />);
    expect(screen.getByTestId('page-title')).toHaveTextContent('Agentic Services');
  });

  it('properly uses useShallow with useSettingsStore', () => {
    renderWithClient(<AgentServices />);

    expect(mockUseSettingsStore).toHaveBeenCalledWith(expect.any(Function));
    expect(mockUseShallow).toHaveBeenCalledWith(expect.any(Function));
  });

  it('uses useShallow with correct selector function', () => {
    let capturedSelector: any;

    mockUseShallow.mockImplementation((selectorFn) => {
      capturedSelector = selectorFn;
      return selectorFn;
    });

    renderWithClient(<AgentServices />);

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

    renderWithClient(<AgentServices />);

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

  it('shows Add Agentic Service button when IDP is not empty', () => {
    renderWithClient(<AgentServices />);

    expect(screen.getByText('Add Agentic Service')).toBeInTheDocument();
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    expect(screen.getByTestId('spark-button')).toHaveAttribute('data-variant', 'primary');
  });

  it('hides Add Agentic Service button when IDP is empty', () => {
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: true
    });

    renderWithClient(<AgentServices />);

    expect(screen.queryByText('Add Agentic Service')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseGetSettings.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<AgentServices />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading Identity Provider');
  });

  it('shows error state with retry button', () => {
    const testError = new Error('Network error');
    mockUseGetSettings.mockReturnValue({
      data: null,
      error: testError,
      isLoading: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<AgentServices />);

    expect(screen.getByTestId('error')).toHaveTextContent('Error loading Identity Provider');
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('calls refetch when retry button is clicked', () => {
    const testError = new Error('Network error');
    mockUseGetSettings.mockReturnValue({
      data: null,
      error: testError,
      isLoading: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<AgentServices />);

    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when IDP is empty', () => {
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: true
    });

    renderWithClient(<AgentServices />);

    expect(screen.getByTestId('empty-title')).toHaveTextContent('Get started with Agent Identity Service');
    expect(screen.getByTestId('empty-description')).toHaveTextContent(
      'Connect your identity provider to create and manage identities for your AI agents and MCP servers'
    );
    expect(screen.getByTestId('empty-action')).toHaveTextContent('Connect Identity Provider');
  });

  it('tracks analytics when Add Agentic Service button is clicked', () => {
    renderWithClient(<AgentServices />);

    const link = screen.getByTestId('link');
    fireEvent.click(link);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_NAVIGATION_ADD_AGENTIC_SERVICE');
  });

  it('tracks analytics and navigates when Connect Identity Provider is clicked', () => {
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: true
    });

    renderWithClient(<AgentServices />);

    const button = screen.getByTestId('empty-action');
    fireEvent.click(button);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_NAVIGATION_CONNECT_IDENTITY_PROVIDER');
    expect(mockNavigate).toHaveBeenCalledWith(PATHS.settings.identityProvider.connection);
  });

  it('renders ListAgenticServices when data is available', () => {
    renderWithClient(<AgentServices />);

    expect(screen.getByTestId('list-agentic-services')).toBeInTheDocument();
  });

  it('passes correct data to ConditionalQueryRenderer when IDP is not empty', () => {
    renderWithClient(<AgentServices />);

    expect(screen.getByTestId('conditional-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('conditional-renderer')).toHaveAttribute('data-use-relative-loader', 'true');
  });

  it('passes undefined data to ConditionalQueryRenderer when IDP is empty', () => {
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: true
    });

    renderWithClient(<AgentServices />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('calls useGetSettings hook', () => {
    renderWithClient(<AgentServices />);

    expect(mockUseGetSettings).toHaveBeenCalled();
  });

  it('handles null settings data', () => {
    mockUseGetSettings.mockReturnValue({
      data: null,
      error: null,
      isLoading: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<AgentServices />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('handles settings data without issuerSettings', () => {
    mockUseGetSettings.mockReturnValue({
      data: {},
      error: null,
      isLoading: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<AgentServices />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('handles undefined settings data', () => {
    mockUseGetSettings.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<AgentServices />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('passes useRelativeLoader prop to ConditionalQueryRenderer', () => {
    renderWithClient(<AgentServices />);

    expect(screen.getByTestId('conditional-renderer')).toHaveAttribute('data-use-relative-loader', 'true');
  });

  it('passes correct itemName to ConditionalQueryRenderer', () => {
    mockUseGetSettings.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<AgentServices />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading Identity Provider');
  });

  it('passes correct link to Add Agentic Service button', () => {
    renderWithClient(<AgentServices />);

    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('href', PATHS.agenticServices.add);
  });

  it('applies correct styling to Add Agentic Service button', () => {
    renderWithClient(<AgentServices />);

    const button = screen.getByTestId('spark-button');
    expect(button).toHaveStyle({fontWeight: '600 !important'});
  });

  it('renders plus icon with correct classes', () => {
    renderWithClient(<AgentServices />);

    const icon = screen.getByTestId('plus-icon');
    expect(icon).toHaveClass('w-4', 'h-4');
  });

  it('handles issuerSettings with null value', () => {
    mockUseGetSettings.mockReturnValue({
      data: {issuerSettings: null},
      error: null,
      isLoading: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<AgentServices />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('handles issuerSettings with undefined value', () => {
    mockUseGetSettings.mockReturnValue({
      data: {issuerSettings: undefined},
      error: null,
      isLoading: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<AgentServices />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('shows content when issuerSettings exists and IDP is not empty', () => {
    renderWithClient(<AgentServices />);

    expect(screen.getByTestId('conditional-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('list-agentic-services')).toBeInTheDocument();
  });

  it('prioritizes loading state over error state', () => {
    const testError = new Error('Network error');
    mockUseGetSettings.mockReturnValue({
      data: null,
      error: testError,
      isLoading: true,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<AgentServices />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('renders all required elements when in normal state', () => {
    renderWithClient(<AgentServices />);

    expect(screen.getByTestId('base-page')).toBeInTheDocument();
    expect(screen.getByTestId('page-title')).toBeInTheDocument();
    expect(screen.getByTestId('right-side-items')).toBeInTheDocument();
    expect(screen.getByTestId('conditional-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('list-agentic-services')).toBeInTheDocument();
    expect(screen.getByTestId('link')).toBeInTheDocument();
    expect(screen.getByTestId('spark-button')).toBeInTheDocument();
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
  });
});
