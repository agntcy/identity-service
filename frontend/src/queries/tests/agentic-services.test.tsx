/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, expect, vi, beforeEach} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {
  useGetAgenticServices,
  useGetAgenticService,
  useGetGetTasksAgenticService,
  useGetAgenticServiceTotalCount,
  useGetAgenticServiceBadge
} from '../agentic-services';
import {AgenticServicesAPI} from '@/api/services';
import {AppType} from '@/types/api/app';
import qs from 'qs';
import type {AxiosResponse} from 'axios';
import type {
  V1Alpha1ListAppsResponse,
  V1Alpha1App,
  V1Alpha1GetTasksResponse,
  V1Alpha1GetAppsCountResponse,
  V1Alpha1Badge
} from '@/api/generated/identity/app_service.swagger.api';
import {V1Alpha1AppType} from '@/api/generated/identity/app_service.swagger.api';

// Mock the AgenticServicesAPI
vi.mock('@/api/services', () => ({
  AgenticServicesAPI: {
    listApps: vi.fn(),
    getApp: vi.fn(),
    getAppBadge: vi.fn(),
    getTasks: vi.fn(),
    getAppsCount: vi.fn()
  }
}));

const mockedAgenticServicesAPI = vi.mocked(AgenticServicesAPI);

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

describe('Agentic Services Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useGetAgenticServices', () => {
    it('fetches agentic services successfully', async () => {
      const mockData: V1Alpha1ListAppsResponse = {
        apps: [
          {
            id: 'app-1',
            name: 'Test App',
            type: V1Alpha1AppType.APP_TYPE_UNSPECIFIED
          } as V1Alpha1App
        ]
      };
      mockedAgenticServicesAPI.listApps.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetAgenticServices(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedAgenticServicesAPI.listApps).toHaveBeenCalledTimes(1);
    });

    it('passes query parameters correctly', async () => {
      const mockData: V1Alpha1ListAppsResponse = {apps: []};
      mockedAgenticServicesAPI.listApps.mockResolvedValue(createMockAxiosResponse(mockData));

      const query = {
        page: 1,
        size: 10,
        query: 'test',
        types: [AppType.APP_TYPE_AGENT_A2A],
        sortColumn: 'name',
        sortDesc: true
      };

      renderHook(() => useGetAgenticServices(query), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(mockedAgenticServicesAPI.listApps).toHaveBeenCalledWith(
          query,
          expect.objectContaining({
            paramsSerializer: expect.any(Function)
          })
        );
      });
    });

    it('uses correct paramsSerializer function', async () => {
      const mockData: V1Alpha1ListAppsResponse = {apps: []};
      mockedAgenticServicesAPI.listApps.mockResolvedValue(createMockAxiosResponse(mockData));

      const query = {page: 1, types: [AppType.APP_TYPE_AGENT_A2A]};
      renderHook(() => useGetAgenticServices(query), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(mockedAgenticServicesAPI.listApps).toHaveBeenCalled();
      });

      // Get the actual call arguments
      const callArgs = mockedAgenticServicesAPI.listApps.mock.calls[0];
      const configArg = callArgs[1];
      const paramsSerializer = configArg?.paramsSerializer;

      // Test that the paramsSerializer function works correctly
      expect(paramsSerializer).toBeDefined();
      expect(typeof paramsSerializer).toBe('function');

      if (typeof paramsSerializer === 'function') {
        const testParams = {page: 1, types: ['INTEGRATION']};
        const serializedParams = paramsSerializer(testParams);
        const expectedSerialized = qs.stringify(testParams);

        expect(serializedParams).toEqual(expectedSerialized);
      }
    });

    it('respects enabled flag', () => {
      const {result} = renderHook(() => useGetAgenticServices(undefined, false), {
        wrapper: createWrapper()
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockedAgenticServicesAPI.listApps).not.toHaveBeenCalled();
    });
  });

  describe('useGetAgenticService', () => {
    it('fetches single agentic service successfully', async () => {
      const mockData: V1Alpha1App = {
        id: 'app-1',
        name: 'Test App',
        type: V1Alpha1AppType.APP_TYPE_UNSPECIFIED
      };
      mockedAgenticServicesAPI.getApp.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetAgenticService('app-1'), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedAgenticServicesAPI.getApp).toHaveBeenCalledWith('app-1');
    });

    it('does not fetch when id is undefined', () => {
      const {result} = renderHook(() => useGetAgenticService(undefined), {
        wrapper: createWrapper()
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockedAgenticServicesAPI.getApp).not.toHaveBeenCalled();
    });
  });

  // ...existing code...

  describe('useGetAgenticServiceBadge', () => {
    it('fetches service badge successfully', async () => {
      const mockData: V1Alpha1Badge = {
        verifiableCredential: {
          type: ['VerifiableCredential'],
          issuer: 'did:example:issuer',
          issuanceDate: '2023-01-01T00:00:00Z',
          credentialSubject: {
            id: 'did:example:subject'
          }
        },
        appId: 'app-1'
      };
      mockedAgenticServicesAPI.getAppBadge.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetAgenticServiceBadge('app-1'), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedAgenticServicesAPI.getAppBadge).toHaveBeenCalledWith('app-1');
    });

    it('does not fetch when id is undefined', () => {
      const {result} = renderHook(() => useGetAgenticServiceBadge(undefined), {
        wrapper: createWrapper()
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockedAgenticServicesAPI.getAppBadge).not.toHaveBeenCalled();
    });
  });

  // ...existing code...

  describe('useGetGetTasksAgenticService', () => {
    it('fetches tasks successfully', async () => {
      const mockData: V1Alpha1GetTasksResponse = {
        result: {
          APP_TYPE_AGENT_A2A: {
            tasks: [
              {
                id: 'task-1',
                name: 'Test Task',
                description: 'Test Description',
                appId: 'app-1',
                toolName: 'test-tool'
              }
            ]
          },
          APP_TYPE_AGENT_OASF: {
            tasks: [
              {
                id: 'task-2',
                name: 'Another Task',
                description: 'Another Description',
                appId: 'app-2',
                toolName: 'another-tool'
              }
            ]
          }
        }
      };
      mockedAgenticServicesAPI.getTasks.mockResolvedValue(createMockAxiosResponse(mockData));

      const query = {excludeAppIds: ['app-1', 'app-2']};
      const {result} = renderHook(() => useGetGetTasksAgenticService(query), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedAgenticServicesAPI.getTasks).toHaveBeenCalledWith(
        query,
        expect.objectContaining({
          paramsSerializer: expect.any(Function)
        })
      );
    });

    it('uses correct paramsSerializer function', async () => {
      const mockData: V1Alpha1GetTasksResponse = {
        result: {}
      };
      mockedAgenticServicesAPI.getTasks.mockResolvedValue(createMockAxiosResponse(mockData));

      const query = {excludeAppIds: ['app-1']};
      renderHook(() => useGetGetTasksAgenticService(query), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(mockedAgenticServicesAPI.getTasks).toHaveBeenCalled();
      });

      // Get the actual call arguments
      const callArgs = mockedAgenticServicesAPI.getTasks.mock.calls[0];
      const configArg = callArgs[1];
      const paramsSerializer = configArg?.paramsSerializer;

      // Test that the paramsSerializer function works correctly
      expect(paramsSerializer).toBeDefined();
      expect(typeof paramsSerializer).toBe('function');

      if (typeof paramsSerializer === 'function') {
        const testParams = {excludeAppIds: ['app-1']};
        const serializedParams = paramsSerializer(testParams);
        const expectedSerialized = qs.stringify(testParams);

        expect(serializedParams).toEqual(expectedSerialized);
      }
    });

    it('does not fetch when query is undefined', () => {
      const {result} = renderHook(() => useGetGetTasksAgenticService(undefined), {
        wrapper: createWrapper()
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockedAgenticServicesAPI.getTasks).not.toHaveBeenCalled();
    });
  });

  describe('useGetAgenticServiceTotalCount', () => {
    it('fetches total count successfully', async () => {
      const mockData: V1Alpha1GetAppsCountResponse = {
        total: '42'
      };
      mockedAgenticServicesAPI.getAppsCount.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetAgenticServiceTotalCount(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedAgenticServicesAPI.getAppsCount).toHaveBeenCalledTimes(1);
      expect(mockedAgenticServicesAPI.getAppsCount).toHaveBeenCalledWith();
    });
  });

  describe('error handling', () => {
    it('handles API errors', async () => {
      const mockError = new Error('API Error');
      mockedAgenticServicesAPI.listApps.mockRejectedValue(mockError);

      const {result} = renderHook(() => useGetAgenticServices(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });
});
