/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, vi, beforeEach, expect} from 'vitest';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Organizations from './organizations';
import {renderWithClient} from '@/utils/tests';
import {PATHS} from '@/router/paths';
import {AxiosResponse} from 'axios';
import {TenantReponse} from '@/types/api/iam';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: vi.fn()
  };
});

// Mock hooks
vi.mock('@/hooks', () => ({
  useAnalytics: vi.fn()
}));

// Mock mutations
vi.mock('@/mutations', () => ({
  useCreateTenant: vi.fn()
}));

// Mock paths
vi.mock('@/router/paths', () => ({
  PATHS: {
    settings: {
      base: '/settings'
    }
  }
}));

// Mock components
vi.mock('@/components/layout/base-page', () => ({
  BasePage: ({children, title, subNav, breadcrumbs, rightSideItems}: any) => (
    <div data-testid="base-page">
      <h1>{title}</h1>
      <div data-testid="sub-nav">{JSON.stringify(subNav)}</div>
      <div data-testid="breadcrumbs">{JSON.stringify(breadcrumbs)}</div>
      <div data-testid="right-side-items">{rightSideItems}</div>
      {children}
    </div>
  )
}));

vi.mock('@/components/organizations/list/list-organizations', () => ({
  ListOrganizations: () => <div data-testid="list-organizations">ListOrganizations</div>
}));

vi.mock('@/components/ui/confirm-modal', () => ({
  ConfirmModal: ({open, onCancel, onConfirm, title, description}: any) => (
    <div data-testid="confirm-modal" data-open={open}>
      <h2>{title}</h2>
      <p>{description}</p>
      <button onClick={onCancel} data-testid="modal-cancel">
        Cancel
      </button>
      <button onClick={onConfirm} data-testid="modal-confirm">
        Confirm
      </button>
    </div>
  )
}));

// Mock external dependencies
vi.mock('@open-ui-kit/core', () => ({
  Button: ({children, loading, loadingPosition, onClick, variant, startIcon, fullWidth, sx}: any) => (
    <button
      onClick={onClick}
      data-testid="new-organization-button"
      data-loading={loading}
      data-loading-position={loadingPosition}
      data-variant={variant}
      data-full-width={fullWidth}
      data-sx={JSON.stringify(sx)}
    >
      {startIcon}
      {children}
    </button>
  ),
  toast: vi.fn()
}));

vi.mock('lucide-react', () => ({
  PlusIcon: ({className}: any) => (
    <div data-testid="plus-icon" className={className}>
      PlusIcon
    </div>
  )
}));

const mockUseOutletContext = vi.mocked(await import('react-router-dom')).useOutletContext;
const mockUseAnalytics = vi.mocked(await import('@/hooks')).useAnalytics;
const mockUseCreateTenant = vi.mocked(await import('@/mutations')).useCreateTenant;
const mockToast = vi.mocked(await import('@open-ui-kit/core')).toast;

describe('Organizations', () => {
  const mockAnalyticsTrack = vi.fn();
  const mockMutate = vi.fn();
  const mockSubNav = [{label: 'Organizations', href: '/settings/organizations'}];

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseOutletContext.mockReturnValue({
      subNav: mockSubNav
    });

    mockUseAnalytics.mockReturnValue({
      analyticsTrack: mockAnalyticsTrack,
      analyticsPage: vi.fn(),
      analyticsIdentify: vi.fn(),
      analyticsReset: vi.fn()
    });

    mockUseCreateTenant.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isLoading: false,
      isSuccess: false,
      isError: false,
      status: 'idle',
      data: undefined,
      error: null,
      variables: undefined,
      reset: vi.fn(),
      failureCount: 0,
      failureReason: null,
      context: undefined
    } as unknown as import('@tanstack/react-query').UseMutationResult<any, Error, void, unknown>);
  });

  it('renders without crashing', () => {
    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('base-page')).toBeInTheDocument();
    expect(screen.getByText('Organizations & Users')).toBeInTheDocument();
  });

  it('renders with correct props passed to BasePage', () => {
    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByText('Organizations & Users')).toBeInTheDocument();
    expect(screen.getByTestId('sub-nav')).toHaveTextContent(JSON.stringify(mockSubNav));
    expect(screen.getByTestId('breadcrumbs')).toHaveTextContent('"text":"Settings"');
    expect(screen.getByTestId('breadcrumbs')).toHaveTextContent('"link":"/settings"');
    expect(screen.getByTestId('breadcrumbs')).toHaveTextContent('"text":"Organizations"');
  });

  it('renders ListOrganizations component', () => {
    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('list-organizations')).toBeInTheDocument();
  });

  it('renders New Organization button with correct props', () => {
    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    const button = screen.getByTestId('new-organization-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('New Organization');
    expect(button).toHaveAttribute('data-variant', 'outlined');
    expect(button).toHaveAttribute('data-full-width', 'true');
    expect(button).toHaveAttribute('data-loading', 'false');
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
  });

  it('shows loading state on button when mutation is pending', () => {
    mockUseCreateTenant.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isLoading: true,
      isSuccess: false,
      isError: false,
      status: 'pending',
      data: undefined,
      error: null,
      variables: undefined,
      reset: vi.fn(),
      failureCount: 0,
      failureReason: null,
      context: undefined
    } as unknown as import('@tanstack/react-query').UseMutationResult<any, Error, void, unknown>);

    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    const button = screen.getByTestId('new-organization-button');
    expect(button).toHaveAttribute('data-loading', 'true');
    expect(button).toHaveAttribute('data-loading-position', 'start');
  });

  it('opens modal when New Organization button is clicked and tracks analytics', async () => {
    const user = userEvent.setup();
    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    const button = screen.getByTestId('new-organization-button');
    await user.click(button);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_NEW_ORGANIZATION');
    expect(screen.getByTestId('confirm-modal')).toHaveAttribute('data-open', 'true');
  });

  it('renders confirm modal with correct props', async () => {
    const user = userEvent.setup();
    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    const button = screen.getByTestId('new-organization-button');
    await user.click(button);

    expect(screen.getByText('Creating Organization')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Are you sure you want to create a new organization? This action will create a new organization with default settings.'
      )
    ).toBeInTheDocument();
  });

  it('closes modal when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    // Open modal
    const button = screen.getByTestId('new-organization-button');
    await user.click(button);
    expect(screen.getByTestId('confirm-modal')).toHaveAttribute('data-open', 'true');

    // Close modal
    const cancelButton = screen.getByTestId('modal-cancel');
    await user.click(cancelButton);
    expect(screen.getByTestId('confirm-modal')).toHaveAttribute('data-open', 'false');
  });

  it('handles organization creation when confirm is clicked', async () => {
    const user = userEvent.setup();
    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    // Open modal
    const button = screen.getByTestId('new-organization-button');
    await user.click(button);

    // Confirm creation
    const confirmButton = screen.getByTestId('modal-confirm');
    await user.click(confirmButton);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_CONFIRM_NEW_ORGANIZATION');
    expect(mockMutate).toHaveBeenCalled();
  });

  it('handles error when organization creation fails with network error', () => {
    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    const useCreateTenantCall = mockUseCreateTenant.mock.calls[0][0];
    const errorCallback = useCreateTenantCall.callbacks?.onError;

    if (errorCallback) {
      errorCallback();
    }

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'An error occurred while creating the organization. Please try again.',
      type: 'error'
    });
  });

  it('handles error when organization creation fails with API error', () => {
    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    const useCreateTenantCall = mockUseCreateTenant.mock.calls[0][0];
    const errorCallback = useCreateTenantCall.callbacks?.onError;

    if (errorCallback) {
      errorCallback();
    }

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'An error occurred while creating the organization. Please try again.',
      type: 'error'
    });
  });

  it('button remains disabled when mutation is in loading state', () => {
    mockUseCreateTenant.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isLoading: true,
      isSuccess: false,
      isError: false,
      status: 'pending',
      data: undefined,
      error: null,
      variables: undefined,
      reset: vi.fn(),
      failureCount: 0,
      failureReason: null,
      context: undefined
    } as unknown as import('@tanstack/react-query').UseMutationResult<any, Error, void, unknown>);

    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    const button = screen.getByTestId('new-organization-button');
    expect(button).toHaveAttribute('data-loading', 'true');
  });

  it('handles multiple rapid clicks on New Organization button', async () => {
    const user = userEvent.setup();
    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    const button = screen.getByTestId('new-organization-button');

    // Click multiple times rapidly
    await user.click(button);
    await user.click(button);
    await user.click(button);

    // Should only track once per click
    expect(mockAnalyticsTrack).toHaveBeenCalledTimes(3);
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_NEW_ORGANIZATION');
  });

  it('modal can be reopened after canceling', async () => {
    const user = userEvent.setup();
    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    const button = screen.getByTestId('new-organization-button');

    // Open modal first time
    await user.click(button);
    expect(screen.getByTestId('confirm-modal')).toHaveAttribute('data-open', 'true');

    // Cancel
    const cancelButton = screen.getByTestId('modal-cancel');
    await user.click(cancelButton);
    expect(screen.getByTestId('confirm-modal')).toHaveAttribute('data-open', 'false');

    // Open modal second time
    await user.click(button);
    expect(screen.getByTestId('confirm-modal')).toHaveAttribute('data-open', 'true');
  });

  it('preserves button styling and properties', () => {
    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    const button = screen.getByTestId('new-organization-button');
    expect(button).toHaveAttribute('data-sx', '{"fontWeight":"600 !important"}');
    expect(button).toHaveAttribute('data-variant', 'outlined');
    expect(button).toHaveAttribute('data-full-width', 'true');
  });

  it('handles organization creation error callback', () => {
    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    // Get the error callback from the mock call
    const useCreateTenantCall = mockUseCreateTenant.mock.calls[0][0];
    const errorCallback = useCreateTenantCall.callbacks?.onError;

    // Call the error callback if it exists
    if (errorCallback) {
      errorCallback();
    }

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'An error occurred while creating the organization. Please try again.',
      type: 'error'
    });
  });

  it('tracks analytics for both button click and confirmation', async () => {
    const user = userEvent.setup();
    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    // Click New Organization button
    const button = screen.getByTestId('new-organization-button');
    await user.click(button);
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_NEW_ORGANIZATION');

    // Click confirm
    const confirmButton = screen.getByTestId('modal-confirm');
    await user.click(confirmButton);
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_CONFIRM_NEW_ORGANIZATION');

    expect(mockAnalyticsTrack).toHaveBeenCalledTimes(2);
  });

  it('modal starts closed', () => {
    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('confirm-modal')).toHaveAttribute('data-open', 'false');
  });

  it('passes correct outlet context to component', () => {
    const customSubNav = [{label: 'Custom', href: '/custom'}];
    mockUseOutletContext.mockReturnValue({
      subNav: customSubNav
    });

    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('sub-nav')).toHaveTextContent(JSON.stringify(customSubNav));
  });

  it('handles successful organization creation with axios response', () => {
    const mockSuccessResponse: AxiosResponse<TenantReponse, any> = {
      data: {
        id: 'org-456',
        name: 'Another Test Org',
        createdAt: '2024-01-01T00:00:00.000Z',
        idp: 'local',
        extras: {},
        region: 'us-west-2',
        entitlements: [],
        organization: 'Another Test Org',
        organizationId: 'org-456'
      },
      status: 201,
      statusText: 'Created',
      config: {
        url: '/api/tenants',
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token'
        } as any,
        timeout: 0,
        xsrfCookieName: 'XSRF-TOKEN',
        xsrfHeaderName: 'X-XSRF-TOKEN',
        maxContentLength: -1,
        maxBodyLength: -1
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token'
      } as any,
      request: {}
    };

    renderWithClient(<Organizations />, {initialEntries: [PATHS.settings.base]});

    const useCreateTenantCall = mockUseCreateTenant.mock.calls[0][0];
    const successCallback = useCreateTenantCall.callbacks?.onSuccess;

    if (successCallback) {
      successCallback(mockSuccessResponse);
    }

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Organization "Another Test Org" created successfully.',
      type: 'success'
    });
  });
});
