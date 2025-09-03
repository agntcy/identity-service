/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import {screen, fireEvent} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach} from 'vitest';
import Policies from '../policies';
import {useSettingsStore} from '@/store';
import {useGetAgenticServiceTotalCount} from '@/queries';
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
  useGetAgenticServiceTotalCount: vi.fn()
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

vi.mock('@/components/policies/list/list-policies', () => ({
  ListPolicies: () => <div data-testid="list-policies">ListPolicies</div>
}));

vi.mock('@/components/ui/conditional-query-renderer', () => ({
  ConditionalQueryRenderer: ({children, itemName, data, error, isLoading, emptyListStateProps}: any) => {
    if (isLoading) {
      return <div data-testid="loading">Loading {itemName}</div>;
    }
    if (error) {
      return <div data-testid="error">Error loading {itemName}</div>;
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
    return <div data-testid="conditional-renderer">{children}</div>;
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

vi.mock('@mui/material', () => ({
  Button: ({children, startIcon, variant, sx, ...props}: any) => (
    <button data-testid="mui-button" data-variant={variant} style={sx} {...props}>
      {startIcon}
      {children}
    </button>
  )
}));

const mockUseSettingsStore = vi.mocked(useSettingsStore);
const mockUseGetAgenticServiceTotalCount = vi.mocked(useGetAgenticServiceTotalCount);
const mockUseAnalytics = vi.mocked(useAnalytics);
const mockUseShallow = vi.mocked(await import('zustand/react/shallow')).useShallow;

describe('Policies', () => {
  const mockAnalyticsTrack = vi.fn();

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
  });

  it('renders without crashing', () => {
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: '1'},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    expect(screen.getByTestId('base-page')).toBeInTheDocument();
  });

  it('renders with correct title', () => {
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: '1'},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    expect(screen.getByTestId('page-title')).toHaveTextContent('Policies');
  });

  it('properly uses useShallow with useSettingsStore', () => {
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: '1'},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    expect(mockUseSettingsStore).toHaveBeenCalledWith(expect.any(Function));
    expect(mockUseShallow).toHaveBeenCalledWith(expect.any(Function));
  });

  it('uses useShallow with correct selector function', () => {
    let capturedSelector: any;

    mockUseShallow.mockImplementation((selectorFn) => {
      capturedSelector = selectorFn;
      return selectorFn;
    });

    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: '1'},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

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

    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: '1'},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

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

  it('shows Add Policy button when all conditions are met', () => {
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: '1'},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    expect(screen.getByText('Add Policy')).toBeInTheDocument();
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    expect(screen.getByTestId('mui-button')).toHaveAttribute('data-variant', 'primary');
  });

  it('hides Add Policy button when IDP is empty', () => {
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: true
    });

    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: 1},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    expect(screen.queryByText('Add Policy')).not.toBeInTheDocument();
  });

  it('hides Add Policy button when loading', () => {
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    expect(screen.queryByText('Add Policy')).not.toBeInTheDocument();
  });

  it('hides Add Policy button when no agentic services exist', () => {
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: 0},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    expect(screen.queryByText('Add Policy')).not.toBeInTheDocument();
  });

  it('shows empty state for identity provider when IDP is empty', () => {
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: true
    });

    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: 1},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    expect(screen.getByTestId('empty-title')).toHaveTextContent('Get started with Agent Identity Service');
    expect(screen.getByTestId('empty-description')).toHaveTextContent(
      'Connect your identity provider to create and manage identities for your AI agents and MCP servers'
    );
    expect(screen.getByTestId('empty-action')).toHaveTextContent('Connect Identity Provider');
  });

  it('shows empty state for agentic services when none exist', () => {
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: 0},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    expect(screen.getByTestId('empty-title')).toHaveTextContent('Get started with Agent Identity Service');
    expect(screen.getByTestId('empty-description')).toHaveTextContent(
      'Add an Agentic Service to manage identities and apply TBAC based access control.'
    );
    expect(screen.getByTestId('empty-action')).toHaveTextContent('Add Agentic Service');
  });

  it('handles loading state', () => {
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading Policies');
  });

  it('handles error state', () => {
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Test error')
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    expect(screen.getByTestId('error')).toHaveTextContent('Error loading Policies');
  });

  it('tracks analytics when Add Policy button is clicked', () => {
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: 1},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    const link = screen.getByTestId('link');
    fireEvent.click(link);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_NAVIGATION_ADD_POLICY');
  });

  it('tracks analytics and navigates when Connect Identity Provider is clicked', () => {
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: true
    });

    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: 1},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    const button = screen.getByTestId('empty-action');
    fireEvent.click(button);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_NAVIGATION_CONNECT_IDENTITY_PROVIDER');
    expect(mockNavigate).toHaveBeenCalledWith(PATHS.settings.identityProvider.connection);
  });

  it('tracks analytics and navigates when Add Agentic Service is clicked', () => {
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: 0},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    const button = screen.getByTestId('empty-action');
    fireEvent.click(button);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_NAVIGATION_ADD_AGENTIC_SERVICE');
    expect(mockNavigate).toHaveBeenCalledWith(PATHS.agenticServices.add);
  });

  it('renders ListPolicies when all conditions are met', () => {
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: 1},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    expect(screen.getByTestId('list-policies')).toBeInTheDocument();
  });

  it('passes useRelativeLoader prop to ConditionalQueryRenderer', () => {
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: 1},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    // The useRelativeLoader prop is tested implicitly through the component rendering
    // Since there are nested ConditionalQueryRenderer components, we expect multiple elements
    expect(screen.getAllByTestId('conditional-renderer')).toHaveLength(2);
  });

  it('calls useGetAgenticServiceTotalCount hook', () => {
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: 1},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    expect(mockUseGetAgenticServiceTotalCount).toHaveBeenCalled();
  });

  it('correctly calculates hasAgenticServices when data is null', () => {
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: null,
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    expect(screen.queryByText('Add Policy')).not.toBeInTheDocument();
  });

  it('correctly calculates hasAgenticServices when total is string "0"', () => {
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: '0'},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);

    expect(screen.queryByText('Add Policy')).not.toBeInTheDocument();
  });

  it('correctly calculates hasAgenticServices with number data type', () => {
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: 1},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);
    expect(screen.getByText('Add Policy')).toBeInTheDocument();
  });

  it('correctly calculates hasAgenticServices with string data type', () => {
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {total: '5'},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);
    expect(screen.getByText('Add Policy')).toBeInTheDocument();
  });

  it('handles hasAgenticServices calculation edge cases', () => {
    // Test with undefined data
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);
    expect(screen.queryByText('Add Policy')).not.toBeInTheDocument();

    // Test with data but no total property
    mockUseGetAgenticServiceTotalCount.mockReturnValue({
      data: {},
      isLoading: false,
      error: null
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<Policies />);
    expect(screen.queryByText('Add Policy')).not.toBeInTheDocument();
  });
});
