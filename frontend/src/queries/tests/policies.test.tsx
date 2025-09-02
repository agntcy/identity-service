/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, expect, vi, beforeEach} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {useGetPolicies, useGetPolicy, useGetPolicyRules, useGetRule, useGetPoliciesCount} from '../policies';
import {PolicyAPI} from '@/api/services';
import type {AxiosResponse} from 'axios';
import type {
  V1Alpha1ListPoliciesResponse,
  V1Alpha1Policy,
  V1Alpha1ListRulesResponse,
  V1Alpha1Rule,
  V1Alpha1GetPoliciesCountResponse
} from '@/api/generated/identity/policy_service.swagger.api';
import qs from 'qs';

// Mock the PolicyAPI
vi.mock('@/api/services', () => ({
  PolicyAPI: {
    listPolicies: vi.fn(),
    getPolicy: vi.fn(),
    listRules: vi.fn(),
    getRule: vi.fn(),
    getPoliciesCount: vi.fn()
  }
}));

const mockedPolicyAPI = vi.mocked(PolicyAPI);

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

describe('Policies Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useGetPolicies', () => {
    it('fetches policies successfully', async () => {
      const mockData: V1Alpha1ListPoliciesResponse = {
        policies: [
          {
            id: '1',
            name: 'Test Policy'
          } as V1Alpha1Policy
        ]
      };
      mockedPolicyAPI.listPolicies.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetPolicies({}), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedPolicyAPI.listPolicies).toHaveBeenCalledTimes(1);
    });

    it('passes query parameters correctly', async () => {
      const mockData: V1Alpha1ListPoliciesResponse = {policies: []};
      mockedPolicyAPI.listPolicies.mockResolvedValue(createMockAxiosResponse(mockData));

      const query = {page: 1, size: 10, query: 'test'};
      renderHook(() => useGetPolicies({query}), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(mockedPolicyAPI.listPolicies).toHaveBeenCalledWith(
          query,
          expect.objectContaining({
            paramsSerializer: expect.any(Function)
          })
        );
      });
    });

    it('respects enabled flag', () => {
      const {result} = renderHook(() => useGetPolicies({enabled: false}), {
        wrapper: createWrapper()
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockedPolicyAPI.listPolicies).not.toHaveBeenCalled();
    });

    it('passes query parameters correctly', async () => {
      const mockData: V1Alpha1ListPoliciesResponse = {policies: []};
      mockedPolicyAPI.listPolicies.mockResolvedValue(createMockAxiosResponse(mockData));

      const query = {page: 1, size: 10, query: 'test'};
      renderHook(() => useGetPolicies({query}), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(mockedPolicyAPI.listPolicies).toHaveBeenCalledWith(
          query,
          expect.objectContaining({
            paramsSerializer: expect.any(Function)
          })
        );
      });
    });

    it('uses correct paramsSerializer function', async () => {
      const mockData: V1Alpha1ListPoliciesResponse = {policies: []};
      mockedPolicyAPI.listPolicies.mockResolvedValue(createMockAxiosResponse(mockData));

      const query = {page: 1, size: 10, appIds: ['app1', 'app2']};
      renderHook(() => useGetPolicies({query}), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(mockedPolicyAPI.listPolicies).toHaveBeenCalled();
      });

      // Get the actual call arguments
      const callArgs = mockedPolicyAPI.listPolicies.mock.calls[0];
      const configArg = callArgs[1];
      const paramsSerializer = configArg?.paramsSerializer;

      // Test that the paramsSerializer function works correctly
      expect(paramsSerializer).toBeDefined();
      expect(typeof paramsSerializer).toBe('function');

      if (typeof paramsSerializer === 'function') {
        const testParams = {page: 1, appIds: ['app1', 'app2']};
        const serializedParams = paramsSerializer(testParams);
        const expectedSerialized = qs.stringify(testParams);

        expect(serializedParams).toEqual(expectedSerialized);
      }
    });
  });

  describe('useGetPolicy', () => {
    it('fetches single policy successfully', async () => {
      const mockData: V1Alpha1Policy = {
        id: '1',
        name: 'Test Policy'
      };
      mockedPolicyAPI.getPolicy.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetPolicy('1'), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedPolicyAPI.getPolicy).toHaveBeenCalledWith('1');
    });

    it('does not fetch when id is undefined', () => {
      const {result} = renderHook(() => useGetPolicy(undefined), {
        wrapper: createWrapper()
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockedPolicyAPI.getPolicy).not.toHaveBeenCalled();
    });
  });

  describe('useGetPolicyRules', () => {
    it('fetches policy rules successfully', async () => {
      const mockData: V1Alpha1ListRulesResponse = {
        rules: [
          {
            id: '1',
            name: 'Test Rule'
          } as V1Alpha1Rule
        ]
      };
      mockedPolicyAPI.listRules.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetPolicyRules({policyId: 'policy-1'}), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedPolicyAPI.listRules).toHaveBeenCalledWith(
        'policy-1',
        {},
        expect.objectContaining({
          paramsSerializer: expect.any(Function)
        })
      );
    });

    it('does not fetch when policyId is undefined', () => {
      const {result} = renderHook(() => useGetPolicyRules({policyId: undefined}), {
        wrapper: createWrapper()
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockedPolicyAPI.listRules).not.toHaveBeenCalled();
    });

    it('uses correct paramsSerializer function', async () => {
      const mockData: V1Alpha1ListRulesResponse = {rules: []};
      mockedPolicyAPI.listRules.mockResolvedValue(createMockAxiosResponse(mockData));

      const query = {page: 1, size: 10, query: 'test'};
      renderHook(() => useGetPolicyRules({policyId: 'policy-1', query}), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(mockedPolicyAPI.listRules).toHaveBeenCalled();
      });

      // Get the actual call arguments
      const callArgs = mockedPolicyAPI.listRules.mock.calls[0];
      const configArg = callArgs[2]; // Third argument for listRules
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
  });

  describe('useGetRule', () => {
    it('fetches single rule successfully', async () => {
      const mockData: V1Alpha1Rule = {
        id: 'rule-1',
        name: 'Test Rule'
      };
      mockedPolicyAPI.getRule.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetRule('policy-1', 'rule-1'), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedPolicyAPI.getRule).toHaveBeenCalledWith('policy-1', 'rule-1');
    });

    it('does not fetch when parameters are missing', () => {
      const {result} = renderHook(() => useGetRule(undefined, 'rule-1'), {
        wrapper: createWrapper()
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockedPolicyAPI.getRule).not.toHaveBeenCalled();
    });
  });

  describe('useGetPoliciesCount', () => {
    it('fetches policies count successfully', async () => {
      const mockData: V1Alpha1GetPoliciesCountResponse = {
        total: '42'
      };
      mockedPolicyAPI.getPoliciesCount.mockResolvedValue(createMockAxiosResponse(mockData));

      const {result} = renderHook(() => useGetPoliciesCount({}), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedPolicyAPI.getPoliciesCount).toHaveBeenCalledTimes(1);
    });

    it('respects enabled flag', () => {
      const {result} = renderHook(() => useGetPoliciesCount({enabled: false}), {
        wrapper: createWrapper()
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockedPolicyAPI.getPoliciesCount).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('handles API errors', async () => {
      const mockError = new Error('API Error');
      mockedPolicyAPI.listPolicies.mockRejectedValue(mockError);

      const {result} = renderHook(() => useGetPolicies({}), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });
});
