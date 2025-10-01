/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable react/display-name */
import {describe, it, expect, vi, beforeEach, Mock} from 'vitest';
import {renderHook} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {App} from '@/types/api/app';
import React from 'react';
import {
  useCreateAgenticService,
  useUpdateAgenticService,
  useDeleteAgenticService,
  useRefreshAgenticServiceApiKey
} from '../';

// Mock the API module
vi.mock('@/api/services', () => ({
  AgenticServicesAPI: {
    createApp: vi.fn(),
    updateApp: vi.fn(),
    deleteApp: vi.fn(),
    refreshAppApiKey: vi.fn()
  }
}));

// Import the mocked API to access it in tests
import {AgenticServicesAPI} from '@/api/services';

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

describe('agentic services mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCreateAgenticService', () => {
    it('calls AgenticServicesAPI.createApp with correct data', async () => {
      const mockAppData: App = {
        id: '1',
        name: 'Test App',
        description: 'Test description'
      } as App;
      const mockResponse = {data: mockAppData};

      (AgenticServicesAPI.createApp as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useCreateAgenticService({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(mockAppData);

      expect(AgenticServicesAPI.createApp).toHaveBeenCalledWith(mockAppData);
    });

    it('calls onSuccess callback when app creation succeeds', async () => {
      const mockAppData: App = {
        id: '1',
        name: 'Test App',
        description: 'Test description'
      } as App;
      const mockResponse = {data: mockAppData};
      const onSuccess = vi.fn();

      (AgenticServicesAPI.createApp as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useCreateAgenticService({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(mockAppData);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates agentic services queries on success', async () => {
      const mockAppData: App = {
        id: '1',
        name: 'Test App',
        description: 'Test description'
      } as App;
      const mockResponse = {data: mockAppData};

      (AgenticServicesAPI.createApp as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useCreateAgenticService({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync(mockAppData);

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-agentic-services']});
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-agentic-services-total-count']});
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
    });

    it('calls onError callback when app creation fails', async () => {
      const mockAppData: App = {
        id: '1',
        name: 'Test App',
        description: 'Test description'
      } as App;
      const onError = vi.fn();

      (AgenticServicesAPI.createApp as Mock).mockRejectedValue(new Error('Creation failed'));

      const {result} = renderHook(() => useCreateAgenticService({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(mockAppData);
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });

    it('works without callbacks', async () => {
      const mockAppData: App = {
        id: '1',
        name: 'Test App',
        description: 'Test description'
      } as App;
      const mockResponse = {data: mockAppData};

      (AgenticServicesAPI.createApp as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useCreateAgenticService({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(mockAppData)).resolves.not.toThrow();
    });
  });

  describe('useUpdateAgenticService', () => {
    it('calls AgenticServicesAPI.updateApp with correct parameters', async () => {
      const mockAppData: App = {
        id: '1',
        name: 'Updated App',
        description: 'Updated description'
      } as App;
      const updateParams = {id: '1', data: mockAppData};
      const mockResponse = {data: mockAppData};

      (AgenticServicesAPI.updateApp as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useUpdateAgenticService({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(updateParams);

      expect(AgenticServicesAPI.updateApp).toHaveBeenCalledWith('1', mockAppData);
    });

    it('calls onSuccess callback when app update succeeds', async () => {
      const mockAppData: App = {
        id: '1',
        name: 'Updated App',
        description: 'Updated description'
      } as App;
      const updateParams = {id: '1', data: mockAppData};
      const mockResponse = {data: mockAppData};
      const onSuccess = vi.fn();

      (AgenticServicesAPI.updateApp as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useUpdateAgenticService({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(updateParams);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates agentic services queries on success', async () => {
      const mockAppData: App = {
        id: '1',
        name: 'Updated App',
        description: 'Updated description'
      } as App;
      const updateParams = {id: '1', data: mockAppData};
      const mockResponse = {data: mockAppData};

      (AgenticServicesAPI.updateApp as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useUpdateAgenticService({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync(updateParams);

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-agentic-services']});
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-agentic-service']});
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
    });

    it('calls onError callback when app update fails', async () => {
      const mockAppData: App = {
        id: '1',
        name: 'Updated App',
        description: 'Updated description'
      } as App;
      const updateParams = {id: '1', data: mockAppData};
      const onError = vi.fn();

      (AgenticServicesAPI.updateApp as Mock).mockRejectedValue(new Error('Update failed'));

      const {result} = renderHook(() => useUpdateAgenticService({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(updateParams);
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });

    it('works without callbacks', async () => {
      const mockAppData: App = {
        id: '1',
        name: 'Updated App',
        description: 'Updated description'
      } as App;
      const updateParams = {id: '1', data: mockAppData};
      const mockResponse = {data: mockAppData};

      (AgenticServicesAPI.updateApp as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useUpdateAgenticService({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(updateParams)).resolves.not.toThrow();
    });
  });

  describe('useDeleteAgenticService', () => {
    it('calls AgenticServicesAPI.deleteApp with correct id', async () => {
      const mockResponse = {data: {success: true} as unknown as App};

      (AgenticServicesAPI.deleteApp as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useDeleteAgenticService({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync('1');

      expect(AgenticServicesAPI.deleteApp).toHaveBeenCalledWith('1');
    });

    it('calls onSuccess callback when app deletion succeeds', async () => {
      const mockResponse = {data: {success: true} as unknown as App};
      const onSuccess = vi.fn();

      (AgenticServicesAPI.deleteApp as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useDeleteAgenticService({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync('1');

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates agentic services and total count queries on success', async () => {
      const mockResponse = {data: {success: true} as unknown as App};

      (AgenticServicesAPI.deleteApp as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useDeleteAgenticService({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync('1');

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-agentic-services']});
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-agentic-services-total-count']});
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
    });

    it('calls onError callback when app deletion fails', async () => {
      const onError = vi.fn();

      (AgenticServicesAPI.deleteApp as Mock).mockRejectedValue(new Error('Deletion failed'));

      const {result} = renderHook(() => useDeleteAgenticService({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync('1');
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });

    it('works with default empty callbacks parameter', async () => {
      const mockResponse = {data: {success: true} as unknown as App};

      (AgenticServicesAPI.deleteApp as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useDeleteAgenticService({}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync('1')).resolves.not.toThrow();
    });

    it('works without callbacks', async () => {
      const mockResponse = {data: {success: true} as unknown as App};

      (AgenticServicesAPI.deleteApp as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useDeleteAgenticService({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync('1')).resolves.not.toThrow();
    });
  });

  describe('useRefreshAgenticServiceApiKey', () => {
    it('calls AgenticServicesAPI.refreshAppApiKey with correct id', async () => {
      const mockApp: App = {
        id: '1',
        name: 'Test App',
        apiKey: 'new-api-key-123'
      } as App;
      const mockResponse = {data: mockApp};

      (AgenticServicesAPI.refreshAppApiKey as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useRefreshAgenticServiceApiKey({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync('1');

      expect(AgenticServicesAPI.refreshAppApiKey).toHaveBeenCalledWith('1');
    });

    it('calls onSuccess callback when API key refresh succeeds', async () => {
      const mockApp: App = {
        id: '1',
        name: 'Test App',
        apiKey: 'new-api-key-123'
      } as App;
      const mockResponse = {data: mockApp};
      const onSuccess = vi.fn();

      (AgenticServicesAPI.refreshAppApiKey as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useRefreshAgenticServiceApiKey({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync('1');

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates agentic services queries on success', async () => {
      const mockApp: App = {
        id: '1',
        name: 'Test App',
        apiKey: 'new-api-key-123'
      } as App;
      const mockResponse = {data: mockApp};

      (AgenticServicesAPI.refreshAppApiKey as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useRefreshAgenticServiceApiKey({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync('1');

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-agentic-services']});
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-agentic-service']});
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
    });

    it('calls onError callback when API key refresh fails', async () => {
      const onError = vi.fn();

      (AgenticServicesAPI.refreshAppApiKey as Mock).mockRejectedValue(new Error('Refresh failed'));

      const {result} = renderHook(() => useRefreshAgenticServiceApiKey({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync('1');
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });

    it('works without callbacks', async () => {
      const mockApp: App = {
        id: '1',
        name: 'Test App',
        apiKey: 'new-api-key-123'
      } as App;
      const mockResponse = {data: mockApp};

      (AgenticServicesAPI.refreshAppApiKey as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useRefreshAgenticServiceApiKey({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync('1')).resolves.not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('handles network errors for create app', async () => {
      const mockAppData: App = {
        id: '1',
        name: 'Test App',
        description: 'Test description'
      } as App;
      const onError = vi.fn();

      (AgenticServicesAPI.createApp as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useCreateAgenticService({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(mockAppData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network Error');
      }

      expect(onError).toHaveBeenCalled();
    });

    it('handles network errors for update app', async () => {
      const mockAppData: App = {
        id: '1',
        name: 'Updated App',
        description: 'Updated description'
      } as App;
      const updateParams = {id: '1', data: mockAppData};
      const onError = vi.fn();

      (AgenticServicesAPI.updateApp as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useUpdateAgenticService({callbacks: {onError}}), {
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

    it('handles network errors for delete app', async () => {
      const onError = vi.fn();

      (AgenticServicesAPI.deleteApp as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useDeleteAgenticService({callbacks: {onError}}), {
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

    it('handles network errors for refresh API key', async () => {
      const onError = vi.fn();

      (AgenticServicesAPI.refreshAppApiKey as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useRefreshAgenticServiceApiKey({callbacks: {onError}}), {
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

    it('handles undefined callbacks gracefully for all mutations', async () => {
      const mockAppData: App = {
        id: '1',
        name: 'Test App',
        description: 'Test description'
      } as App;
      const mockResponse = {data: mockAppData};

      (AgenticServicesAPI.createApp as Mock).mockResolvedValue(mockResponse);
      (AgenticServicesAPI.updateApp as Mock).mockResolvedValue(mockResponse);
      (AgenticServicesAPI.deleteApp as Mock).mockResolvedValue(mockResponse);
      (AgenticServicesAPI.refreshAppApiKey as Mock).mockResolvedValue(mockResponse);

      const {result: createResult} = renderHook(() => useCreateAgenticService({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      const {result: updateResult} = renderHook(() => useUpdateAgenticService({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      const {result: deleteResult} = renderHook(() => useDeleteAgenticService({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      const {result: refreshResult} = renderHook(() => useRefreshAgenticServiceApiKey({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(createResult.current.mutateAsync(mockAppData)).resolves.not.toThrow();
      await expect(updateResult.current.mutateAsync({id: '1', data: mockAppData})).resolves.not.toThrow();
      await expect(deleteResult.current.mutateAsync('1')).resolves.not.toThrow();
      await expect(refreshResult.current.mutateAsync('1')).resolves.not.toThrow();
    });

    it('handles partial callbacks - only onSuccess for all mutations', async () => {
      const mockAppData: App = {
        id: '1',
        name: 'Test App',
        description: 'Test description'
      } as App;
      const mockResponse = {data: mockAppData};
      const onSuccess = vi.fn();

      (AgenticServicesAPI.createApp as Mock).mockResolvedValue(mockResponse);
      (AgenticServicesAPI.updateApp as Mock).mockResolvedValue(mockResponse);
      (AgenticServicesAPI.deleteApp as Mock).mockResolvedValue(mockResponse);
      (AgenticServicesAPI.refreshAppApiKey as Mock).mockResolvedValue(mockResponse);

      const {result: createResult} = renderHook(() => useCreateAgenticService({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      const {result: updateResult} = renderHook(() => useUpdateAgenticService({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      const {result: deleteResult} = renderHook(() => useDeleteAgenticService({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      const {result: refreshResult} = renderHook(() => useRefreshAgenticServiceApiKey({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await createResult.current.mutateAsync(mockAppData);
      await updateResult.current.mutateAsync({id: '1', data: mockAppData});
      await deleteResult.current.mutateAsync('1');
      await refreshResult.current.mutateAsync('1');

      expect(onSuccess).toHaveBeenCalledTimes(4);
    });
  });
});
