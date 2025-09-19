/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {screen, fireEvent, waitFor} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import InfoAgenticService from '../../info/info-agentic-service';
import {renderWithClient} from '@/utils/tests';
import {V1Alpha1App, V1Alpha1AppType, V1Alpha1AppStatus} from '@/api/generated/identity/app_service.swagger.api';
import {PATHS} from '@/router/paths';
import {useAnalytics} from '@/hooks';
import {useDeleteAgenticService} from '@/mutations';
import {useGetAgenticService} from '@/queries';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useParams: vi.fn(),
    generatePath: vi.fn((path, params) => path.replace(':id', params.id)),
    Outlet: ({context}: any) => (
      <div data-testid="outlet" data-context={JSON.stringify(context)}>
        Outlet Content
      </div>
    )
  };
});

// Mock hooks
vi.mock('@/hooks', () => ({
  useAnalytics: vi.fn()
}));

// Mock queries
vi.mock('@/queries', () => ({
  useGetAgenticService: vi.fn()
}));

// Mock mutations
vi.mock('@/mutations', () => ({
  useDeleteAgenticService: vi.fn()
}));

// Mock zustand shallow
vi.mock('zustand/react/shallow', () => ({
  useShallow: vi.fn((fn) => fn)
}));

// Mock components
vi.mock('@/components/layout/base-page', () => ({
  BasePage: ({children, title, breadcrumbs, subNav, rightSideItems}: any) => (
    <div data-testid="base-page">
      <h1 data-testid="page-title">{title}</h1>
      <div data-testid="breadcrumbs" data-breadcrumbs={JSON.stringify(breadcrumbs)}>
        Breadcrumbs
      </div>
      <div data-testid="sub-nav" data-sub-nav={JSON.stringify(subNav)}>
        SubNav
      </div>
      <div data-testid="right-side-items">{rightSideItems}</div>
      {children}
    </div>
  )
}));

vi.mock('@/components/ui/conditional-query-renderer', () => ({
  ConditionalQueryRenderer: ({children, itemName, error, isLoading, useRelativeLoader, errorListStateProps}: any) => {
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
    return (
      <div data-testid="conditional-renderer" data-use-relative-loader={useRelativeLoader}>
        {children}
      </div>
    );
  }
}));

vi.mock('@/components/shared/agentic-services/badge-modal-form', () => ({
  BadgeModalForm: ({app, open, onClose, onCancel, onBadgeCreated, navigateTo, confirmButtonText, title}: any) => (
    <div
      data-testid="badge-modal-form"
      data-open={open}
      data-app={JSON.stringify(app)}
      data-navigate-to={navigateTo}
      data-confirm-button-text={confirmButtonText}
      data-title={title}
    >
      <button data-testid="badge-close-button" onClick={onClose}>
        Close
      </button>
      <button data-testid="badge-cancel-button" onClick={onCancel}>
        Cancel
      </button>
      <button data-testid="badge-created-button" onClick={onBadgeCreated}>
        Badge Created
      </button>
    </div>
  )
}));

vi.mock('@/components/ui/confirm-modal', () => ({
  ConfirmModal: ({open, title, description, confirmButtonText, onCancel, onConfirm, buttonConfirmProps}: any) => (
    <div
      data-testid="confirm-modal"
      data-open={open}
      data-title={title}
      data-confirm-button-text={confirmButtonText}
      data-button-confirm-props={JSON.stringify(buttonConfirmProps)}
    >
      <div data-testid="modal-description">{description}</div>
      <button data-testid="modal-cancel-button" onClick={onCancel}>
        Cancel
      </button>
      <button data-testid="modal-confirm-button" onClick={onConfirm}>
        Confirm
      </button>
    </div>
  )
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

vi.mock('@open-ui-kit/core', () => ({
  Button: ({children, startIcon, variant, color, onClick, sx, loading, loadingPosition, ...props}: any) => (
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
  ),
  toast: vi.fn()
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/agentic-services/123/about'
  },
  writable: true
});

const mockUseAnalytics = vi.mocked(useAnalytics);
const mockUseDeleteAgenticService = vi.mocked(useDeleteAgenticService);
const mockUseGetAgenticService = vi.mocked(useGetAgenticService);
const mockUseParams = vi.mocked(await import('react-router-dom')).useParams;
const mockUseShallow = vi.mocked(await import('zustand/react/shallow')).useShallow;
const mockToastImport = vi.mocked(await import('@open-ui-kit/core')).toast;
const mockUseNavigate = vi.mocked(await import('react-router-dom')).useNavigate;
const mockGeneratePath = vi.mocked(await import('react-router-dom')).generatePath;

describe('InfoAgenticService', () => {
  const mockAnalyticsTrack = vi.fn();
  const mockRefetch = vi.fn();
  const mockDeleteMutate = vi.fn();
  const mockNavigate = vi.fn();

  mockUseParams.mockReturnValue({id: 'service-123'});
  mockUseNavigate.mockReturnValue(mockNavigate);

  // Mock generatePath to return the expected path
  mockGeneratePath.mockImplementation((path: string, params: any) => {
    return path.replace(':id', params.id);
  });

  const mockApp: V1Alpha1App = {
    id: 'service-123',
    name: 'Test Agentic Service',
    description: 'Test agentic service description',
    type: V1Alpha1AppType.APP_TYPE_AGENT_A2A,
    status: V1Alpha1AppStatus.APP_STATUS_ACTIVE,
    resolverMetadataId: 'did:example:123',
    apiKey: 'test-api-key',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseParams.mockReturnValue({id: 'service-123'});

    mockUseAnalytics.mockReturnValue({
      analyticsTrack: mockAnalyticsTrack,
      analyticsPage: vi.fn(),
      analyticsIdentify: vi.fn(),
      analyticsReset: vi.fn()
    });

    mockUseShallow.mockImplementation((selectorFn) => selectorFn);

    mockUseGetAgenticService.mockReturnValue({
      data: mockApp,
      isLoading: false,
      error: null,
      isError: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    mockUseDeleteAgenticService.mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
      isLoading: false,
      isSuccess: false,
      isError: false,
      status: 'idle',
      data: undefined,
      error: null,
      variables: undefined,
      failureCount: 0,
      failureReason: null,
      context: undefined
    } as unknown as import('@tanstack/react-query').UseMutationResult<any, Error, string, unknown>);

    // Reset window location
    window.location.pathname = '/agentic-services/123/about';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithClient(<InfoAgenticService />);
    expect(screen.getByTestId('base-page')).toBeInTheDocument();
  });

  it('renders with correct title', () => {
    renderWithClient(<InfoAgenticService />);
    expect(screen.getByTestId('page-title')).toHaveTextContent('Agentic Service');
  });

  it('uses correct params from URL', () => {
    renderWithClient(<InfoAgenticService />);
    expect(mockUseParams).toHaveBeenCalled();
    expect(mockUseGetAgenticService).toHaveBeenCalledWith('service-123');
  });

  it('renders breadcrumbs correctly', () => {
    renderWithClient(<InfoAgenticService />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.getAttribute('data-breadcrumbs') || '[]');

    expect(breadcrumbsData).toEqual([
      {
        text: 'Agentic Services',
        link: PATHS.agenticServices.base
      },
      {
        text: 'Test Agentic Service',
        link: undefined
      }
    ]);
  });

  it('renders breadcrumbs with fallback name when app name is not available', () => {
    mockUseGetAgenticService.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      isError: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<InfoAgenticService />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.getAttribute('data-breadcrumbs') || '[]');

    expect(breadcrumbsData[1].text).toBe('Agentic Service');
  });

  it('renders action buttons when not loading or error', () => {
    renderWithClient(<InfoAgenticService />);

    const buttons = screen.getAllByTestId('spark-button');
    expect(buttons).toHaveLength(2);

    const deleteButton = buttons.find((button) => button.textContent?.includes('Delete'));
    const editButton = buttons.find((button) => button.textContent?.includes('Edit'));

    expect(deleteButton).toBeInTheDocument();
    expect(editButton).toBeInTheDocument();
  });

  it('does not render action buttons when loading', () => {
    mockUseGetAgenticService.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      isError: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<InfoAgenticService />);

    expect(screen.queryByTestId('spark-button')).not.toBeInTheDocument();
  });

  it('does not render action buttons when error', () => {
    mockUseGetAgenticService.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Test error'),
      isError: true,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<InfoAgenticService />);

    expect(screen.queryByTestId('spark-button')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseGetAgenticService.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      isError: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<InfoAgenticService />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading Agentic Service');
  });

  it('shows error state with retry button', () => {
    const testError = new Error('Network error');
    mockUseGetAgenticService.mockReturnValue({
      data: null,
      isLoading: false,
      error: testError,
      isError: true,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<InfoAgenticService />);

    expect(screen.getByTestId('error')).toHaveTextContent('Error loading Agentic Service');
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('calls refetch when retry button is clicked', () => {
    const testError = new Error('Network error');
    mockUseGetAgenticService.mockReturnValue({
      data: null,
      isLoading: false,
      error: testError,
      isError: true,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<InfoAgenticService />);

    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('renders Outlet with correct context when data is available', () => {
    renderWithClient(<InfoAgenticService />);

    const outlet = screen.getByTestId('outlet');
    const context = JSON.parse(outlet.getAttribute('data-context') || '{}');

    expect(context).toEqual({app: mockApp});
  });

  it('tracks analytics when delete button is clicked', () => {
    renderWithClient(<InfoAgenticService />);

    const deleteButton = screen.getAllByTestId('spark-button').find((button) => button.textContent?.includes('Delete'));

    fireEvent.click(deleteButton!);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_DELETE_AGENTIC_SERVICE', {
      type: mockApp.type
    });
  });

  it('shows confirm delete modal when delete button is clicked', () => {
    renderWithClient(<InfoAgenticService />);

    const deleteButton = screen.getAllByTestId('spark-button').find((button) => button.textContent?.includes('Delete'));

    fireEvent.click(deleteButton!);

    const confirmModal = screen.getByTestId('confirm-modal');
    expect(confirmModal).toHaveAttribute('data-open', 'true');
    expect(confirmModal).toHaveAttribute('data-title', 'Delete Agentic Service');
  });

  it('tracks analytics when edit button is clicked', () => {
    renderWithClient(<InfoAgenticService />);

    const editButton = screen.getAllByTestId('spark-button').find((button) => button.textContent?.includes('Edit'));

    fireEvent.click(editButton!);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_NAVIGATION_EDIT_AGENTIC_SERVICE', {
      type: mockApp.type
    });
  });

  it('navigates to edit page when edit button is clicked', () => {
    renderWithClient(<InfoAgenticService />);

    const editButton = screen.getAllByTestId('spark-button').find((button) => button.textContent?.includes('Edit'));

    fireEvent.click(editButton!);

    // Assuming the component uses generatePath, it should call navigate with the generated path
    expect(mockNavigate).toHaveBeenCalledWith('/agentic-services/:id/edit'.replace(':id', 'service-123'));
  });

  it('closes confirm modal when cancel is clicked', () => {
    renderWithClient(<InfoAgenticService />);

    // Open modal first
    const deleteButton = screen.getAllByTestId('spark-button').find((button) => button.textContent?.includes('Delete'));
    fireEvent.click(deleteButton!);

    // Close modal
    const cancelButton = screen.getByTestId('modal-cancel-button');
    fireEvent.click(cancelButton);

    const confirmModal = screen.getByTestId('confirm-modal');
    expect(confirmModal).toHaveAttribute('data-open', 'false');
  });

  it('calls delete mutation when confirm delete is clicked', () => {
    renderWithClient(<InfoAgenticService />);

    // Open modal
    const deleteButton = screen.getAllByTestId('spark-button').find((button) => button.textContent?.includes('Delete'));
    fireEvent.click(deleteButton!);

    // Confirm delete
    const confirmButton = screen.getByTestId('modal-confirm-button');
    fireEvent.click(confirmButton);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_CONFIRM_DELETE_AGENTIC_SERVICE', {
      type: mockApp.type
    });
    expect(mockDeleteMutate).toHaveBeenCalledWith('service-123');
  });

  it('shows success toast on successful delete', async () => {
    // @ts-expect-error error
    mockUseDeleteAgenticService.mockImplementation((options: any) => {
      return {
        mutate: (id: string) => {
          // Simulate success when mutate is called
          setTimeout(() => options.callbacks?.onSuccess?.(), 0);
        },
        isPending: false
      };
    });

    renderWithClient(<InfoAgenticService />);

    // Click delete button to open modal
    const deleteButton = screen.getAllByTestId('spark-button').find((button) => button.textContent?.includes('Delete'));
    fireEvent.click(deleteButton!);

    // Confirm delete to trigger the mutation
    const confirmButton = screen.getByTestId('modal-confirm-button');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockToastImport).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Agentic service deleted successfully.',
        type: 'success'
      });
    });
  });

  it('shows error toast on delete failure', async () => {
    // @ts-expect-error error
    mockUseDeleteAgenticService.mockImplementation((options: any) => {
      return {
        mutate: (id: string) => {
          // Simulate error when mutate is called
          setTimeout(() => options.callbacks?.onError?.(), 0);
        },
        isPending: false
      };
    });

    renderWithClient(<InfoAgenticService />);

    // Click delete button to open modal
    const deleteButton = screen.getAllByTestId('spark-button').find((button) => button.textContent?.includes('Delete'));
    fireEvent.click(deleteButton!);

    // Confirm delete to trigger the mutation
    const confirmButton = screen.getByTestId('modal-confirm-button');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockToastImport).toHaveBeenCalledWith({
        title: 'Error',
        description: 'An error occurred while deleting the agentic service. Please try again.',
        type: 'error'
      });
    });
  });

  it('navigates to agentic services list on successful delete', async () => {
    // @ts-expect-error error
    mockUseDeleteAgenticService.mockImplementation((options: any) => {
      return {
        mutate: (id: string) => {
          // Simulate success when mutate is called
          setTimeout(() => options.callbacks?.onSuccess?.(), 0);
        },
        isPending: false
      };
    });

    renderWithClient(<InfoAgenticService />);

    // Click delete button to open modal
    const deleteButton = screen.getAllByTestId('spark-button').find((button) => button.textContent?.includes('Delete'));
    fireEvent.click(deleteButton!);

    // Confirm delete to trigger the mutation
    const confirmButton = screen.getByTestId('modal-confirm-button');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(PATHS.agenticServices.base, {replace: true});
    });
  });

  it('renders delete button as loading when delete is pending', () => {
    mockUseDeleteAgenticService.mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: true,
      isLoading: false,
      isSuccess: false,
      isError: false,
      status: 'pending',
      data: undefined,
      error: null,
      variables: undefined,
      failureCount: 0,
      failureReason: null,
      context: undefined
    } as unknown as import('@tanstack/react-query').UseMutationResult<any, Error, string, unknown>);

    renderWithClient(<InfoAgenticService />);

    const deleteButton = screen.getAllByTestId('spark-button').find((button) => button.textContent?.includes('Delete'));

    expect(deleteButton).toHaveAttribute('data-loading', 'true');
  });

  it('shows loading when delete mutation is pending', () => {
    mockUseDeleteAgenticService.mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: true,
      isLoading: false,
      isSuccess: false,
      isError: false,
      status: 'pending',
      data: undefined,
      error: null,
      variables: undefined,
      failureCount: 0,
      failureReason: null,
      context: undefined
    } as unknown as import('@tanstack/react-query').UseMutationResult<any, Error, string, unknown>);

    renderWithClient(<InfoAgenticService />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading Agentic Service');
  });

  it('renders badge modal with correct props', () => {
    renderWithClient(<InfoAgenticService />);

    const badgeModal = screen.getByTestId('badge-modal-form');
    expect(badgeModal).toHaveAttribute('data-open', 'false');
    expect(badgeModal).toHaveAttribute('data-app', JSON.stringify(mockApp));
    expect(badgeModal).toHaveAttribute('data-navigate-to', 'false');
    expect(badgeModal).toHaveAttribute('data-confirm-button-text', 'Re-Issue');
    expect(badgeModal).toHaveAttribute('data-title', 'Re-Issue Badge');
  });

  it('handles missing app data gracefully', () => {
    mockUseGetAgenticService.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      isError: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    renderWithClient(<InfoAgenticService />);

    const outlet = screen.getByTestId('outlet');
    const context = JSON.parse(outlet.getAttribute('data-context') || '{}');

    expect(context).toEqual({app: null});
  });
});
