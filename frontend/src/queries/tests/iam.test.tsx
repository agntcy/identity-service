/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, expect, vi, beforeEach} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {useGetTenants, useGetSession, useGetTenant, useGetUsersGroup, useGetGroupsTenant} from '../iam';
import {IamAPI} from '@/api/services';
import type {AxiosResponse} from 'axios';
import {
  GetGroupsTenantResponse,
  GetSessionResponse,
  GetTenantsResponse,
  GetUsersGroupsResponse,
  TenantReponse
} from '@/types/api/iam';

// Mock the IamAPI
vi.mock('@/api/services', () => ({
  IamAPI: {
    getTenants: vi.fn(),
    getSession: vi.fn(),
    getTenant: vi.fn(),
    getUsersGroups: vi.fn(),
    getGroupsTenant: vi.fn()
  }
}));

// Mock isMultiTenant utility
vi.mock('@/utils/auth', () => ({
  isMultiTenant: vi.fn(() => true) // Enable multi-tenant mode for tests
}));

const mockedIamAPI = vi.mocked(IamAPI);

// Helper to create a mock Axios response
function createMockAxiosResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any
  };
}

// Helper to create a test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

  // eslint-disable-next-line react/display-name
  return ({children}: {children: React.ReactNode}) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('IAM Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useGetTenants', () => {
    it('fetches tenants successfully', async () => {
      const mockData: GetTenantsResponse = {
        tenants: [
          {
            id: 'tenant-1',
            name: 'Test Tenant'
          } as TenantReponse
        ]
      };
      mockedIamAPI.getTenants.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetTenants(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedIamAPI.getTenants).toHaveBeenCalledTimes(1);
      expect(mockedIamAPI.getTenants).toHaveBeenCalledWith();
    });
  });

  describe('useGetSession', () => {
    it('fetches session successfully', async () => {
      const mockData: GetSessionResponse = {
        username: 'testuser',
        groups: [
          {
            group: {
              id: 'group-1',
              name: 'Test Group',
              managedId: 'managed-1'
            },
            role: 'ADMIN' as const,
            productRoles: ['role1', 'role2']
          }
        ]
      };
      mockedIamAPI.getSession.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetSession(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedIamAPI.getSession).toHaveBeenCalledTimes(1);
      expect(mockedIamAPI.getSession).toHaveBeenCalledWith();
    });
  });

  describe('useGetTenant', () => {
    it('fetches single tenant successfully', async () => {
      const mockData: TenantReponse = {
        id: 'tenant-1',
        name: 'Test Tenant',
        createdAt: '2024-01-01T00:00:00Z',
        idp: 'test-idp',
        extras: {},
        region: 'us-west-1',
        entitlements: [],
        organization: '',
        organizationId: ''
      };
      mockedIamAPI.getTenant.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetTenant('tenant-1'), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedIamAPI.getTenant).toHaveBeenCalledWith('tenant-1');
    });

    it('does not fetch when tenantId is empty', () => {
      const {result} = renderHook(() => useGetTenant(''), {
        wrapper: createWrapper()
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockedIamAPI.getTenant).not.toHaveBeenCalled();
    });
  });

  describe('useGetUsersGroup', () => {
    it('fetches users group successfully', async () => {
      const mockData: GetUsersGroupsResponse = {
        users: [
          {
            name: 'Test User',
            role: 'ADMIN',
            productRoles: ['role1', 'role2']
          }
        ]
      };
      mockedIamAPI.getUsersGroups.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetUsersGroup('group-1'), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedIamAPI.getUsersGroups).toHaveBeenCalledWith('group-1');
    });

    it('does not fetch when groupId is empty', () => {
      const {result} = renderHook(() => useGetUsersGroup(''), {
        wrapper: createWrapper()
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockedIamAPI.getUsersGroups).not.toHaveBeenCalled();
    });
  });

  describe('useGetGroupsTenant', () => {
    it('fetches tenant groups successfully', async () => {
      const mockData: GetGroupsTenantResponse = {
        groups: [
          {
            id: 'group-1',
            name: 'Test Group'
          }
        ]
      };
      mockedIamAPI.getGroupsTenant.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetGroupsTenant('tenant-1'), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedIamAPI.getGroupsTenant).toHaveBeenCalledWith('tenant-1');
    });

    it('does not fetch when tenantId is empty', () => {
      const {result} = renderHook(() => useGetGroupsTenant(''), {
        wrapper: createWrapper()
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockedIamAPI.getGroupsTenant).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('handles API errors', async () => {
      const mockError = new Error('API Error');
      mockedIamAPI.getTenants.mockRejectedValue(mockError);

      const {result} = renderHook(() => useGetTenants(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });
});
