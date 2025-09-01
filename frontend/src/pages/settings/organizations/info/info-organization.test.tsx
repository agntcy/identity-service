/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import {describe, it, vi, beforeEach, expect} from 'vitest';
import {screen, fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom';
import InfoOrganization from './info-organization';
import {renderWithClient} from '@/utils/tests';
import {PATHS} from '@/router/paths';
import {TenantReponse} from '@/types/api/iam';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn()
  };
});

// Mock queries
vi.mock('@/queries', () => ({
  useGetTenant: vi.fn()
}));

// Mock hooks
vi.mock('@/hooks', () => ({
  useAnalytics: vi.fn()
}));

// Mock paths
vi.mock('@/router/paths', () => ({
  PATHS: {
    settings: {
      base: '/settings',
      organizationsAndUsers: {
        base: '/settings/organizations'
      }
    }
  }
}));

// Mock components
vi.mock('@/components/layout/base-page', () => ({
  BasePage: ({children, title, breadcrumbs, rightSideItems}: any) => (
    <div data-testid="base-page">
      <h1>{title}</h1>
      <div data-testid="breadcrumbs">{JSON.stringify(breadcrumbs)}</div>
      <div data-testid="right-side-items">{rightSideItems}</div>
      {children}
    </div>
  )
}));

vi.mock('@/components/organizations/info/organization-info', () => ({
  OrganizationInfo: ({tenant, showInviteUserModal, onChangeInviteUser}: any) => (
    <div data-testid="organization-info">
      <div data-testid="tenant-data">{JSON.stringify(tenant)}</div>
      <div data-testid="show-invite-user-modal">{showInviteUserModal?.toString()}</div>
      <button data-testid="change-invite-user" onClick={() => onChangeInviteUser?.(!showInviteUserModal)}>
        Toggle Modal
      </button>
    </div>
  )
}));

vi.mock('@/components/ui/conditional-query-renderer', () => ({
  ConditionalQueryRenderer: ({children, itemName, data, error, isLoading, useRelativeLoader, errorListStateProps}: any) => (
    <div data-testid="conditional-query-renderer">
      <div data-testid="item-name">{itemName}</div>
      <div data-testid="data">{JSON.stringify(data)}</div>
      <div data-testid="error">{JSON.stringify(error)}</div>
      <div data-testid="is-loading">{isLoading?.toString()}</div>
      <div data-testid="use-relative-loader">{useRelativeLoader?.toString()}</div>
      <div data-testid="error-list-state-props-has-callback">{(!!errorListStateProps?.actionCallback).toString()}</div>
      <button data-testid="error-action-callback" onClick={() => errorListStateProps?.actionCallback?.()}>
        Retry
      </button>
      {data && children}
    </div>
  )
}));

vi.mock('@outshift/spark-design', () => ({
  Button: ({children, variant, onClick, sx, endIcon, ...props}: any) => (
    <button
      data-testid="invite-user-button"
      data-variant={variant}
      data-sx={JSON.stringify(sx)}
      onClick={onClick}
      {...props}
    >
      {children}
      <span data-testid="button-end-icon">{endIcon}</span>
    </button>
  )
}));

vi.mock('lucide-react', () => ({
  PlusIcon: ({className}: any) => (
    <span data-testid="plus-icon" className={className}>
      +
    </span>
  )
}));

const mockUseParams = vi.mocked(await import('react-router-dom')).useParams;
const mockUseGetTenant = vi.mocked(await import('@/queries')).useGetTenant;
const mockUseAnalytics = vi.mocked(await import('@/hooks')).useAnalytics;

describe('InfoOrganization', () => {
  const mockTenantData = {
    id: 'tenant-123',
    name: 'Test Organization',
    createdAt: '2024-01-01T00:00:00.000Z',
    idp: 'local',
    extras: {},
    region: 'us-west-2',
    entitlements: [],
    organization: 'Test Organization',
    organizationId: 'tenant-123'
  };

  const mockRefetch = vi.fn();
  const mockAnalyticsTrack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseParams.mockReturnValue({
      id: 'tenant-123'
    });

    mockUseGetTenant.mockReturnValue({
      data: mockTenantData,
      isLoading: false,
      error: null,
      isError: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<TenantReponse, Error>);

    mockUseAnalytics.mockReturnValue({
      analyticsTrack: mockAnalyticsTrack,
      analyticsPage: vi.fn()
    });
  });

  it('renders without crashing', () => {
    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('base-page')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('renders with correct props passed to BasePage', () => {
    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByText('Users')).toBeInTheDocument();

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs).toHaveTextContent('"text":"Settings"');
    expect(breadcrumbs).toHaveTextContent('"link":"/settings"');
    expect(breadcrumbs).toHaveTextContent('"text":"Organizations & Users"');
    expect(breadcrumbs).toHaveTextContent('"text":"Test Organization"');
  });

  it('uses organization name in breadcrumbs when data is available', () => {
    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs).toHaveTextContent('"text":"Test Organization"');
  });

  it('uses fallback name in breadcrumbs when organization name is not available', () => {
    mockUseGetTenant.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      isError: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<TenantReponse, Error>);

    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs).toHaveTextContent('"text":"Organization"');
  });

  it('renders invite user button when not loading and no error', () => {
    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    const inviteButton = screen.getByTestId('invite-user-button');
    expect(inviteButton).toBeInTheDocument();
    expect(inviteButton).toHaveAttribute('data-variant', 'outlined');
    expect(inviteButton).toHaveTextContent('Invite User');
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
  });

  it('does not render invite user button when loading', () => {
    mockUseGetTenant.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      isError: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<TenantReponse, Error>);

    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.queryByTestId('invite-user-button')).not.toBeInTheDocument();
  });

  it('does not render invite user button when there is an error', () => {
    mockUseGetTenant.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch'),
      isError: true,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<TenantReponse, Error>);

    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.queryByTestId('invite-user-button')).not.toBeInTheDocument();
  });

  it('tracks analytics and opens modal when invite user button is clicked', () => {
    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    const inviteButton = screen.getByTestId('invite-user-button');
    fireEvent.click(inviteButton);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_INVITE_USER');
    expect(screen.getByTestId('show-invite-user-modal')).toHaveTextContent('true');
  });

  it('passes correct props to ConditionalQueryRenderer', () => {
    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('item-name')).toHaveTextContent('Organization');
    expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(mockTenantData));
    expect(screen.getByTestId('error')).toHaveTextContent('null');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('use-relative-loader')).toHaveTextContent('true');
  });

  it('renders OrganizationInfo when data is available', () => {
    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('organization-info')).toBeInTheDocument();
    expect(screen.getByTestId('tenant-data')).toHaveTextContent(JSON.stringify(mockTenantData));
    expect(screen.getByTestId('show-invite-user-modal')).toHaveTextContent('false');
  });

  it('handles invite user modal state changes', () => {
    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    // Initially modal should be closed
    expect(screen.getByTestId('show-invite-user-modal')).toHaveTextContent('false');

    // Open modal via button click
    const inviteButton = screen.getByTestId('invite-user-button');
    fireEvent.click(inviteButton);
    expect(screen.getByTestId('show-invite-user-modal')).toHaveTextContent('true');

    // Close modal via OrganizationInfo callback
    const toggleButton = screen.getByTestId('change-invite-user');
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('show-invite-user-modal')).toHaveTextContent('false');
  });

  it('handles loading state', () => {
    mockUseGetTenant.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      isError: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<TenantReponse, Error>);

    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
    expect(screen.queryByTestId('organization-info')).not.toBeInTheDocument();
  });

  it('handles error state', () => {
    const mockError = new Error('Failed to fetch organization');

    mockUseGetTenant.mockReturnValue({
      data: null,
      isLoading: false,
      error: mockError,
      isError: true,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<TenantReponse, Error>);

    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('error')).toHaveTextContent(JSON.stringify(mockError));
    expect(screen.queryByTestId('organization-info')).not.toBeInTheDocument();
  });

  it('provides refetch callback in errorListStateProps', () => {
    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('error-list-state-props-has-callback')).toHaveTextContent('true');
  });

  it('calls refetch when error action callback is invoked', () => {
    const mockError = new Error('Failed to fetch organization');

    mockUseGetTenant.mockReturnValue({
      data: null,
      isLoading: false,
      error: mockError,
      isError: true,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<TenantReponse, Error>);

    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    const retryButton = screen.getByTestId('error-action-callback');
    fireEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('calls useGetTenant with correct tenant id', () => {
    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(mockUseGetTenant).toHaveBeenCalledWith('tenant-123');
  });

  it('handles different tenant ID from params', () => {
    mockUseParams.mockReturnValue({
      id: 'different-tenant-456'
    });

    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(mockUseGetTenant).toHaveBeenCalledWith('different-tenant-456');
  });

  it('renders correctly when tenant data has no name', () => {
    const tenantWithoutName = {
      ...mockTenantData,
      name: undefined
    };

    mockUseGetTenant.mockReturnValue({
      data: tenantWithoutName,
      isLoading: false,
      error: null,
      isError: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<TenantReponse, Error>);

    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs).toHaveTextContent('"text":"Organization"');
  });

  it('handles empty tenant name in breadcrumbs', () => {
    const tenantWithEmptyName = {
      ...mockTenantData,
      name: ''
    };

    mockUseGetTenant.mockReturnValue({
      data: tenantWithEmptyName,
      isLoading: false,
      error: null,
      isError: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<TenantReponse, Error>);

    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs).toHaveTextContent('"text":"Organization"');
  });

  it('maintains consistent breadcrumb structure', () => {
    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbsText = screen.getByTestId('breadcrumbs').textContent;
    const breadcrumbs = JSON.parse(breadcrumbsText || '[]');

    expect(breadcrumbs).toHaveLength(3);
    expect(breadcrumbs[0]).toEqual({
      text: 'Settings',
      link: '/settings'
    });
    expect(breadcrumbs[1]).toEqual({
      text: 'Organizations & Users',
      link: '/settings/organizations'
    });
    expect(breadcrumbs[2]).toEqual({
      text: 'Test Organization'
    });
  });

  it('passes all required props to ConditionalQueryRenderer', () => {
    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('conditional-query-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('item-name')).toBeInTheDocument();
    expect(screen.getByTestId('data')).toBeInTheDocument();
    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(screen.getByTestId('is-loading')).toBeInTheDocument();
    expect(screen.getByTestId('use-relative-loader')).toBeInTheDocument();
    expect(screen.getByTestId('error-list-state-props-has-callback')).toBeInTheDocument();
  });

  it('does not render OrganizationInfo when data is null', () => {
    mockUseGetTenant.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      isError: false,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<TenantReponse, Error>);

    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.queryByTestId('organization-info')).not.toBeInTheDocument();
  });

  it('applies correct styling to invite user button', () => {
    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    const inviteButton = screen.getByTestId('invite-user-button');
    expect(inviteButton).toHaveAttribute('data-sx', '{"fontWeight":"600 !important"}');
  });

  it('renders plus icon with correct className in button', () => {
    renderWithClient(<InfoOrganization />, {initialEntries: [PATHS.settings.base]});

    const plusIcon = screen.getByTestId('plus-icon');
    expect(plusIcon).toHaveClass('w-4', 'h-4');
  });
});
