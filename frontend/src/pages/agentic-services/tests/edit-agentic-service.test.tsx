/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {screen, fireEvent} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach} from 'vitest';
import EditAgenticService from '../edit-agentic-service';
import {useGetAgenticService} from '@/queries';
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
  useGetAgenticService: vi.fn()
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

vi.mock('@/components/agentic-services/edit/edit-agentic-service-form', () => ({
  EditAgenticServiceForm: ({app}: any) => (
    <div data-testid="edit-agentic-service-form" data-app={JSON.stringify(app)}>
      EditAgenticServiceForm
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

const mockUseGetAgenticService = vi.mocked(useGetAgenticService);

describe('EditAgenticService', () => {
  const mockRefetch = vi.fn();

  const mockAgenticService = {
    id: 'service-123',
    name: 'Test Agentic Service',
    description: 'Test agentic service description',
    config: {}
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mocked modules
    const routerMocks = vi.mocked(await import('react-router-dom'));

    // Setup router mocks
    routerMocks.useParams.mockReturnValue({id: 'service-123'});
    routerMocks.generatePath.mockReturnValue('/agentic-services/info/service-123');

    // Setup default query response
    mockUseGetAgenticService.mockReturnValue({
      data: mockAgenticService,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);
  });

  it('renders without crashing', () => {
    renderWithClient(<EditAgenticService />);
    expect(screen.getByTestId('base-page')).toBeInTheDocument();
  });

  it('renders with correct title', () => {
    renderWithClient(<EditAgenticService />);
    expect(screen.getByTestId('page-title')).toHaveTextContent('Edit Agentic Service');
  });

  it('renders breadcrumbs correctly', async () => {
    const routerMocks = vi.mocked(await import('react-router-dom'));
    routerMocks.generatePath.mockReturnValue('/agentic-services/info/service-123');

    renderWithClient(<EditAgenticService />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    expect(breadcrumbsData).toEqual([
      {
        text: 'Agentic Services',
        link: PATHS.agenticServices.base
      },
      {
        text: 'Test Agentic Service',
        link: '/agentic-services/info/service-123'
      },
      {
        text: 'Edit'
      }
    ]);

    expect(routerMocks.generatePath).toHaveBeenCalledWith(PATHS.agenticServices.info.base, {id: 'service-123'});
  });

  it('renders breadcrumbs with fallback text when no service name', () => {
    mockUseGetAgenticService.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditAgenticService />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    expect(breadcrumbsData[1].text).toBe('Agentic Service');
  });

  it('renders breadcrumbs with empty id when id is undefined', async () => {
    const routerMocks = vi.mocked(await import('react-router-dom'));
    routerMocks.useParams.mockReturnValue({id: undefined});
    routerMocks.generatePath.mockReturnValue('/agentic-services/info/');

    renderWithClient(<EditAgenticService />);

    expect(routerMocks.generatePath).toHaveBeenCalledWith(PATHS.agenticServices.info.base, {id: ''});
  });

  it('calls useGetAgenticService with correct id', () => {
    renderWithClient(<EditAgenticService />);
    expect(mockUseGetAgenticService).toHaveBeenCalledWith('service-123');
  });

  it('calls useGetAgenticService with undefined when id is not provided', async () => {
    const routerMocks = vi.mocked(await import('react-router-dom'));
    routerMocks.useParams.mockReturnValue({id: undefined});

    renderWithClient(<EditAgenticService />);
    expect(mockUseGetAgenticService).toHaveBeenCalledWith(undefined);
  });

  it('shows loading state during service fetch', () => {
    mockUseGetAgenticService.mockReturnValue({
      data: null,
      isLoading: true,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditAgenticService />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading Agentic Service');
  });

  it('shows loading state during service refetch', () => {
    mockUseGetAgenticService.mockReturnValue({
      data: mockAgenticService,
      isLoading: false,
      isFetching: true,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditAgenticService />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading Agentic Service');
  });

  it('shows loading state when both isLoading and isFetching are true', () => {
    mockUseGetAgenticService.mockReturnValue({
      data: null,
      isLoading: true,
      isFetching: true,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditAgenticService />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading Agentic Service');
  });

  it('shows error state', () => {
    const testError = new Error('Test error');
    mockUseGetAgenticService.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      error: testError,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditAgenticService />);

    expect(screen.getByTestId('error')).toHaveTextContent('Error loading Agentic Service');
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('handles retry action', () => {
    const testError = new Error('Test error');
    mockUseGetAgenticService.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      error: testError,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditAgenticService />);

    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders EditAgenticServiceForm when data is available', () => {
    renderWithClient(<EditAgenticService />);

    expect(screen.getByTestId('edit-agentic-service-form')).toBeInTheDocument();
    expect(screen.getByTestId('edit-agentic-service-form')).toHaveAttribute('data-app', JSON.stringify(mockAgenticService));
  });

  it('passes correct props to ConditionalQueryRenderer', () => {
    renderWithClient(<EditAgenticService />);

    const conditionalRenderer = screen.getByTestId('conditional-renderer');
    expect(conditionalRenderer).toHaveAttribute('data-use-relative-loader', 'true');

    // ...existing code...
  });

  it('passes correct itemName to ConditionalQueryRenderer', () => {
    mockUseGetAgenticService.mockReturnValue({
      data: null,
      isLoading: true,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditAgenticService />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading Agentic Service');
  });

  it('handles null data without crashing', () => {
    mockUseGetAgenticService.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditAgenticService />);

    expect(screen.getByTestId('no-data')).toHaveTextContent('No Agentic Service data');
  });

  it('handles undefined data without crashing', () => {
    mockUseGetAgenticService.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditAgenticService />);

    expect(screen.getByTestId('no-data')).toHaveTextContent('No Agentic Service data');
  });

  it('handles empty agentic service object', () => {
    const emptyService = {};
    mockUseGetAgenticService.mockReturnValue({
      data: emptyService,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditAgenticService />);

    expect(screen.getByTestId('edit-agentic-service-form')).toBeInTheDocument();
    expect(screen.getByTestId('edit-agentic-service-form')).toHaveAttribute('data-app', JSON.stringify(emptyService));
  });

  it('handles agentic service with minimal data', () => {
    const minimalService = {id: 'service-123'};
    mockUseGetAgenticService.mockReturnValue({
      data: minimalService,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditAgenticService />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    // Should use fallback text when name is not available
    expect(breadcrumbsData[1].text).toBe('Agentic Service');
  });

  it('handles agentic service with empty name', () => {
    const serviceWithEmptyName = {
      id: 'service-123',
      name: '',
      description: 'Test agentic service'
    };
    mockUseGetAgenticService.mockReturnValue({
      data: serviceWithEmptyName,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditAgenticService />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    // Should use fallback text when name is empty
    expect(breadcrumbsData[1].text).toBe('Agentic Service');
  });

  it('handles agentic service with whitespace-only name', () => {
    const serviceWithWhitespaceName = {
      id: 'service-123',
      name: '   ',
      description: 'Test agentic service'
    };
    mockUseGetAgenticService.mockReturnValue({
      data: serviceWithWhitespaceName,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditAgenticService />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    // Should use the actual name even if it's whitespace
    expect(breadcrumbsData[1].text).toBe('   ');
  });

  it('uses correct paths for breadcrumbs', () => {
    renderWithClient(<EditAgenticService />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    expect(breadcrumbsData[0].link).toBe(PATHS.agenticServices.base);
    expect(breadcrumbsData[2]).not.toHaveProperty('link'); // Edit breadcrumb should not have a link
  });

  it('passes all query states correctly to ConditionalQueryRenderer', () => {
    const testError = new Error('Network error');
    mockUseGetAgenticService.mockReturnValue({
      data: mockAgenticService,
      isLoading: false,
      isFetching: true,
      error: testError,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditAgenticService />);

    // Should show loading because isFetching is true, even with error
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('prioritizes loading state over error state', () => {
    const testError = new Error('Network error');
    mockUseGetAgenticService.mockReturnValue({
      data: null,
      isLoading: true,
      isFetching: false,
      error: testError,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditAgenticService />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('shows error when not loading and error exists', () => {
    const testError = new Error('Network error');
    mockUseGetAgenticService.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      error: testError,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditAgenticService />);

    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(screen.getByTestId('error')).toHaveTextContent('Error loading Agentic Service');
  });

  it('shows content when data exists and no loading/error states', () => {
    renderWithClient(<EditAgenticService />);

    expect(screen.getByTestId('conditional-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('edit-agentic-service-form')).toBeInTheDocument();
  });

  it('refetch function is properly passed to error action callback', () => {
    const testError = new Error('Network error');
    mockUseGetAgenticService.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      error: testError,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<EditAgenticService />);

    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});
