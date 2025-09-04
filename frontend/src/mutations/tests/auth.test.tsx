/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable react/display-name */
import {describe, it, expect, vi, beforeEach, Mock} from 'vitest';
import {renderHook} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ApproveTokenRequest} from '@/types/api/auth';
import React from 'react';
import {useAproveToken} from '../';

// Mock the API module
vi.mock('@/api/services', () => ({
  AuthAPI: {
    approveToken: vi.fn()
  }
}));

// Import the mocked API to access it in tests
import {AuthAPI} from '@/api/services';

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

describe('auth mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAproveToken', () => {
    it('calls AuthAPI.approveToken with correct data', async () => {
      const mockTokenRequest: ApproveTokenRequest = {
        token: 'test-token',
        userId: '123'
      } as ApproveTokenRequest;
      const mockResponse = {data: {success: true}};

      (AuthAPI.approveToken as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useAproveToken({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(mockTokenRequest);

      expect(AuthAPI.approveToken).toHaveBeenCalledWith(mockTokenRequest);
    });

    it('calls onSuccess callback when mutation succeeds', async () => {
      const mockTokenRequest: ApproveTokenRequest = {
        token: 'test-token',
        userId: '123'
      } as ApproveTokenRequest;
      const mockResponse = {data: {success: true}};
      const onSuccess = vi.fn();

      (AuthAPI.approveToken as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useAproveToken({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(mockTokenRequest);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('calls onError callback when mutation fails', async () => {
      const mockTokenRequest: ApproveTokenRequest = {
        token: 'test-token',
        userId: '123'
      } as ApproveTokenRequest;
      const onError = vi.fn();

      (AuthAPI.approveToken as Mock).mockRejectedValue(new Error('API Error'));

      const {result} = renderHook(() => useAproveToken({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(mockTokenRequest);
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });

    it('works without callbacks', async () => {
      const mockTokenRequest: ApproveTokenRequest = {
        token: 'test-token',
        userId: '123'
      } as ApproveTokenRequest;
      const mockResponse = {data: {success: true}};

      (AuthAPI.approveToken as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useAproveToken({}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(mockTokenRequest)).resolves.not.toThrow();
    });

    it('works with default empty callbacks parameter', async () => {
      const mockTokenRequest: ApproveTokenRequest = {
        token: 'test-token',
        userId: '123'
      } as ApproveTokenRequest;
      const mockResponse = {data: {success: true}};

      (AuthAPI.approveToken as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useAproveToken({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(mockTokenRequest)).resolves.not.toThrow();
    });

    it('handles undefined callbacks gracefully', async () => {
      const mockTokenRequest: ApproveTokenRequest = {
        token: 'test-token',
        userId: '123'
      } as ApproveTokenRequest;
      const mockResponse = {data: {success: true}};

      (AuthAPI.approveToken as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useAproveToken({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(mockTokenRequest)).resolves.not.toThrow();
    });

    it('handles partial callbacks - only onSuccess', async () => {
      const mockTokenRequest: ApproveTokenRequest = {
        token: 'test-token',
        userId: '123'
      } as ApproveTokenRequest;
      const mockResponse = {data: {success: true}};
      const onSuccess = vi.fn();

      (AuthAPI.approveToken as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useAproveToken({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(mockTokenRequest);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('handles partial callbacks - only onError', async () => {
      const mockTokenRequest: ApproveTokenRequest = {
        token: 'test-token',
        userId: '123'
      } as ApproveTokenRequest;
      const onError = vi.fn();

      (AuthAPI.approveToken as Mock).mockRejectedValue(new Error('API Error'));

      const {result} = renderHook(() => useAproveToken({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(mockTokenRequest);
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });

    it('returns mutation with correct properties', () => {
      const {result} = renderHook(() => useAproveToken({callbacks: {}}), {
        wrapper: createWrapper()
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
      expect(result.current.isError).toBeDefined();
      expect(result.current.isSuccess).toBeDefined();
    });

    it('handles network errors', async () => {
      const mockTokenRequest: ApproveTokenRequest = {
        token: 'test-token',
        userId: '123'
      } as ApproveTokenRequest;
      const onError = vi.fn();

      (AuthAPI.approveToken as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useAproveToken({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(mockTokenRequest);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network Error');
      }

      expect(onError).toHaveBeenCalled();
    });
  });
});
