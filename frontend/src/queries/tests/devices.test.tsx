/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, expect, vi, beforeEach} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {useGetDevices} from '../devices';
import {DevicesAPI} from '@/api/services';
import qs from 'qs';
import type {AxiosResponse} from 'axios';
import type {V1Alpha1ListDevicesResponse, V1Alpha1Device} from '@/api/generated/identity/device_service.swagger.api';

// Mock the DevicesAPI
vi.mock('@/api/services', () => ({
  DevicesAPI: {
    listDevices: vi.fn()
  }
}));

const mockedDevicesAPI = vi.mocked(DevicesAPI);

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

describe('Devices Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useGetDevices', () => {
    it('fetches devices successfully', async () => {
      const mockData: V1Alpha1ListDevicesResponse = {
        devices: [
          {
            id: 'device-1',
            name: 'Test Device'
          } as V1Alpha1Device
        ]
      };
      mockedDevicesAPI.listDevices.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetDevices(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedDevicesAPI.listDevices).toHaveBeenCalledTimes(1);
    });

    it('passes query parameters correctly', async () => {
      const mockData: V1Alpha1ListDevicesResponse = {devices: []};
      mockedDevicesAPI.listDevices.mockResolvedValue(createMockAxiosResponse(mockData));

      const query = {page: 1, size: 10, query: 'test'};
      renderHook(() => useGetDevices(query), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(mockedDevicesAPI.listDevices).toHaveBeenCalledWith(
          query,
          expect.objectContaining({
            paramsSerializer: expect.any(Function)
          })
        );
      });
    });

    it('uses correct paramsSerializer function', async () => {
      const mockData: V1Alpha1ListDevicesResponse = {devices: []};
      mockedDevicesAPI.listDevices.mockResolvedValue(createMockAxiosResponse(mockData));

      const query = {page: 1, size: 10, query: 'test'};
      renderHook(() => useGetDevices(query), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(mockedDevicesAPI.listDevices).toHaveBeenCalled();
      });

      // Get the actual call arguments
      const callArgs = mockedDevicesAPI.listDevices.mock.calls[0];
      const configArg = callArgs[1];
      const paramsSerializer = configArg?.paramsSerializer;

      // Test that the paramsSerializer function works correctly
      expect(paramsSerializer).toBeDefined();
      expect(typeof paramsSerializer).toBe('function');

      if (typeof paramsSerializer === 'function') {
        const testParams = {page: 1, query: 'test'};
        const serializedParams = paramsSerializer(testParams);
        const expectedSerialized = qs.stringify(testParams);

        expect(serializedParams).toEqual(expectedSerialized);
      }
    });

    it('respects enabled flag', () => {
      const {result} = renderHook(() => useGetDevices(undefined, false), {
        wrapper: createWrapper()
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockedDevicesAPI.listDevices).not.toHaveBeenCalled();
    });

    it('fetches when enabled is true by default', async () => {
      const mockData: V1Alpha1ListDevicesResponse = {devices: []};
      mockedDevicesAPI.listDevices.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetDevices(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedDevicesAPI.listDevices).toHaveBeenCalledTimes(1);
    });

    it('passes undefined query parameters correctly', async () => {
      const mockData: V1Alpha1ListDevicesResponse = {devices: []};
      mockedDevicesAPI.listDevices.mockResolvedValue(createMockAxiosResponse(mockData));

      renderHook(() => useGetDevices(undefined), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(mockedDevicesAPI.listDevices).toHaveBeenCalledWith(
          {
            page: undefined,
            size: undefined,
            query: undefined
          },
          expect.objectContaining({
            paramsSerializer: expect.any(Function)
          })
        );
      });
    });
  });

  describe('error handling', () => {
    it('handles API errors', async () => {
      const mockError = new Error('API Error');
      mockedDevicesAPI.listDevices.mockRejectedValue(mockError);

      const {result} = renderHook(() => useGetDevices(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });
});
