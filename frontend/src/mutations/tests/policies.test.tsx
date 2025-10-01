/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable react/display-name */
import {describe, it, expect, vi, beforeEach, Mock} from 'vitest';
import {renderHook} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {CreatePolicyRequest, CreateRuleBody, Policy, Rule} from '@/types/api/policy';
import React from 'react';
import {useCreatePolicy, useUpdatePolicy, useDeletePolicy, useCreateRule, useUpdateRule, useDeleteRule} from '../';

// Mock the API module
vi.mock('@/api/services', () => ({
  PolicyAPI: {
    createPolicy: vi.fn(),
    updatePolicy: vi.fn(),
    deletePolicy: vi.fn(),
    createRule: vi.fn(),
    updateRule: vi.fn(),
    deleteRule: vi.fn()
  }
}));

// Import the mocked API to access it in tests
import {PolicyAPI} from '@/api/services';

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

describe('policies mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCreatePolicy', () => {
    it('calls PolicyAPI.createPolicy with correct data', async () => {
      const mockPolicyRequest: CreatePolicyRequest = {
        name: 'Test Policy',
        description: 'Test description'
      } as CreatePolicyRequest;
      const mockPolicy: Policy = {
        id: '1',
        name: 'Test Policy'
      } as Policy;
      const mockResponse = {data: mockPolicy};

      (PolicyAPI.createPolicy as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useCreatePolicy({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(mockPolicyRequest);

      expect(PolicyAPI.createPolicy).toHaveBeenCalledWith(mockPolicyRequest);
    });

    it('calls onSuccess callback when policy creation succeeds', async () => {
      const mockPolicyRequest: CreatePolicyRequest = {
        name: 'Test Policy',
        description: 'Test description'
      } as CreatePolicyRequest;
      const mockPolicy: Policy = {
        id: '1',
        name: 'Test Policy'
      } as Policy;
      const mockResponse = {data: mockPolicy};
      const onSuccess = vi.fn();

      (PolicyAPI.createPolicy as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useCreatePolicy({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(mockPolicyRequest);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates policies queries on success', async () => {
      const mockPolicyRequest: CreatePolicyRequest = {
        name: 'Test Policy',
        description: 'Test description'
      } as CreatePolicyRequest;
      const mockPolicy: Policy = {
        id: '1',
        name: 'Test Policy'
      } as Policy;
      const mockResponse = {data: mockPolicy};

      (PolicyAPI.createPolicy as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useCreatePolicy({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync(mockPolicyRequest);

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-policies']});
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-policies-total-count']});
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
    });

    it('calls onError callback when policy creation fails', async () => {
      const mockPolicyRequest: CreatePolicyRequest = {
        name: 'Test Policy',
        description: 'Test description'
      } as CreatePolicyRequest;
      const onError = vi.fn();

      (PolicyAPI.createPolicy as Mock).mockRejectedValue(new Error('Creation failed'));

      const {result} = renderHook(() => useCreatePolicy({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(mockPolicyRequest);
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });

    it('works with default empty callbacks parameter', async () => {
      const mockPolicyRequest: CreatePolicyRequest = {
        name: 'Test Policy',
        description: 'Test description'
      } as CreatePolicyRequest;
      const mockPolicy: Policy = {
        id: '1',
        name: 'Test Policy'
      } as Policy;
      const mockResponse = {data: mockPolicy};

      (PolicyAPI.createPolicy as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useCreatePolicy(), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(mockPolicyRequest)).resolves.not.toThrow();
    });

    it('works without callbacks', async () => {
      const mockPolicyRequest: CreatePolicyRequest = {
        name: 'Test Policy',
        description: 'Test description'
      } as CreatePolicyRequest;
      const mockPolicy: Policy = {
        id: '1',
        name: 'Test Policy'
      } as Policy;
      const mockResponse = {data: mockPolicy};

      (PolicyAPI.createPolicy as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useCreatePolicy({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(mockPolicyRequest)).resolves.not.toThrow();
    });
  });

  describe('useUpdatePolicy', () => {
    it('calls PolicyAPI.updatePolicy with correct parameters', async () => {
      const mockPolicyRequest: CreatePolicyRequest = {
        name: 'Updated Policy',
        description: 'Updated description'
      } as CreatePolicyRequest;
      const updateParams = {id: '1', data: mockPolicyRequest};
      const mockPolicy: Policy = {
        id: '1',
        name: 'Updated Policy'
      } as Policy;
      const mockResponse = {data: mockPolicy};

      (PolicyAPI.updatePolicy as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useUpdatePolicy({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(updateParams);

      expect(PolicyAPI.updatePolicy).toHaveBeenCalledWith('1', mockPolicyRequest);
    });

    it('calls onSuccess callback when policy update succeeds', async () => {
      const mockPolicyRequest: CreatePolicyRequest = {
        name: 'Updated Policy',
        description: 'Updated description'
      } as CreatePolicyRequest;
      const updateParams = {id: '1', data: mockPolicyRequest};
      const mockPolicy: Policy = {
        id: '1',
        name: 'Updated Policy'
      } as Policy;
      const mockResponse = {data: mockPolicy};
      const onSuccess = vi.fn();

      (PolicyAPI.updatePolicy as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useUpdatePolicy({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(updateParams);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates policies queries on success', async () => {
      const mockPolicyRequest: CreatePolicyRequest = {
        name: 'Updated Policy',
        description: 'Updated description'
      } as CreatePolicyRequest;
      const updateParams = {id: '1', data: mockPolicyRequest};
      const mockPolicy: Policy = {
        id: '1',
        name: 'Updated Policy'
      } as Policy;
      const mockResponse = {data: mockPolicy};

      (PolicyAPI.updatePolicy as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useUpdatePolicy({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync(updateParams);

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-policies']});
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(1);
    });

    it('calls onError callback when policy update fails', async () => {
      const mockPolicyRequest: CreatePolicyRequest = {
        name: 'Updated Policy',
        description: 'Updated description'
      } as CreatePolicyRequest;
      const updateParams = {id: '1', data: mockPolicyRequest};
      const onError = vi.fn();

      (PolicyAPI.updatePolicy as Mock).mockRejectedValue(new Error('Update failed'));

      const {result} = renderHook(() => useUpdatePolicy({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(updateParams);
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });

    it('works with default empty callbacks parameter', async () => {
      const mockPolicyRequest: CreatePolicyRequest = {
        name: 'Updated Policy',
        description: 'Updated description'
      } as CreatePolicyRequest;
      const updateParams = {id: '1', data: mockPolicyRequest};
      const mockPolicy: Policy = {
        id: '1',
        name: 'Updated Policy'
      } as Policy;
      const mockResponse = {data: mockPolicy};

      (PolicyAPI.updatePolicy as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useUpdatePolicy(), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(updateParams)).resolves.not.toThrow();
    });
  });

  describe('useDeletePolicy', () => {
    it('calls PolicyAPI.deletePolicy with correct id', async () => {
      const mockResponse = {data: {success: true} as unknown as Policy};

      (PolicyAPI.deletePolicy as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useDeletePolicy({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync('1');

      expect(PolicyAPI.deletePolicy).toHaveBeenCalledWith('1');
    });

    it('calls onSuccess callback when policy deletion succeeds', async () => {
      const mockResponse = {data: {success: true} as unknown as Policy};
      const onSuccess = vi.fn();

      (PolicyAPI.deletePolicy as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useDeletePolicy({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync('1');

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates policies and policies total count queries on success', async () => {
      const mockResponse = {data: {success: true} as unknown as Policy};

      (PolicyAPI.deletePolicy as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useDeletePolicy({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync('1');

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-policies']});
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-policies-total-count']});
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
    });

    it('calls onError callback when policy deletion fails', async () => {
      const onError = vi.fn();

      (PolicyAPI.deletePolicy as Mock).mockRejectedValue(new Error('Deletion failed'));

      const {result} = renderHook(() => useDeletePolicy({callbacks: {onError}}), {
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
      const mockResponse = {data: {success: true} as unknown as Policy};

      (PolicyAPI.deletePolicy as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useDeletePolicy(), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync('1')).resolves.not.toThrow();
    });
  });

  describe('useCreateRule', () => {
    it('calls PolicyAPI.createRule with correct parameters', async () => {
      const mockRuleRequest: CreateRuleBody = {
        name: 'Test Rule',
        condition: 'test condition'
      } as CreateRuleBody;
      const createParams = {id: 'policy-1', data: mockRuleRequest};
      const mockRule: Rule = {
        id: '1',
        name: 'Test Rule'
      } as Rule;
      const mockResponse = {data: mockRule};

      (PolicyAPI.createRule as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useCreateRule({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(createParams);

      expect(PolicyAPI.createRule).toHaveBeenCalledWith('policy-1', mockRuleRequest);
    });

    it('calls onSuccess callback when rule creation succeeds', async () => {
      const mockRuleRequest: CreateRuleBody = {
        name: 'Test Rule',
        condition: 'test condition'
      } as CreateRuleBody;
      const createParams = {id: 'policy-1', data: mockRuleRequest};
      const mockRule: Rule = {
        id: '1',
        name: 'Test Rule'
      } as Rule;
      const mockResponse = {data: mockRule};
      const onSuccess = vi.fn();

      (PolicyAPI.createRule as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useCreateRule({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(createParams);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates multiple policy-related queries on success', async () => {
      const mockRuleRequest: CreateRuleBody = {
        name: 'Test Rule',
        condition: 'test condition'
      } as CreateRuleBody;
      const createParams = {id: 'policy-1', data: mockRuleRequest};
      const mockRule: Rule = {
        id: '1',
        name: 'Test Rule'
      } as Rule;
      const mockResponse = {data: mockRule};

      (PolicyAPI.createRule as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useCreateRule({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync(createParams);

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-policies']});
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-policy']});
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-policy-rules']});
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(3);
    });

    it('calls onError callback when rule creation fails', async () => {
      const mockRuleRequest: CreateRuleBody = {
        name: 'Test Rule',
        condition: 'test condition'
      } as CreateRuleBody;
      const createParams = {id: 'policy-1', data: mockRuleRequest};
      const onError = vi.fn();

      (PolicyAPI.createRule as Mock).mockRejectedValue(new Error('Creation failed'));

      const {result} = renderHook(() => useCreateRule({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(createParams);
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });

    it('works with default empty callbacks parameter', async () => {
      const mockRuleRequest: CreateRuleBody = {
        name: 'Test Rule',
        condition: 'test condition'
      } as CreateRuleBody;
      const createParams = {id: 'policy-1', data: mockRuleRequest};
      const mockRule: Rule = {
        id: '1',
        name: 'Test Rule'
      } as Rule;
      const mockResponse = {data: mockRule};

      (PolicyAPI.createRule as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useCreateRule(), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(createParams)).resolves.not.toThrow();
    });
  });

  describe('useUpdateRule', () => {
    it('calls PolicyAPI.updateRule with correct parameters', async () => {
      const mockRuleRequest: CreateRuleBody = {
        name: 'Updated Rule',
        condition: 'updated condition'
      } as CreateRuleBody;
      const updateParams = {policyId: 'policy-1', ruleId: 'rule-1', data: mockRuleRequest};
      const mockRule: Rule = {
        id: 'rule-1',
        name: 'Updated Rule'
      } as Rule;
      const mockResponse = {data: mockRule};

      (PolicyAPI.updateRule as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useUpdateRule({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(updateParams);

      expect(PolicyAPI.updateRule).toHaveBeenCalledWith('policy-1', 'rule-1', mockRuleRequest);
    });

    it('calls onSuccess callback when rule update succeeds', async () => {
      const mockRuleRequest: CreateRuleBody = {
        name: 'Updated Rule',
        condition: 'updated condition'
      } as CreateRuleBody;
      const updateParams = {policyId: 'policy-1', ruleId: 'rule-1', data: mockRuleRequest};
      const mockRule: Rule = {
        id: 'rule-1',
        name: 'Updated Rule'
      } as Rule;
      const mockResponse = {data: mockRule};
      const onSuccess = vi.fn();

      (PolicyAPI.updateRule as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useUpdateRule({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(updateParams);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates all policy-related queries including rule query on success', async () => {
      const mockRuleRequest: CreateRuleBody = {
        name: 'Updated Rule',
        condition: 'updated condition'
      } as CreateRuleBody;
      const updateParams = {policyId: 'policy-1', ruleId: 'rule-1', data: mockRuleRequest};
      const mockRule: Rule = {
        id: 'rule-1',
        name: 'Updated Rule'
      } as Rule;
      const mockResponse = {data: mockRule};

      (PolicyAPI.updateRule as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useUpdateRule({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync(updateParams);

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-policies']});
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-policy']});
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-policy-rules']});
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-rule']});
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(4);
    });

    it('calls onError callback when rule update fails', async () => {
      const mockRuleRequest: CreateRuleBody = {
        name: 'Updated Rule',
        condition: 'updated condition'
      } as CreateRuleBody;
      const updateParams = {policyId: 'policy-1', ruleId: 'rule-1', data: mockRuleRequest};
      const onError = vi.fn();

      (PolicyAPI.updateRule as Mock).mockRejectedValue(new Error('Update failed'));

      const {result} = renderHook(() => useUpdateRule({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(updateParams);
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });

    it('works with default empty callbacks parameter', async () => {
      const mockRuleRequest: CreateRuleBody = {
        name: 'Updated Rule',
        condition: 'updated condition'
      } as CreateRuleBody;
      const updateParams = {policyId: 'policy-1', ruleId: 'rule-1', data: mockRuleRequest};
      const mockRule: Rule = {
        id: 'rule-1',
        name: 'Updated Rule'
      } as Rule;
      const mockResponse = {data: mockRule};

      (PolicyAPI.updateRule as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useUpdateRule(), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(updateParams)).resolves.not.toThrow();
    });
  });

  describe('useDeleteRule', () => {
    it('calls PolicyAPI.deleteRule with correct parameters', async () => {
      const deleteParams = {policyId: 'policy-1', ruleId: 'rule-1'};
      const mockResponse = {data: {success: true} as any};

      (PolicyAPI.deleteRule as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useDeleteRule({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(deleteParams);

      expect(PolicyAPI.deleteRule).toHaveBeenCalledWith('policy-1', 'rule-1');
    });

    it('calls onSuccess callback when rule deletion succeeds', async () => {
      const deleteParams = {policyId: 'policy-1', ruleId: 'rule-1'};
      const mockResponse = {data: {success: true} as any};
      const onSuccess = vi.fn();

      (PolicyAPI.deleteRule as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useDeleteRule({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(deleteParams);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates all policy-related queries including rule query on success', async () => {
      const deleteParams = {policyId: 'policy-1', ruleId: 'rule-1'};
      const mockResponse = {data: {success: true} as any};

      (PolicyAPI.deleteRule as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useDeleteRule({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync(deleteParams);

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-policies']});
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-policy']});
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-policy-rules']});
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-rule']});
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(4);
    });

    it('calls onError callback when rule deletion fails', async () => {
      const deleteParams = {policyId: 'policy-1', ruleId: 'rule-1'};
      const onError = vi.fn();

      (PolicyAPI.deleteRule as Mock).mockRejectedValue(new Error('Deletion failed'));

      const {result} = renderHook(() => useDeleteRule({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(deleteParams);
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });

    it('works with default empty callbacks parameter', async () => {
      const deleteParams = {policyId: 'policy-1', ruleId: 'rule-1'};
      const mockResponse = {data: {success: true} as any};

      (PolicyAPI.deleteRule as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useDeleteRule(), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(deleteParams)).resolves.not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('handles network errors for create policy', async () => {
      const mockPolicyRequest: CreatePolicyRequest = {
        name: 'Test Policy',
        description: 'Test description'
      } as CreatePolicyRequest;
      const onError = vi.fn();

      (PolicyAPI.createPolicy as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useCreatePolicy({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(mockPolicyRequest);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network Error');
      }

      expect(onError).toHaveBeenCalled();
    });

    it('handles network errors for update policy', async () => {
      const mockPolicyRequest: CreatePolicyRequest = {
        name: 'Updated Policy',
        description: 'Updated description'
      } as CreatePolicyRequest;
      const updateParams = {id: '1', data: mockPolicyRequest};
      const onError = vi.fn();

      (PolicyAPI.updatePolicy as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useUpdatePolicy({callbacks: {onError}}), {
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

    it('handles network errors for delete policy', async () => {
      const onError = vi.fn();

      (PolicyAPI.deletePolicy as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useDeletePolicy({callbacks: {onError}}), {
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

    it('handles network errors for create rule', async () => {
      const mockRuleRequest: CreateRuleBody = {
        name: 'Test Rule',
        condition: 'test condition'
      } as CreateRuleBody;
      const createParams = {id: 'policy-1', data: mockRuleRequest};
      const onError = vi.fn();

      (PolicyAPI.createRule as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useCreateRule({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(createParams);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network Error');
      }

      expect(onError).toHaveBeenCalled();
    });

    it('handles network errors for update rule', async () => {
      const mockRuleRequest: CreateRuleBody = {
        name: 'Updated Rule',
        condition: 'updated condition'
      } as CreateRuleBody;
      const updateParams = {policyId: 'policy-1', ruleId: 'rule-1', data: mockRuleRequest};
      const onError = vi.fn();

      (PolicyAPI.updateRule as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useUpdateRule({callbacks: {onError}}), {
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

    it('handles network errors for delete rule', async () => {
      const deleteParams = {policyId: 'policy-1', ruleId: 'rule-1'};
      const onError = vi.fn();

      (PolicyAPI.deleteRule as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useDeleteRule({callbacks: {onError}}), {
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
      const mockPolicyRequest: CreatePolicyRequest = {
        name: 'Test Policy',
        description: 'Test description'
      } as CreatePolicyRequest;
      const mockPolicy: Policy = {
        id: '1',
        name: 'Test Policy'
      } as Policy;
      const mockRule: Rule = {
        id: '1',
        name: 'Test Rule'
      } as Rule;
      const mockPolicyResponse = {data: mockPolicy};
      const mockRuleResponse = {data: mockRule};
      const mockRuleRequest: CreateRuleBody = {
        name: 'Test Rule',
        condition: 'test condition'
      } as CreateRuleBody;

      (PolicyAPI.createPolicy as Mock).mockResolvedValue(mockPolicyResponse);
      (PolicyAPI.updatePolicy as Mock).mockResolvedValue(mockPolicyResponse);
      (PolicyAPI.deletePolicy as Mock).mockResolvedValue(mockPolicyResponse);
      (PolicyAPI.createRule as Mock).mockResolvedValue(mockRuleResponse);
      (PolicyAPI.updateRule as Mock).mockResolvedValue(mockRuleResponse);
      (PolicyAPI.deleteRule as Mock).mockResolvedValue(mockRuleResponse);

      const {result: createPolicyResult} = renderHook(() => useCreatePolicy({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      const {result: updatePolicyResult} = renderHook(() => useUpdatePolicy({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      const {result: deletePolicyResult} = renderHook(() => useDeletePolicy({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      const {result: createRuleResult} = renderHook(() => useCreateRule({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      const {result: updateRuleResult} = renderHook(() => useUpdateRule({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      const {result: deleteRuleResult} = renderHook(() => useDeleteRule({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(createPolicyResult.current.mutateAsync(mockPolicyRequest)).resolves.not.toThrow();
      await expect(updatePolicyResult.current.mutateAsync({id: '1', data: mockPolicyRequest})).resolves.not.toThrow();
      await expect(deletePolicyResult.current.mutateAsync('1')).resolves.not.toThrow();
      await expect(createRuleResult.current.mutateAsync({id: 'policy-1', data: mockRuleRequest})).resolves.not.toThrow();
      await expect(
        updateRuleResult.current.mutateAsync({policyId: 'policy-1', ruleId: 'rule-1', data: mockRuleRequest})
      ).resolves.not.toThrow();
      await expect(deleteRuleResult.current.mutateAsync({policyId: 'policy-1', ruleId: 'rule-1'})).resolves.not.toThrow();
    });

    it('handles partial callbacks - only onSuccess for all mutations', async () => {
      const mockPolicyRequest: CreatePolicyRequest = {
        name: 'Test Policy',
        description: 'Test description'
      } as CreatePolicyRequest;
      const mockPolicy: Policy = {
        id: '1',
        name: 'Test Policy'
      } as Policy;
      const mockRule: Rule = {
        id: '1',
        name: 'Test Rule'
      } as Rule;
      const mockPolicyResponse = {data: mockPolicy};
      const mockRuleResponse = {data: mockRule};
      const mockRuleRequest: CreateRuleBody = {
        name: 'Test Rule',
        condition: 'test condition'
      } as CreateRuleBody;
      const onSuccess = vi.fn();

      (PolicyAPI.createPolicy as Mock).mockResolvedValue(mockPolicyResponse);
      (PolicyAPI.updatePolicy as Mock).mockResolvedValue(mockPolicyResponse);
      (PolicyAPI.deletePolicy as Mock).mockResolvedValue(mockPolicyResponse);
      (PolicyAPI.createRule as Mock).mockResolvedValue(mockRuleResponse);
      (PolicyAPI.updateRule as Mock).mockResolvedValue(mockRuleResponse);
      (PolicyAPI.deleteRule as Mock).mockResolvedValue(mockRuleResponse);

      const {result: createPolicyResult} = renderHook(() => useCreatePolicy({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      const {result: updatePolicyResult} = renderHook(() => useUpdatePolicy({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      const {result: deletePolicyResult} = renderHook(() => useDeletePolicy({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      const {result: createRuleResult} = renderHook(() => useCreateRule({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      const {result: updateRuleResult} = renderHook(() => useUpdateRule({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      const {result: deleteRuleResult} = renderHook(() => useDeleteRule({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await createPolicyResult.current.mutateAsync(mockPolicyRequest);
      await updatePolicyResult.current.mutateAsync({id: '1', data: mockPolicyRequest});
      await deletePolicyResult.current.mutateAsync('1');
      await createRuleResult.current.mutateAsync({id: 'policy-1', data: mockRuleRequest});
      await updateRuleResult.current.mutateAsync({policyId: 'policy-1', ruleId: 'rule-1', data: mockRuleRequest});
      await deleteRuleResult.current.mutateAsync({policyId: 'policy-1', ruleId: 'rule-1'});

      expect(onSuccess).toHaveBeenCalledTimes(6);
    });
  });
});
