/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable react/display-name */
import {describe, it, expect, vi, beforeEach, Mock} from 'vitest';
import {renderHook} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {InviteUserPayload, TenantReponse} from '@/types/api/iam';
import React from 'react';
import {useCreateTenant, useUpdateTenant, useDeleteTenant, useInviteUser, useDeleteUser} from '../';

// Mock the API module
vi.mock('@/api/services', () => ({
  IamAPI: {
    createTenant: vi.fn(),
    updateTenant: vi.fn(),
    deleteTenant: vi.fn(),
    inviteUser: vi.fn(),
    deleteUser: vi.fn()
  }
}));

// Import the mocked API to access it in tests
import {IamAPI} from '@/api/services';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {retry: false},
      mutations: {retry: false}
    }
  });

  return ({children}: {children: React.ReactNode}) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const createWrapperWithSpy = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {retry: false},
      mutations: {retry: false}
    }
  });
  const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

  const CustomWrapper = ({children}: {children: React.ReactNode}) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return {CustomWrapper, invalidateQueriesSpy};
};

describe('iam mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCreateTenant', () => {
    it('calls IamAPI.createTenant with no parameters', async () => {
      const mockTenant: TenantReponse = {
        id: '1',
        name: 'Test Tenant'
      } as TenantReponse;
      const mockResponse = {data: mockTenant};

      (IamAPI.createTenant as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useCreateTenant({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync();

      expect(IamAPI.createTenant).toHaveBeenCalledWith();
    });

    it('calls onSuccess callback when tenant creation succeeds', async () => {
      const mockTenant: TenantReponse = {
        id: '1',
        name: 'Test Tenant'
      } as TenantReponse;
      const mockResponse = {data: mockTenant};
      const onSuccess = vi.fn();

      (IamAPI.createTenant as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useCreateTenant({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync();

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates tenants queries on success', async () => {
      const mockTenant: TenantReponse = {
        id: '1',
        name: 'Test Tenant'
      } as TenantReponse;
      const mockResponse = {data: mockTenant};

      (IamAPI.createTenant as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useCreateTenant({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync();

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-tenants']});
    });

    it('calls onError callback when tenant creation fails', async () => {
      const onError = vi.fn();

      (IamAPI.createTenant as Mock).mockRejectedValue(new Error('Creation failed'));

      const {result} = renderHook(() => useCreateTenant({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync();
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });

    it('works without callbacks', async () => {
      const mockTenant: TenantReponse = {
        id: '1',
        name: 'Test Tenant'
      } as TenantReponse;
      const mockResponse = {data: mockTenant};

      (IamAPI.createTenant as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useCreateTenant({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync()).resolves.not.toThrow();
    });
  });

  describe('useUpdateTenant', () => {
    it('calls IamAPI.updateTenant with correct parameters', async () => {
      const mockTenant: TenantReponse = {
        id: '1',
        name: 'Updated Tenant'
      } as TenantReponse;
      const mockResponse = {data: mockTenant};
      const updateParams = {id: '1', name: 'Updated Tenant'};

      (IamAPI.updateTenant as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useUpdateTenant({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(updateParams);

      expect(IamAPI.updateTenant).toHaveBeenCalledWith('1', 'Updated Tenant');
    });

    it('calls onSuccess callback when tenant update succeeds', async () => {
      const mockTenant: TenantReponse = {
        id: '1',
        name: 'Updated Tenant'
      } as TenantReponse;
      const mockResponse = {data: mockTenant};
      const updateParams = {id: '1', name: 'Updated Tenant'};
      const onSuccess = vi.fn();

      (IamAPI.updateTenant as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useUpdateTenant({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(updateParams);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates both tenants and tenant queries on success', async () => {
      const mockTenant: TenantReponse = {
        id: '1',
        name: 'Updated Tenant'
      } as TenantReponse;
      const mockResponse = {data: mockTenant};
      const updateParams = {id: '1', name: 'Updated Tenant'};

      (IamAPI.updateTenant as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useUpdateTenant({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync(updateParams);

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-tenants']});
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-tenant']});
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
    });

    it('calls onError callback when tenant update fails', async () => {
      const updateParams = {id: '1', name: 'Updated Tenant'};
      const onError = vi.fn();

      (IamAPI.updateTenant as Mock).mockRejectedValue(new Error('Update failed'));

      const {result} = renderHook(() => useUpdateTenant({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(updateParams);
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('useDeleteTenant', () => {
    it('calls IamAPI.deleteTenant with correct id', async () => {
      const mockResponse = {data: {success: true}};

      (IamAPI.deleteTenant as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useDeleteTenant({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync('1');

      expect(IamAPI.deleteTenant).toHaveBeenCalledWith('1');
    });

    it('calls onSuccess callback when tenant deletion succeeds', async () => {
      const mockResponse = {data: {success: true}};
      const onSuccess = vi.fn();

      (IamAPI.deleteTenant as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useDeleteTenant({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync('1');

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates tenants queries on success', async () => {
      const mockResponse = {data: {success: true}};

      (IamAPI.deleteTenant as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useDeleteTenant({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync('1');

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-tenants']});
    });

    it('calls onError callback when tenant deletion fails', async () => {
      const onError = vi.fn();

      (IamAPI.deleteTenant as Mock).mockRejectedValue(new Error('Deletion failed'));

      const {result} = renderHook(() => useDeleteTenant({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync('1');
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('useInviteUser', () => {
    it('calls IamAPI.inviteUser with correct parameters', async () => {
      const mockInvitePayload: InviteUserPayload = {
        username: 'testuser',
        productRedirectUri: 'https://example.com/redirect'
      };
      const inviteParams = {groupId: 'group-1', data: mockInvitePayload};
      const mockResponse = {data: {success: true}};

      (IamAPI.inviteUser as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useInviteUser({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(inviteParams);

      expect(IamAPI.inviteUser).toHaveBeenCalledWith('group-1', mockInvitePayload);
    });

    it('calls onSuccess callback when user invitation succeeds', async () => {
      const mockInvitePayload: InviteUserPayload = {
        username: 'testuser',
        productRedirectUri: 'https://example.com/redirect'
      };
      const inviteParams = {groupId: 'group-1', data: mockInvitePayload};
      const mockResponse = {data: {success: true}};
      const onSuccess = vi.fn();

      (IamAPI.inviteUser as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useInviteUser({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(inviteParams);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates tenant groups and users group queries on success', async () => {
      const mockInvitePayload: InviteUserPayload = {
        username: 'testuser',
        productRedirectUri: 'https://example.com/redirect'
      };
      const inviteParams = {groupId: 'group-1', data: mockInvitePayload};
      const mockResponse = {data: {success: true}};

      (IamAPI.inviteUser as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useInviteUser({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync(inviteParams);

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-tenant-groups']});
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-users-group']});
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
    });

    it('calls onError callback when user invitation fails', async () => {
      const mockInvitePayload: InviteUserPayload = {
        username: 'testuser',
        productRedirectUri: 'https://example.com/redirect'
      };
      const inviteParams = {groupId: 'group-1', data: mockInvitePayload};
      const onError = vi.fn();

      (IamAPI.inviteUser as Mock).mockRejectedValue(new Error('Invitation failed'));

      const {result} = renderHook(() => useInviteUser({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(inviteParams);
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });

    it('works with optional productRedirectUri', async () => {
      const mockInvitePayload: InviteUserPayload = {
        username: 'testuser'
      };
      const inviteParams = {groupId: 'group-1', data: mockInvitePayload};
      const mockResponse = {data: {success: true}};

      (IamAPI.inviteUser as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useInviteUser({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(inviteParams);

      expect(IamAPI.inviteUser).toHaveBeenCalledWith('group-1', mockInvitePayload);
    });
  });

  describe('useDeleteUser', () => {
    it('calls IamAPI.deleteUser with correct parameters', async () => {
      const deleteParams = {userId: 'user-1', tenantId: 'tenant-1'};
      const mockResponse = {data: {success: true}};

      (IamAPI.deleteUser as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useDeleteUser({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(deleteParams);

      expect(IamAPI.deleteUser).toHaveBeenCalledWith('user-1', 'tenant-1');
    });

    it('calls onSuccess callback when user deletion succeeds', async () => {
      const deleteParams = {userId: 'user-1', tenantId: 'tenant-1'};
      const mockResponse = {data: {success: true}};
      const onSuccess = vi.fn();

      (IamAPI.deleteUser as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useDeleteUser({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(deleteParams);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates tenant groups and users group queries on success', async () => {
      const deleteParams = {userId: 'user-1', tenantId: 'tenant-1'};
      const mockResponse = {data: {success: true}};

      (IamAPI.deleteUser as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useDeleteUser({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync(deleteParams);

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-tenant-groups']});
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-users-group']});
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
    });

    it('calls onError callback when user deletion fails', async () => {
      const deleteParams = {userId: 'user-1', tenantId: 'tenant-1'};
      const onError = vi.fn();

      (IamAPI.deleteUser as Mock).mockRejectedValue(new Error('Deletion failed'));

      const {result} = renderHook(() => useDeleteUser({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(deleteParams);
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('handles network errors for create tenant', async () => {
      const onError = vi.fn();

      (IamAPI.createTenant as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useCreateTenant({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network Error');
      }

      expect(onError).toHaveBeenCalled();
    });

    it('handles network errors for update tenant', async () => {
      const updateParams = {id: '1', name: 'Updated Tenant'};
      const onError = vi.fn();

      (IamAPI.updateTenant as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useUpdateTenant({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(updateParams);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network Error');
      }

      expect(onError).toHaveBeenCalled();
    });

    it('handles network errors for delete tenant', async () => {
      const onError = vi.fn();

      (IamAPI.deleteTenant as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useDeleteTenant({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync('1');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network Error');
      }

      expect(onError).toHaveBeenCalled();
    });

    it('handles network errors for invite user', async () => {
      const mockInvitePayload: InviteUserPayload = {
        username: 'testuser',
        productRedirectUri: 'https://example.com/redirect'
      };
      const inviteParams = {groupId: 'group-1', data: mockInvitePayload};
      const onError = vi.fn();

      (IamAPI.inviteUser as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useInviteUser({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(inviteParams);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network Error');
      }

      expect(onError).toHaveBeenCalled();
    });

    it('handles network errors for delete user', async () => {
      const deleteParams = {userId: 'user-1', tenantId: 'tenant-1'};
      const onError = vi.fn();

      (IamAPI.deleteUser as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useDeleteUser({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(deleteParams);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network Error');
      }

      expect(onError).toHaveBeenCalled();
    });

    it('handles undefined callbacks gracefully for all mutations', async () => {
      const mockTenant: TenantReponse = {
        id: '1',
        name: 'Test Tenant'
      } as TenantReponse;
      const mockResponse = {data: mockTenant};
      const mockInvitePayload: InviteUserPayload = {
        username: 'testuser',
        productRedirectUri: 'https://example.com/redirect'
      };

      (IamAPI.createTenant as Mock).mockResolvedValue(mockResponse);
      (IamAPI.updateTenant as Mock).mockResolvedValue(mockResponse);
      (IamAPI.deleteTenant as Mock).mockResolvedValue(mockResponse);
      (IamAPI.inviteUser as Mock).mockResolvedValue(mockResponse);
      (IamAPI.deleteUser as Mock).mockResolvedValue(mockResponse);

      const {result: createResult} = renderHook(() => useCreateTenant({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      const {result: updateResult} = renderHook(() => useUpdateTenant({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      const {result: deleteResult} = renderHook(() => useDeleteTenant({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      const {result: inviteResult} = renderHook(() => useInviteUser({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      const {result: deleteUserResult} = renderHook(() => useDeleteUser({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(createResult.current.mutateAsync()).resolves.not.toThrow();
      await expect(updateResult.current.mutateAsync({id: '1', name: 'Test'})).resolves.not.toThrow();
      await expect(deleteResult.current.mutateAsync('1')).resolves.not.toThrow();
      await expect(inviteResult.current.mutateAsync({groupId: 'group-1', data: mockInvitePayload})).resolves.not.toThrow();
      await expect(deleteUserResult.current.mutateAsync({userId: 'user-1', tenantId: 'tenant-1'})).resolves.not.toThrow();
    });

    it('handles partial callbacks - only onSuccess for all mutations', async () => {
      const mockTenant: TenantReponse = {
        id: '1',
        name: 'Test Tenant'
      } as TenantReponse;
      const mockResponse = {data: mockTenant};
      const mockInvitePayload: InviteUserPayload = {
        username: 'testuser',
        productRedirectUri: 'https://example.com/redirect'
      };
      const onSuccess = vi.fn();

      (IamAPI.createTenant as Mock).mockResolvedValue(mockResponse);
      (IamAPI.updateTenant as Mock).mockResolvedValue(mockResponse);
      (IamAPI.deleteTenant as Mock).mockResolvedValue(mockResponse);
      (IamAPI.inviteUser as Mock).mockResolvedValue(mockResponse);
      (IamAPI.deleteUser as Mock).mockResolvedValue(mockResponse);

      const {result: createResult} = renderHook(() => useCreateTenant({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      const {result: updateResult} = renderHook(() => useUpdateTenant({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      const {result: deleteResult} = renderHook(() => useDeleteTenant({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      const {result: inviteResult} = renderHook(() => useInviteUser({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      const {result: deleteUserResult} = renderHook(() => useDeleteUser({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await createResult.current.mutateAsync();
      await updateResult.current.mutateAsync({id: '1', name: 'Test'});
      await deleteResult.current.mutateAsync('1');
      await inviteResult.current.mutateAsync({groupId: 'group-1', data: mockInvitePayload});
      await deleteUserResult.current.mutateAsync({userId: 'user-1', tenantId: 'tenant-1'});

      expect(onSuccess).toHaveBeenCalledTimes(5);
    });
  });
});
