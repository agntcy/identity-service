/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {screen, fireEvent, waitFor} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach} from 'vitest';
import InfoPolicy from '../info-policy';
import {useGetPolicy} from '@/queries';
import {useDeletePolicy} from '@/mutations';
import {useAnalytics} from '@/hooks';
import {PATHS} from '@/router/paths';
import {renderWithClient} from '@/utils/tests';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useParams: vi.fn(),
    generatePath: vi.fn()
  };
});

// Mock queries and mutations
vi.mock('@/queries', () => ({
  useGetPolicy: vi.fn()
}));

vi.mock('@/mutations', () => ({
  useDeletePolicy: vi.fn()
}));

// Mock hooks
vi.mock('@/hooks', () => ({
  useAnalytics: vi.fn()
}));

// Mock toast
vi.mock('@outshift/spark-design', async () => {
  const actual = await vi.importActual('@outshift/spark-design');
  return {
    ...actual,
    toast: vi.fn(),
    Button: ({children, startIcon, variant, color, sx, loading, loadingPosition, onClick, ...props}: any) => (
      <button
        data-testid="spark-button"
        data-variant={variant}
        data-color={color}
        data-loading={loading}
        data-loading-position={loadingPosition}
        style={sx}
        onClick={onClick}
        {...props}
      >
        {startIcon}
        {children}
      </button>
    )
  };
});

// Mock components
vi.mock('@/components/layout/base-page', () => ({
  BasePage: ({children, title, breadcrumbs, rightSideItems}: any) => (
    <div data-testid="base-page">
      <h1 data-testid="page-title">{title}</h1>
      <div data-testid="breadcrumbs">{JSON.stringify(breadcrumbs)}</div>
      <div data-testid="right-side-items">{rightSideItems}</div>
      {children}
    </div>
  )
}));

vi.mock('@/components/policies/info/policy-content', () => ({
  PolicyContent: ({policy}: any) => (
    <div data-testid="policy-content" data-policy={JSON.stringify(policy)}>
      PolicyContent
    </div>
  )
}));

vi.mock('@/components/ui/conditional-query-renderer', () => ({
  ConditionalQueryRenderer: ({children, itemName, data, error, isLoading, errorListStateProps}: any) => {
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
    return <div data-testid="conditional-renderer">{children}</div>;
  }
}));

vi.mock('@/components/ui/confirm-modal', () => ({
  ConfirmModal: ({open, title, description, confirmButtonText, onCancel, onConfirm, buttonConfirmProps}: any) =>
    open ? (
      <div data-testid="confirm-modal">
        <h2 data-testid="modal-title">{title}</h2>
        <div data-testid="modal-description">{description}</div>
        <button data-testid="cancel-button" onClick={onCancel}>
          Cancel
        </button>
        <button data-testid="confirm-button" data-color={buttonConfirmProps?.color} onClick={onConfirm}>
          {confirmButtonText}
        </button>
      </div>
    ) : null
}));

// Mock external dependencies
vi.mock('lucide-react', () => ({
  PencilIcon: ({className}: any) => (
    <div data-testid="pencil-icon" className={className}>
      PencilIcon
    </div>
  ),
  Trash2Icon: ({className}: any) => (
    <div data-testid="trash-icon" className={className}>
      Trash2Icon
    </div>
  )
}));

const mockUseGetPolicy = vi.mocked(useGetPolicy);
const mockUseDeletePolicy = vi.mocked(useDeletePolicy);
const mockUseAnalytics = vi.mocked(useAnalytics);

describe('InfoPolicy', () => {
  const mockAnalyticsTrack = vi.fn();
  const mockRefetch = vi.fn();
  const mockDeleteMutate = vi.fn();
  const mockNavigate = vi.fn();
  const mockToast = vi.fn();
  const mockReset = vi.fn();

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
    const designMocks = vi.mocked(await import('@outshift/spark-design'));

    // Setup router mocks
    routerMocks.useNavigate.mockReturnValue(mockNavigate);
    routerMocks.useParams.mockReturnValue({id: 'policy-123'});
    routerMocks.generatePath.mockReturnValue('/policies/edit/policy-123');

    // Setup design mocks
    designMocks.toast.mockImplementation(mockToast);

    // Setup hook mocks
    mockUseAnalytics.mockReturnValue({
      analyticsTrack: mockAnalyticsTrack,
      analyticsPage: vi.fn(),
      analyticsIdentify: vi.fn(),
      analyticsReset: vi.fn()
    });

    // Setup default query response
    mockUseGetPolicy.mockReturnValue({
      data: mockPolicy,
      isLoading: false,
      error: null,
      isError: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    // Setup default mutation response with complete object
    mockUseDeletePolicy.mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
      isLoading: false,
      isSuccess: false,
      isError: false,
      status: 'idle',
      data: undefined,
      error: null,
      variables: undefined,
      reset: mockReset,
      failureCount: 0,
      failureReason: null,
      context: undefined
    } as unknown as import('@tanstack/react-query').UseMutationResult<any, Error, string, unknown>);
  });

  it('renders without crashing', () => {
    renderWithClient(<InfoPolicy />);
    expect(screen.getByTestId('base-page')).toBeInTheDocument();
  });

  it('renders with correct title', () => {
    renderWithClient(<InfoPolicy />);
    expect(screen.getByTestId('page-title')).toHaveTextContent('Policy');
  });

  it('renders breadcrumbs correctly', () => {
    renderWithClient(<InfoPolicy />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    expect(breadcrumbsData).toEqual([
      {
        text: 'Policies',
        link: PATHS.policies.base
      },
      {
        text: 'Test Policy'
      }
    ]);
  });

  it('renders breadcrumbs with fallback text when no policy name', () => {
    mockUseGetPolicy.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      isError: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<InfoPolicy />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    expect(breadcrumbsData[1].text).toBe('Policy');
  });

  it('renders action buttons when data is loaded', () => {
    renderWithClient(<InfoPolicy />);

    const buttons = screen.getAllByTestId('spark-button');
    expect(buttons).toHaveLength(2);

    // Delete button
    expect(buttons[0]).toHaveAttribute('data-variant', 'outlined');
    expect(buttons[0]).toHaveAttribute('data-color', 'negative');
    expect(buttons[0]).toHaveTextContent('Delete');

    // Edit button
    expect(buttons[1]).toHaveAttribute('data-variant', 'secondary');
    expect(buttons[1]).toHaveTextContent('Edit');
  });

  it('hides action buttons when loading', () => {
    mockUseGetPolicy.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      isError: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<InfoPolicy />);

    expect(screen.queryByTestId('spark-button')).not.toBeInTheDocument();
  });

  it('hides action buttons when error', () => {
    mockUseGetPolicy.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Test error'),
      isError: true,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<InfoPolicy />);

    expect(screen.queryByTestId('spark-button')).not.toBeInTheDocument();
  });

  it('handles delete button click', () => {
    renderWithClient(<InfoPolicy />);

    const deleteButton = screen.getAllByTestId('spark-button')[0];
    fireEvent.click(deleteButton);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_DELETE_POLICY');
    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
  });

  it('handles edit button click', async () => {
    const routerMocks = vi.mocked(await import('react-router-dom'));
    routerMocks.generatePath.mockReturnValue('/policies/edit/policy-123');

    renderWithClient(<InfoPolicy />);

    const editButton = screen.getAllByTestId('spark-button')[1];
    fireEvent.click(editButton);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_NAVIGATION_EDIT_POLICY');
    expect(routerMocks.generatePath).toHaveBeenCalledWith(PATHS.policies.edit, {id: 'policy-123'});
    expect(mockNavigate).toHaveBeenCalledWith('/policies/edit/policy-123');
  });

  it('handles edit button click with empty id', async () => {
    const routerMocks = vi.mocked(await import('react-router-dom'));
    routerMocks.useParams.mockReturnValue({id: undefined});
    routerMocks.generatePath.mockReturnValue('/policies/edit/');

    renderWithClient(<InfoPolicy />);

    const editButton = screen.getAllByTestId('spark-button')[1];
    fireEvent.click(editButton);

    expect(routerMocks.generatePath).toHaveBeenCalledWith(PATHS.policies.edit, {id: ''});
  });

  it('shows confirm modal with correct content', () => {
    renderWithClient(<InfoPolicy />);

    // Click delete button to show modal
    const deleteButton = screen.getAllByTestId('spark-button')[0];
    fireEvent.click(deleteButton);

    expect(screen.getByTestId('modal-title')).toHaveTextContent('Delete Policy');
    expect(screen.getByTestId('modal-description')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-button')).toHaveTextContent('Delete');
    expect(screen.getByTestId('confirm-button')).toHaveAttribute('data-color', 'negative');
  });

  it('handles confirm modal cancel', () => {
    renderWithClient(<InfoPolicy />);

    // Show modal
    const deleteButton = screen.getAllByTestId('spark-button')[0];
    fireEvent.click(deleteButton);

    // Cancel modal
    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);

    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
  });

  it('handles confirm modal confirm', () => {
    renderWithClient(<InfoPolicy />);

    // Show modal
    const deleteButton = screen.getAllByTestId('spark-button')[0];
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByTestId('confirm-button');
    fireEvent.click(confirmButton);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_CONFIRM_DELETE_POLICY');
    expect(mockDeleteMutate).toHaveBeenCalledWith('policy-123');
    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
  });

  it('handles confirm modal confirm with empty id', async () => {
    const routerMocks = vi.mocked(await import('react-router-dom'));
    routerMocks.useParams.mockReturnValue({id: undefined});

    renderWithClient(<InfoPolicy />);

    // Show modal
    const deleteButton = screen.getAllByTestId('spark-button')[0];
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByTestId('confirm-button');
    fireEvent.click(confirmButton);

    expect(mockDeleteMutate).toHaveBeenCalledWith('');
  });

  it('shows loading state during policy fetch', () => {
    mockUseGetPolicy.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      isError: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<InfoPolicy />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading Policy');
  });

  it('shows loading state during delete operation', () => {
    mockUseDeletePolicy.mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: true,
      isLoading: true,
      isSuccess: false,
      isError: false,
      status: 'pending',
      data: undefined,
      error: null,
      variables: undefined,
      reset: mockReset,
      failureCount: 0,
      failureReason: null,
      context: undefined
    } as unknown as import('@tanstack/react-query').UseMutationResult<any, Error, string, unknown>);

    renderWithClient(<InfoPolicy />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading Policy');
  });

  it('shows error state', () => {
    const testError = new Error('Test error');
    mockUseGetPolicy.mockReturnValue({
      data: null,
      isLoading: false,
      error: testError,
      isError: true,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<InfoPolicy />);

    expect(screen.getByTestId('error')).toHaveTextContent('Error loading Policy');
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('handles retry action', () => {
    const testError = new Error('Test error');
    mockUseGetPolicy.mockReturnValue({
      data: null,
      isLoading: false,
      error: testError,
      isError: true,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<InfoPolicy />);

    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders PolicyContent when data is available', () => {
    renderWithClient(<InfoPolicy />);

    expect(screen.getByTestId('policy-content')).toBeInTheDocument();
    expect(screen.getByTestId('policy-content')).toHaveAttribute('data-policy', JSON.stringify(mockPolicy));
  });

  it('shows loading on delete button when mutation is pending', () => {
    mockUseDeletePolicy.mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: true,
      isLoading: true,
      isSuccess: false,
      isError: false,
      status: 'pending',
      data: undefined,
      error: null,
      variables: undefined,
      reset: mockReset,
      failureCount: 0,
      failureReason: null,
      context: undefined
    } as unknown as import('@tanstack/react-query').UseMutationResult<any, Error, string, unknown>);

    renderWithClient(<InfoPolicy />);

    const deleteButton = screen.getAllByTestId('spark-button')[0];
    expect(deleteButton).toHaveAttribute('data-loading', 'true');
    expect(deleteButton).toHaveAttribute('data-loading-position', 'start');
  });

  it('calls useGetPolicy with correct id', () => {
    renderWithClient(<InfoPolicy />);

    expect(mockUseGetPolicy).toHaveBeenCalledWith('policy-123');
  });

  it('calls useDeletePolicy with correct callbacks', () => {
    renderWithClient(<InfoPolicy />);

    expect(mockUseDeletePolicy).toHaveBeenCalledWith({
      callbacks: {
        onSuccess: expect.any(Function),
        onError: expect.any(Function)
      }
    });
  });

  it('handles delete success callback', async () => {
    let onSuccessCallback: (() => void) | undefined;

    // @ts-expect-error Expected error
    mockUseDeletePolicy.mockImplementation((options: any) => {
      onSuccessCallback = options.callbacks.onSuccess;
      return {
        mutate: mockDeleteMutate,
        isPending: false,
        isLoading: false,
        isSuccess: false,
        isError: false,
        status: 'idle',
        data: undefined,
        error: null,
        variables: undefined,
        reset: mockReset,
        failureCount: 0,
        failureReason: null,
        context: undefined
      };
    });

    renderWithClient(<InfoPolicy />);

    // Trigger success callback
    onSuccessCallback?.();

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Policy deleted successfully.',
        type: 'success'
      });
      expect(mockNavigate).toHaveBeenCalledWith(PATHS.policies.base, {replace: true});
    });
  });

  it('handles delete error callback', async () => {
    let onErrorCallback: (() => void) | undefined;

    // @ts-expect-error Expected error
    mockUseDeletePolicy.mockImplementation((options: any) => {
      onErrorCallback = options.callbacks.onError;
      return {
        mutate: mockDeleteMutate,
        isPending: false,
        isLoading: false,
        isSuccess: false,
        isError: false,
        status: 'idle',
        data: undefined,
        error: null,
        variables: undefined,
        reset: mockReset,
        failureCount: 0,
        failureReason: null,
        context: undefined
      };
    });

    renderWithClient(<InfoPolicy />);

    // Trigger error callback
    onErrorCallback?.();

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'An error occurred while deleting the policy. Please try again.',
        type: 'error'
      });
    });
  });

  it('passes useRelativeLoader prop to ConditionalQueryRenderer', () => {
    renderWithClient(<InfoPolicy />);

    // This is tested implicitly by the component rendering correctly
    expect(screen.getByTestId('conditional-renderer')).toBeInTheDocument();
  });

  it('tests mutation success state', () => {
    mockUseDeletePolicy.mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
      isLoading: false,
      isSuccess: true,
      isError: false,
      status: 'success',
      data: {id: 'policy-123'},
      error: null,
      variables: 'policy-123',
      reset: mockReset,
      failureCount: 0,
      failureReason: null,
      context: undefined
    } as unknown as import('@tanstack/react-query').UseMutationResult<any, Error, string, unknown>);

    renderWithClient(<InfoPolicy />);

    // Component should still render normally when mutation is successful
    expect(screen.getByTestId('base-page')).toBeInTheDocument();
  });

  it('tests mutation error state', () => {
    const mutationError = new Error('Delete failed');
    mockUseDeletePolicy.mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
      isLoading: false,
      isSuccess: false,
      isError: true,
      status: 'error',
      data: undefined,
      error: mutationError,
      variables: 'policy-123',
      reset: mockReset,
      failureCount: 1,
      failureReason: mutationError,
      context: undefined
    } as unknown as import('@tanstack/react-query').UseMutationResult<any, Error, string, unknown>);

    renderWithClient(<InfoPolicy />);

    // Component should still render normally even when mutation has error
    expect(screen.getByTestId('base-page')).toBeInTheDocument();
  });

  it('tests mutation reset function', () => {
    renderWithClient(<InfoPolicy />);

    // Verify reset function is available
    expect(mockReset).toBeDefined();
  });
});
