/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import {screen, fireEvent} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach} from 'vitest';
import EditPolicy from '../edit-policy';
import {useGetPolicy} from '@/queries';
import {PATHS} from '@/router/paths';
import {renderWithClient} from '@/utils/tests';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    generatePath: vi.fn()
  };
});

// Mock queries
vi.mock('@/queries', () => ({
  useGetPolicy: vi.fn()
}));

// Mock components
vi.mock('@/components/layout/base-page', () => ({
  BasePage: ({children, title, breadcrumbs}: any) => (
    <div data-testid="base-page">
      <h1 data-testid="page-title">{title}</h1>
      <div data-testid="breadcrumbs">{JSON.stringify(breadcrumbs)}</div>
      {children}
    </div>
  )
}));

vi.mock('@/components/policies/add-edit/add-edit-stepper', () => ({
  AddEditPolicyStepper: ({mode, policy}: any) => (
    <div data-testid="add-edit-stepper" data-mode={mode} data-policy={JSON.stringify(policy)}>
      AddEditPolicyStepper
    </div>
  )
}));

vi.mock('@/components/ui/conditional-query-renderer', () => ({
  ConditionalQueryRenderer: ({children, itemName, data, error, isLoading, useRelativeLoader, errorListStateProps}: any) => {
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
    if (!data) {
      return <div data-testid="no-data">No {itemName} data</div>;
    }
    return (
      <div data-testid="conditional-renderer" data-use-relative-loader={useRelativeLoader}>
        {children}
      </div>
    );
  }
}));

const mockUseGetPolicy = vi.mocked(useGetPolicy);

describe('EditPolicy', () => {
  const mockRefetch = vi.fn();

  const mockPolicy = {
    id: 'policy-123',
    name: 'Test Policy',
    description: 'Test policy description',
    rules: []
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mocked modules
    const routerMocks = vi.mocked(await import('react-router-dom'));

    // Setup router mocks
    routerMocks.useParams.mockReturnValue({id: 'policy-123'});
    routerMocks.generatePath.mockReturnValue('/policies/info/policy-123');

    // Setup default query response
    mockUseGetPolicy.mockReturnValue({
      data: mockPolicy,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);
  });

  it('renders without crashing', () => {
    renderWithClient(<EditPolicy />);
    expect(screen.getByTestId('base-page')).toBeInTheDocument();
  });

  it('renders with correct title', () => {
    renderWithClient(<EditPolicy />);
    expect(screen.getByTestId('page-title')).toHaveTextContent('Edit Policy');
  });

  it('renders breadcrumbs correctly', async () => {
    const routerMocks = vi.mocked(await import('react-router-dom'));
    routerMocks.generatePath.mockReturnValue('/policies/info/policy-123');

    renderWithClient(<EditPolicy />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    expect(breadcrumbsData).toEqual([
      {
        text: 'Policies',
        link: PATHS.policies.base
      },
      {
        text: 'Test Policy',
        link: '/policies/info/policy-123'
      },
      {
        text: 'Edit'
      }
    ]);

    expect(routerMocks.generatePath).toHaveBeenCalledWith(PATHS.policies.info, {id: 'policy-123'});
  });

  it('renders breadcrumbs with fallback text when no policy name', () => {
    mockUseGetPolicy.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditPolicy />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    expect(breadcrumbsData[1].text).toBe('Policy');
  });

  it('renders breadcrumbs with empty id when id is undefined', async () => {
    const routerMocks = vi.mocked(await import('react-router-dom'));
    routerMocks.useParams.mockReturnValue({id: undefined});
    routerMocks.generatePath.mockReturnValue('/policies/info/');

    renderWithClient(<EditPolicy />);

    expect(routerMocks.generatePath).toHaveBeenCalledWith(PATHS.policies.info, {id: ''});
  });

  it('calls useGetPolicy with correct id', () => {
    renderWithClient(<EditPolicy />);
    expect(mockUseGetPolicy).toHaveBeenCalledWith('policy-123');
  });

  it('calls useGetPolicy with undefined when id is not provided', async () => {
    const routerMocks = vi.mocked(await import('react-router-dom'));
    routerMocks.useParams.mockReturnValue({id: undefined});

    renderWithClient(<EditPolicy />);
    expect(mockUseGetPolicy).toHaveBeenCalledWith(undefined);
  });

  it('shows loading state during policy fetch', () => {
    mockUseGetPolicy.mockReturnValue({
      data: null,
      isLoading: true,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditPolicy />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading Policy');
  });

  it('shows loading state during policy refetch', () => {
    mockUseGetPolicy.mockReturnValue({
      data: mockPolicy,
      isLoading: false,
      isFetching: true,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditPolicy />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading Policy');
  });

  it('shows loading state when both isLoading and isFetching are true', () => {
    mockUseGetPolicy.mockReturnValue({
      data: null,
      isLoading: true,
      isFetching: true,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditPolicy />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading Policy');
  });

  it('shows error state', () => {
    const testError = new Error('Test error');
    mockUseGetPolicy.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      error: testError,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditPolicy />);

    expect(screen.getByTestId('error')).toHaveTextContent('Error loading Policy');
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('handles retry action', () => {
    const testError = new Error('Test error');
    mockUseGetPolicy.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      error: testError,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditPolicy />);

    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders AddEditPolicyStepper when data is available', () => {
    renderWithClient(<EditPolicy />);

    expect(screen.getByTestId('add-edit-stepper')).toBeInTheDocument();
    expect(screen.getByTestId('add-edit-stepper')).toHaveAttribute('data-mode', 'edit');
    expect(screen.getByTestId('add-edit-stepper')).toHaveAttribute('data-policy', JSON.stringify(mockPolicy));
  });

  it('passes correct props to ConditionalQueryRenderer', () => {
    renderWithClient(<EditPolicy />);

    const conditionalRenderer = screen.getByTestId('conditional-renderer');
    expect(conditionalRenderer).toHaveAttribute('data-use-relative-loader', 'true');
  });

  it('passes correct itemName to ConditionalQueryRenderer', () => {
    mockUseGetPolicy.mockReturnValue({
      data: null,
      isLoading: true,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditPolicy />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading Policy');
  });

  it('handles null data without crashing', () => {
    mockUseGetPolicy.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditPolicy />);

    expect(screen.getByTestId('no-data')).toHaveTextContent('No Policy data');
  });

  it('handles undefined data without crashing', () => {
    mockUseGetPolicy.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditPolicy />);

    expect(screen.getByTestId('no-data')).toHaveTextContent('No Policy data');
  });

  it('handles empty policy object', () => {
    const emptyPolicy = {};
    mockUseGetPolicy.mockReturnValue({
      data: emptyPolicy,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditPolicy />);

    expect(screen.getByTestId('add-edit-stepper')).toBeInTheDocument();
    expect(screen.getByTestId('add-edit-stepper')).toHaveAttribute('data-policy', JSON.stringify(emptyPolicy));
  });

  it('handles policy with minimal data', () => {
    const minimalPolicy = {id: 'policy-123'};
    mockUseGetPolicy.mockReturnValue({
      data: minimalPolicy,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditPolicy />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    // Should use fallback text when name is not available
    expect(breadcrumbsData[1].text).toBe('Policy');
  });

  it('handles policy with empty name', () => {
    const policyWithEmptyName = {
      id: 'policy-123',
      name: '',
      description: 'Test policy'
    };
    mockUseGetPolicy.mockReturnValue({
      data: policyWithEmptyName,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditPolicy />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    // Should use fallback text when name is empty
    expect(breadcrumbsData[1].text).toBe('Policy');
  });

  it('handles policy with whitespace-only name', () => {
    const policyWithWhitespaceName = {
      id: 'policy-123',
      name: '   ',
      description: 'Test policy'
    };
    mockUseGetPolicy.mockReturnValue({
      data: policyWithWhitespaceName,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditPolicy />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    // Should use the actual name even if it's whitespace
    expect(breadcrumbsData[1].text).toBe('   ');
  });

  it('uses correct paths for breadcrumbs', () => {
    renderWithClient(<EditPolicy />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    expect(breadcrumbsData[0].link).toBe(PATHS.policies.base);
    expect(breadcrumbsData[2]).not.toHaveProperty('link'); // Edit breadcrumb should not have a link
  });

  it('passes all query states correctly to ConditionalQueryRenderer', () => {
    const testError = new Error('Network error');
    mockUseGetPolicy.mockReturnValue({
      data: mockPolicy,
      isLoading: false,
      isFetching: true,
      error: testError,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditPolicy />);

    // Should show loading because isFetching is true, even with error
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('prioritizes loading state over error state', () => {
    const testError = new Error('Network error');
    mockUseGetPolicy.mockReturnValue({
      data: null,
      isLoading: true,
      isFetching: false,
      error: testError,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditPolicy />);

    // Should show loading, not error, when isLoading is true
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('shows error when not loading and error exists', () => {
    const testError = new Error('Network error');
    mockUseGetPolicy.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      error: testError,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditPolicy />);

    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  it('shows content when data exists and no loading/error states', () => {
    renderWithClient(<EditPolicy />);

    expect(screen.getByTestId('conditional-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('add-edit-stepper')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('refetch function is properly passed to error action callback', () => {
    const testError = new Error('Test error');
    mockUseGetPolicy.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      error: testError,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditPolicy />);

    // Click the retry button
    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });
});
