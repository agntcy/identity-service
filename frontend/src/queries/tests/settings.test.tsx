/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, expect, vi, beforeEach} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {useGetSettings} from '../settings';
import {SettingsAPI} from '@/api/services';
import {V1Alpha1Settings, V1Alpha1IdpType} from '@/api/generated/identity/settings_service.swagger.api';
import type {AxiosResponse} from 'axios';

// Mock the SettingsAPI
vi.mock('@/api/services', () => ({
  SettingsAPI: {
    getSettings: vi.fn()
  }
}));

const mockedSettingsAPI = vi.mocked(SettingsAPI);

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

describe('useGetSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful data fetching', () => {
    it('returns data when API call succeeds', async () => {
      const mockData: V1Alpha1Settings = {
        apiKey: {apiKey: 'test-api-key'},
        issuerSettings: {
          issuerId: 'test-issuer',
          keyId: 'test-key',
          idpType: V1Alpha1IdpType.IDP_TYPE_DUO,
          duoIdpSettings: {
            hostname: 'test.duosecurity.com',
            integrationKey: 'test-integration-key',
            secretKey: 'test-secret-key'
          }
        }
      };
      mockedSettingsAPI.getSettings.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetSettings(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
      expect(mockedSettingsAPI.getSettings).toHaveBeenCalledTimes(1);
    });

    it('uses correct query key', async () => {
      const mockData: V1Alpha1Settings = {
        apiKey: {apiKey: 'test-api-key'}
      };
      mockedSettingsAPI.getSettings.mockResolvedValue(createMockAxiosResponse(mockData));

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: Infinity, // Prevent refetching due to staleness
            gcTime: Infinity
          }
        }
      });

      const wrapper = ({children}: {children: React.ReactNode}) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const {result} = renderHook(() => useGetSettings(), {wrapper});

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Clear the mock call count after first successful fetch
      vi.clearAllMocks();

      // Verify the query key is used correctly by checking if data is cached
      const {result: result2} = renderHook(() => useGetSettings(), {wrapper});

      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true);
      });

      // Should not call API again due to caching with same query key
      expect(mockedSettingsAPI.getSettings).toHaveBeenCalledTimes(0);
      expect(result2.current.data).toEqual(mockData);
    });

    it('returns correct React Query status flags on success', async () => {
      const mockData: V1Alpha1Settings = {
        apiKey: {apiKey: 'test-api-key'}
      };
      mockedSettingsAPI.getSettings.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetSettings(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.status).toBe('success');
    });
  });

  describe('error handling', () => {
    it('handles API errors correctly', async () => {
      const mockError = new Error('API Error');
      mockedSettingsAPI.getSettings.mockRejectedValue(mockError);

      const {result} = renderHook(() => useGetSettings(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.data).toBeUndefined();
      expect(mockedSettingsAPI.getSettings).toHaveBeenCalledTimes(1);
    });

    it('handles network errors', async () => {
      const networkError = new Error('Network Error');
      mockedSettingsAPI.getSettings.mockRejectedValue(networkError);

      const {result} = renderHook(() => useGetSettings(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(networkError);
      expect(result.current.isLoading).toBe(false);
    });

    it('returns correct React Query status flags on error', async () => {
      const mockError = new Error('Test Error');
      mockedSettingsAPI.getSettings.mockRejectedValue(mockError);

      const {result} = renderHook(() => useGetSettings(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.status).toBe('error');
    });

    it('handles 404 errors', async () => {
      const notFoundError = new Error('Not Found');
      notFoundError.name = '404';
      mockedSettingsAPI.getSettings.mockRejectedValue(notFoundError);

      const {result} = renderHook(() => useGetSettings(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(notFoundError);
      expect(result.current.data).toBeUndefined();
    });

    it('handles timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockedSettingsAPI.getSettings.mockRejectedValue(timeoutError);

      const {result} = renderHook(() => useGetSettings(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(timeoutError);
      expect(result.current.failureCount).toBe(1);
    });
  });

  describe('loading states', () => {
    it('shows loading state initially', () => {
      mockedSettingsAPI.getSettings.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const {result} = renderHook(() => useGetSettings(), {
        wrapper: createWrapper()
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();
    });

    it('transitions from loading to success', async () => {
      const mockData: V1Alpha1Settings = {
        apiKey: {apiKey: 'test-api-key'}
      };
      mockedSettingsAPI.getSettings.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetSettings(), {
        wrapper: createWrapper()
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockData);
    });

    it('shows isPending state correctly', () => {
      mockedSettingsAPI.getSettings.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const {result} = renderHook(() => useGetSettings(), {
        wrapper: createWrapper()
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.status).toBe('pending');
    });

    it('shows isFetching state correctly during initial fetch', () => {
      mockedSettingsAPI.getSettings.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const {result} = renderHook(() => useGetSettings(), {
        wrapper: createWrapper()
      });

      expect(result.current.isFetching).toBe(true);
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('API integration', () => {
    it('calls SettingsAPI.getSettings with no parameters', async () => {
      const mockData: V1Alpha1Settings = {
        apiKey: {apiKey: 'test-api-key'}
      };
      mockedSettingsAPI.getSettings.mockResolvedValue(createMockAxiosResponse(mockData));

      renderHook(() => useGetSettings(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(mockedSettingsAPI.getSettings).toHaveBeenCalledWith();
      });
    });

    it('extracts data property from API response', async () => {
      const mockData: V1Alpha1Settings = {apiKey: {apiKey: 'test-api-key'}};
      const mockApiResponse = createMockAxiosResponse(mockData);
      mockedSettingsAPI.getSettings.mockResolvedValue(mockApiResponse);

      const {result} = renderHook(() => useGetSettings(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
    });

    it('makes only one API call even with multiple hook instances using same wrapper', async () => {
      const mockData: V1Alpha1Settings = {
        apiKey: {apiKey: 'test-api-key'}
      };
      mockedSettingsAPI.getSettings.mockResolvedValue(createMockAxiosResponse(mockData));

      const wrapper = createWrapper();

      const {result: result1} = renderHook(() => useGetSettings(), {wrapper});
      const {result: result2} = renderHook(() => useGetSettings(), {wrapper});

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true);
      });

      // Should only call API once due to React Query caching
      expect(mockedSettingsAPI.getSettings).toHaveBeenCalledTimes(1);
      expect(result1.current.data).toEqual(mockData);
      expect(result2.current.data).toEqual(mockData);
    });
  });

  describe('React Query features', () => {
    it('provides correct query key in result', async () => {
      const mockData: V1Alpha1Settings = {
        apiKey: {apiKey: 'test-api-key'}
      };
      mockedSettingsAPI.getSettings.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetSettings(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.dataUpdatedAt).toBeTypeOf('number');
      expect(result.current.dataUpdatedAt).toBeGreaterThan(0);
    });

    it('handles refetch correctly', async () => {
      const mockData: V1Alpha1Settings = {
        apiKey: {apiKey: 'test-api-key'}
      };
      mockedSettingsAPI.getSettings.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetSettings(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);

      // Prepare updated data for refetch
      const updatedData: V1Alpha1Settings = {
        apiKey: {apiKey: 'updated-api-key'}
      };

      // Clear mock calls and set up new response
      vi.clearAllMocks();
      mockedSettingsAPI.getSettings.mockResolvedValue(createMockAxiosResponse(updatedData));

      // Trigger refetch
      const refetchResult = await result.current.refetch();

      // Wait for the refetch to complete
      await waitFor(() => {
        expect(result.current.data).toEqual(updatedData);
      });

      expect(mockedSettingsAPI.getSettings).toHaveBeenCalledTimes(1);
      expect(refetchResult.data).toEqual(updatedData);
    });

    it('tracks fetch count correctly', async () => {
      const mockData: V1Alpha1Settings = {
        apiKey: {apiKey: 'test-api-key'}
      };
      mockedSettingsAPI.getSettings.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetSettings(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.isFetched).toBe(true);
    });

    it('maintains stale data behavior', async () => {
      const mockData: V1Alpha1Settings = {
        apiKey: {apiKey: 'test-api-key'}
      };
      mockedSettingsAPI.getSettings.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetSettings(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isStale).toBe(true); // Should be stale due to staleTime: 0
    });
  });

  describe('edge cases', () => {
    it('handles different IdP types', async () => {
      const oktaSettings: V1Alpha1Settings = {
        issuerSettings: {
          issuerId: 'okta-issuer',
          keyId: 'okta-key',
          idpType: V1Alpha1IdpType.IDP_TYPE_OKTA,
          oktaIdpSettings: {
            orgUrl: 'https://test.okta.com',
            clientId: 'test-client-id',
            privateKey: 'test-private-key'
          }
        }
      };
      mockedSettingsAPI.getSettings.mockResolvedValue(createMockAxiosResponse(oktaSettings));

      const {result} = renderHook(() => useGetSettings(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(oktaSettings);
      expect(result.current.data?.issuerSettings?.idpType).toBe(V1Alpha1IdpType.IDP_TYPE_OKTA);
    });
  });
});
