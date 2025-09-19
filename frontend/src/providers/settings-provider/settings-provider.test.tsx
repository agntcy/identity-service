/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, vi, beforeEach, expect} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import SettingsProvider from './settings-provider';
import {IdpType} from '@/types/api/settings';
import React from 'react';

// Mock the config
vi.mock('@/config', () => ({
  default: {
    MULTI_TENANT: true,
    IAM_UI: 'https://iam.example.com',
    IAM_OIDC_ISSUER: 'https://issuer.example.com',
    IAM_OIDC_CLIENT_ID: 'client-id'
  }
}));

// Mock the isMultiTenant function
vi.mock('@/utils/get-auth-config', () => ({
  isMultiTenant: vi.fn(() => true)
}));

// Mock the auth hooks
vi.mock('@/hooks', () => ({
  useAuth: vi.fn(() => ({
    authInfo: {
      user: {
        tenant: {
          name: 'Test Organization'
        }
      }
    }
  }))
}));

// Mock the queries
vi.mock('@/queries', () => ({
  useGetSession: vi.fn(),
  useGetSettings: vi.fn()
}));

// Mock the store
vi.mock('@/store', () => ({
  useSettingsStore: vi.fn()
}));

// Mock zustand shallow
vi.mock('zustand/react/shallow', () => ({
  useShallow: vi.fn((fn) => fn)
}));

// Mock toast
vi.mock('@open-ui-kit/core', () => ({
  toast: vi.fn()
}));

// Mock Loading component
vi.mock('@/components/ui/loading', () => ({
  Loading: () => <div data-testid="loading">Loading...</div>
}));

const mockUseGetSession = vi.mocked(await import('@/queries')).useGetSession;
const mockUseGetSettings = vi.mocked(await import('@/queries')).useGetSettings;
const mockUseSettingsStore = vi.mocked(await import('@/store')).useSettingsStore;
const mockToast = vi.mocked(await import('@open-ui-kit/core')).toast;
const mockUseShallow = vi.mocked(await import('zustand/react/shallow')).useShallow;
const mockIsMultiTenant = vi.mocked(await import('@/utils/get-auth-config')).isMultiTenant;

// Test wrapper component
const TestWrapper = ({children}: {children: React.ReactNode}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('SettingsProvider', () => {
  const mockStoreFunctions = {
    setIsEmptyIdp: vi.fn(),
    setSession: vi.fn(),
    setIsAdmin: vi.fn()
  };

  const mockSessionData = {
    groups: [{role: 'USER'}],
    userId: 'user123',
    username: 'testuser'
  };

  const mockSettingsData = {
    issuerSettings: {
      idpType: IdpType.IDP_TYPE_DUO
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset isMultiTenant to default true
    mockIsMultiTenant.mockReturnValue(true);

    mockUseSettingsStore.mockReturnValue(mockStoreFunctions);

    // Default mock implementations
    mockUseGetSession.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    mockUseGetSettings.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);
  });

  it('renders loading component when settings are loading', () => {
    mockUseGetSettings.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: true,
      error: null,
      isSuccess: false,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div data-testid="children">Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('children')).not.toBeInTheDocument();
  });

  it('renders loading component when session is loading in multi-tenant mode', () => {
    mockUseGetSession.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: true,
      error: null,
      isSuccess: false,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div data-testid="children">Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('children')).not.toBeInTheDocument();
  });

  it('does not render loading for session in OIDC mode', () => {
    mockIsMultiTenant.mockReturnValue(false);

    mockUseGetSession.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: true,
      error: null,
      isSuccess: false,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div data-testid="children">Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    // Should not show loading since session loading is ignored in OIDC mode
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  it('renders loading component when both are loading in multi-tenant mode', () => {
    mockUseGetSession.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: true,
      error: null,
      isSuccess: false,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    mockUseGetSettings.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: true,
      error: null,
      isSuccess: false,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div data-testid="children">Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('children')).not.toBeInTheDocument();
  });

  it('renders children when both queries are loaded in multi-tenant mode', () => {
    mockUseGetSession.mockReturnValue({
      data: mockSessionData,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    mockUseGetSettings.mockReturnValue({
      data: mockSettingsData,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div data-testid="children">Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  it('renders children when settings loaded in OIDC mode', () => {
    mockIsMultiTenant.mockReturnValue(false);

    mockUseGetSettings.mockReturnValue({
      data: mockSettingsData,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div data-testid="children">Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  it('shows error toast when settings fetch fails', async () => {
    mockUseGetSettings.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      error: new Error('Settings fetch failed'),
      isSuccess: false,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div>Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error fetching identity provider settings',
        description: 'There was an error fetching the identity provider settings. Please try again later.',
        type: 'error'
      });
    });
  });

  it('shows error toast when session fetch fails in multi-tenant mode', async () => {
    mockUseGetSession.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      error: new Error('Session fetch failed'),
      isSuccess: false,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div>Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error fetching session',
        description: 'There was an error fetching the session. Please try again later.',
        type: 'error'
      });
    });
  });

  it('does not show session error toast in OIDC mode', async () => {
    mockIsMultiTenant.mockReturnValue(false);

    mockUseGetSession.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      error: new Error('Session fetch failed'),
      isSuccess: false,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div>Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockToast).not.toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error fetching session'
        })
      );
    });
  });

  it('detects admin role correctly in multi-tenant mode', async () => {
    const adminSessionData = {
      groups: [{role: 'ADMIN'}],
      userId: 'admin123',
      username: 'admin'
    };

    mockUseGetSession.mockReturnValue({
      data: adminSessionData,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    mockUseGetSettings.mockReturnValue({
      data: mockSettingsData,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div>Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockStoreFunctions.setSession).toHaveBeenCalledWith(adminSessionData);
      expect(mockStoreFunctions.setIsAdmin).toHaveBeenCalledWith(true);
    });
  });

  it('mocks admin status in OIDC mode', async () => {
    mockIsMultiTenant.mockReturnValue(false);

    mockUseGetSettings.mockReturnValue({
      data: mockSettingsData,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div>Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockStoreFunctions.setIsAdmin).toHaveBeenCalledWith(true);
      // Update the expected mock session structure to match what's actually being created
      expect(mockStoreFunctions.setSession).toHaveBeenCalledWith({
        groups: [
          {
            role: 'ADMIN',
            group: {
              id: 'mock-group-id',
              name: 'mock-group-name'
            },
            productRoles: []
          }
        ],
        username: 'username'
      });
    });
  });

  it('detects non-admin role correctly', async () => {
    mockUseGetSession.mockReturnValue({
      data: mockSessionData,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    mockUseGetSettings.mockReturnValue({
      data: mockSettingsData,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div>Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockStoreFunctions.setSession).toHaveBeenCalledWith(mockSessionData);
      expect(mockStoreFunctions.setIsAdmin).toHaveBeenCalledWith(false);
    });
  });

  it('handles empty session groups array', async () => {
    const emptyGroupsSessionData = {
      groups: [],
      userId: 'user123',
      username: 'testuser'
    };

    mockUseGetSession.mockReturnValue({
      data: emptyGroupsSessionData,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    mockUseGetSettings.mockReturnValue({
      data: mockSettingsData,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div>Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockStoreFunctions.setIsAdmin).toHaveBeenCalledWith(false);
    });
  });

  it('detects empty IDP when issuerSettings is null', async () => {
    const emptySettingsData = {
      issuerSettings: null
    };

    mockUseGetSettings.mockReturnValue({
      data: emptySettingsData,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div>Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockStoreFunctions.setIsEmptyIdp).toHaveBeenCalledWith(true);
    });
  });

  it('detects empty IDP when idpType is UNSPECIFIED', async () => {
    const unspecifiedSettingsData = {
      issuerSettings: {
        idpType: IdpType.IDP_TYPE_UNSPECIFIED
      }
    };

    mockUseGetSettings.mockReturnValue({
      data: unspecifiedSettingsData,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div>Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockStoreFunctions.setIsEmptyIdp).toHaveBeenCalledWith(true);
    });
  });

  it('detects non-empty IDP when valid settings exist', async () => {
    mockUseGetSettings.mockReturnValue({
      data: mockSettingsData,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div>Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockStoreFunctions.setIsEmptyIdp).toHaveBeenCalledWith(false);
    });
  });

  it('calls store functions with correct parameters', async () => {
    mockUseGetSession.mockReturnValue({
      data: mockSessionData,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    mockUseGetSettings.mockReturnValue({
      data: mockSettingsData,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div>Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockStoreFunctions.setSession).toHaveBeenCalledWith(mockSessionData);
      expect(mockStoreFunctions.setIsAdmin).toHaveBeenCalledWith(false);
      expect(mockStoreFunctions.setIsEmptyIdp).toHaveBeenCalledWith(false);
    });
  });

  it('handles undefined session data gracefully in multi-tenant mode', () => {
    mockUseGetSession.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    mockUseGetSettings.mockReturnValue({
      data: mockSettingsData,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div data-testid="children">Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  it('handles undefined settings data gracefully', () => {
    mockUseGetSession.mockReturnValue({
      data: mockSessionData,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    mockUseGetSettings.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    render(
      <TestWrapper>
        <SettingsProvider>
          <div data-testid="children">Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    expect(screen.getByTestId('children')).toBeInTheDocument();
    expect(mockStoreFunctions.setIsEmptyIdp).toHaveBeenCalledWith(true);
  });

  it('calls useShallow with correct selector function', () => {
    render(
      <TestWrapper>
        <SettingsProvider>
          <div>Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    expect(mockUseShallow).toHaveBeenCalledWith(expect.any(Function));
    expect(mockUseSettingsStore).toHaveBeenCalledWith(expect.any(Function));
  });

  it('updates store when session data changes', async () => {
    const {rerender} = render(
      <TestWrapper>
        <SettingsProvider>
          <div>Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    mockUseGetSession.mockReturnValue({
      data: mockSessionData,
      isError: false,
      isLoading: false,
      error: null,
      isSuccess: true,
      isStale: false,
      refetch: vi.fn()
    } as unknown as import('@tanstack/react-query').UseQueryResult<any, Error>);

    rerender(
      <TestWrapper>
        <SettingsProvider>
          <div>Content</div>
        </SettingsProvider>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockStoreFunctions.setSession).toHaveBeenCalledWith(mockSessionData);
    });
  });
});
