/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import {describe, it, vi, beforeEach, expect} from 'vitest';
import {screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import EditOrganization from './edit-organization';
import {renderWithClient} from '@/utils/tests';
import {PATHS} from '@/router/paths';
import {TenantReponse} from '@/types/api/iam';

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
  useGetTenant: vi.fn()
}));

// Mock paths
vi.mock('@/router/paths', () => ({
  PATHS: {
    settings: {
      base: '/settings',
      organizationsAndUsers: {
        base: '/settings/organizations',
        info: '/settings/organizations/:id'
      }
    }
  }
}));

// Mock components
vi.mock('@/components/layout/base-page', () => ({
  BasePage: ({children, title, breadcrumbs, useBorder}: any) => (
    <div data-testid="base-page">
      <h1>{title}</h1>
      <div data-testid="breadcrumbs">{JSON.stringify(breadcrumbs)}</div>
      <div data-testid="use-border">{useBorder?.toString()}</div>
      {children}
    </div>
  )
}));

vi.mock('@/components/organizations/edit/edit-organization-form', () => ({
  EditOrganizationForm: ({tenant}: any) => (
    <div data-testid="edit-organization-form">
      <div data-testid="tenant-data">{JSON.stringify(tenant)}</div>
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

const mockUseParams = vi.mocked(await import('react-router-dom')).useParams;
const mockGeneratePath = vi.mocked(await import('react-router-dom')).generatePath;
const mockUseGetTenant = vi.mocked(await import('@/queries')).useGetTenant;

describe('EditOrganization', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseParams.mockReturnValue({
      id: 'tenant-123'
    });

    mockGeneratePath.mockReturnValue('/settings/organizations/tenant-123');

    mockUseGetTenant.mockReturnValue({
      data: mockTenantData,
      isLoading: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<TenantReponse, Error>);
  });

  it('renders without crashing', () => {
    renderWithClient(<EditOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('base-page')).toBeInTheDocument();
    expect(screen.getByText('Edit Organization')).toBeInTheDocument();
  });

  it('renders with correct props passed to BasePage', () => {
    renderWithClient(<EditOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByText('Edit Organization')).toBeInTheDocument();
    expect(screen.getByTestId('use-border')).toHaveTextContent('true');

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs).toHaveTextContent('"text":"Settings"');
    expect(breadcrumbs).toHaveTextContent('"link":"/settings"');
    expect(breadcrumbs).toHaveTextContent('"text":"Organizations & Users"');
    expect(breadcrumbs).toHaveTextContent('"text":"Test Organization"');
    expect(breadcrumbs).toHaveTextContent('"text":"Edit"');
  });

  it('uses organization name in breadcrumbs when data is available', () => {
    renderWithClient(<EditOrganization />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs).toHaveTextContent('"text":"Test Organization"');
    expect(breadcrumbs).toHaveTextContent('"/settings/organizations/tenant-123"');
  });

  it('uses fallback name in breadcrumbs when organization name is not available', () => {
    mockUseGetTenant.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<TenantReponse, Error>);

    renderWithClient(<EditOrganization />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs).toHaveTextContent('"text":"Organization"');
  });

  it('passes correct props to ConditionalQueryRenderer', () => {
    renderWithClient(<EditOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('item-name')).toHaveTextContent('Organization');
    expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(mockTenantData));
    expect(screen.getByTestId('error')).toHaveTextContent('null');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('use-relative-loader')).toHaveTextContent('true');
  });

  it('renders EditOrganizationForm when data is available', () => {
    renderWithClient(<EditOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('edit-organization-form')).toBeInTheDocument();
    expect(screen.getByTestId('tenant-data')).toHaveTextContent(JSON.stringify(mockTenantData));
  });

  it('handles loading state', () => {
    mockUseGetTenant.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<TenantReponse, Error>);

    renderWithClient(<EditOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
    expect(screen.queryByTestId('edit-organization-form')).not.toBeInTheDocument();
  });

  it('handles error state', () => {
    const mockError = new Error('Failed to fetch organization');

    mockUseGetTenant.mockReturnValue({
      data: null,
      isLoading: false,
      error: mockError,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<TenantReponse, Error>);

    renderWithClient(<EditOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('error')).toHaveTextContent(JSON.stringify(mockError));
    expect(screen.queryByTestId('edit-organization-form')).not.toBeInTheDocument();
  });

  it('provides refetch callback in errorListStateProps', () => {
    renderWithClient(<EditOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('error-list-state-props-has-callback')).toHaveTextContent('true');
  });

  it('calls refetch when error action callback is invoked', () => {
    const mockError = new Error('Failed to fetch organization');

    mockUseGetTenant.mockReturnValue({
      data: null,
      isLoading: false,
      error: mockError,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<TenantReponse, Error>);

    renderWithClient(<EditOrganization />, {initialEntries: [PATHS.settings.base]});

    // Click the retry button to trigger the callback
    const retryButton = screen.getByTestId('error-action-callback');
    retryButton.click();

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('calls useGetTenant with correct tenant id', () => {
    renderWithClient(<EditOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(mockUseGetTenant).toHaveBeenCalledWith('tenant-123');
  });

  it('calls generatePath with correct parameters', () => {
    renderWithClient(<EditOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(mockGeneratePath).toHaveBeenCalledWith(PATHS.settings.organizationsAndUsers.info, {id: 'tenant-123'});
  });

  it('handles different tenant ID from params', () => {
    mockUseParams.mockReturnValue({
      id: 'different-tenant-456'
    });

    mockGeneratePath.mockReturnValue('/settings/organizations/different-tenant-456');

    renderWithClient(<EditOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(mockUseGetTenant).toHaveBeenCalledWith('different-tenant-456');
    expect(mockGeneratePath).toHaveBeenCalledWith(PATHS.settings.organizationsAndUsers.info, {id: 'different-tenant-456'});
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
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<TenantReponse, Error>);

    renderWithClient(<EditOrganization />, {initialEntries: [PATHS.settings.base]});

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
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<TenantReponse, Error>);

    renderWithClient(<EditOrganization />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs).toHaveTextContent('"text":"Organization"');
  });

  it('maintains consistent breadcrumb structure', () => {
    renderWithClient(<EditOrganization />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbsText = screen.getByTestId('breadcrumbs').textContent;
    const breadcrumbs = JSON.parse(breadcrumbsText || '[]');

    expect(breadcrumbs).toHaveLength(4);
    expect(breadcrumbs[0]).toEqual({
      text: 'Settings',
      link: '/settings'
    });
    expect(breadcrumbs[1]).toEqual({
      text: 'Organizations & Users',
      link: '/settings/organizations'
    });
    expect(breadcrumbs[2]).toEqual({
      text: 'Test Organization',
      link: '/settings/organizations/tenant-123'
    });
    expect(breadcrumbs[3]).toEqual({
      text: 'Edit'
    });
  });

  it('passes all required props to ConditionalQueryRenderer', () => {
    renderWithClient(<EditOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('conditional-query-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('item-name')).toBeInTheDocument();
    expect(screen.getByTestId('data')).toBeInTheDocument();
    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(screen.getByTestId('is-loading')).toBeInTheDocument();
    expect(screen.getByTestId('use-relative-loader')).toBeInTheDocument();
    expect(screen.getByTestId('error-list-state-props-has-callback')).toBeInTheDocument();
  });

  it('does not render EditOrganizationForm when data is null', () => {
    mockUseGetTenant.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<TenantReponse, Error>);

    renderWithClient(<EditOrganization />, {initialEntries: [PATHS.settings.base]});

    expect(screen.queryByTestId('edit-organization-form')).not.toBeInTheDocument();
  });
});
