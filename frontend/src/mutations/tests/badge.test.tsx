/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable react/display-name */
import {describe, it, expect, vi, beforeEach, Mock} from 'vitest';
import {renderHook} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Badge, IssueBadgeBody, VerificationResult, VerifyBadgeRequest} from '@/types/api/badge';
import React from 'react';
import {useVerifyBadge, useIssueBadge} from '../';

// Mock the API module
vi.mock('@/api/services/badge-api', () => ({
  BadgeAPI: {
    verifyBadge: vi.fn(),
    issueBadge: vi.fn()
  }
}));

// Import the mocked API to access it in tests
import {BadgeAPI} from '@/api/services/badge-api';

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

describe('badge mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useVerifyBadge', () => {
    it('calls BadgeAPI.verifyBadge with correct data', async () => {
      const mockVerifyRequest: VerifyBadgeRequest = {
        badgeId: 'badge-123',
        signature: 'test-signature'
      } as VerifyBadgeRequest;
      const mockResponse = {data: {isValid: true} as VerificationResult};

      (BadgeAPI.verifyBadge as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useVerifyBadge({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(mockVerifyRequest);

      expect(BadgeAPI.verifyBadge).toHaveBeenCalledWith(mockVerifyRequest);
    });

    it('calls onSuccess callback when verification succeeds', async () => {
      const mockVerifyRequest: VerifyBadgeRequest = {
        badgeId: 'badge-123',
        signature: 'test-signature'
      } as VerifyBadgeRequest;
      const mockResponse = {data: {isValid: true} as VerificationResult};
      const onSuccess = vi.fn();

      (BadgeAPI.verifyBadge as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useVerifyBadge({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(mockVerifyRequest);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('calls onError callback when verification fails', async () => {
      const mockVerifyRequest: VerifyBadgeRequest = {
        badgeId: 'badge-123',
        signature: 'test-signature'
      } as VerifyBadgeRequest;
      const onError = vi.fn();

      (BadgeAPI.verifyBadge as Mock).mockRejectedValue(new Error('Verification failed'));

      const {result} = renderHook(() => useVerifyBadge({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(mockVerifyRequest);
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });

    it('works without callbacks', async () => {
      const mockVerifyRequest: VerifyBadgeRequest = {
        badgeId: 'badge-123',
        signature: 'test-signature'
      } as VerifyBadgeRequest;
      const mockResponse = {data: {isValid: true} as VerificationResult};

      (BadgeAPI.verifyBadge as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useVerifyBadge({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(mockVerifyRequest)).resolves.not.toThrow();
    });

    it('handles undefined callbacks gracefully', async () => {
      const mockVerifyRequest: VerifyBadgeRequest = {
        badgeId: 'badge-123',
        signature: 'test-signature'
      } as VerifyBadgeRequest;
      const mockResponse = {data: {isValid: false} as VerificationResult};

      (BadgeAPI.verifyBadge as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useVerifyBadge({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(mockVerifyRequest)).resolves.not.toThrow();
    });

    it('handles partial callbacks - only onSuccess', async () => {
      const mockVerifyRequest: VerifyBadgeRequest = {
        badgeId: 'badge-123',
        signature: 'test-signature'
      } as VerifyBadgeRequest;
      const mockResponse = {data: {isValid: true} as VerificationResult};
      const onSuccess = vi.fn();

      (BadgeAPI.verifyBadge as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useVerifyBadge({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(mockVerifyRequest);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('handles partial callbacks - only onError', async () => {
      const mockVerifyRequest: VerifyBadgeRequest = {
        badgeId: 'badge-123',
        signature: 'test-signature'
      } as VerifyBadgeRequest;
      const onError = vi.fn();

      (BadgeAPI.verifyBadge as Mock).mockRejectedValue(new Error('API Error'));

      const {result} = renderHook(() => useVerifyBadge({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(mockVerifyRequest);
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('useIssueBadge', () => {
    it('calls BadgeAPI.issueBadge with correct parameters', async () => {
      const mockBadgeData: IssueBadgeBody = {
        recipientId: 'user-123',
        badgeType: 'achievement'
      } as IssueBadgeBody;
      const issueParams = {id: 'badge-123', data: mockBadgeData};
      const mockResponse = {data: {id: 'issued-badge-456'} as Badge};

      (BadgeAPI.issueBadge as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useIssueBadge({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(issueParams);

      expect(BadgeAPI.issueBadge).toHaveBeenCalledWith('badge-123', mockBadgeData);
    });

    it('calls onSuccess callback when badge issuance succeeds', async () => {
      const mockBadgeData: IssueBadgeBody = {
        recipientId: 'user-123',
        badgeType: 'achievement'
      } as IssueBadgeBody;
      const issueParams = {id: 'badge-123', data: mockBadgeData};
      const mockResponse = {data: {id: 'issued-badge-456'} as Badge};
      const onSuccess = vi.fn();

      (BadgeAPI.issueBadge as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useIssueBadge({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(issueParams);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates agentic service badge queries on success', async () => {
      const mockBadgeData: IssueBadgeBody = {
        recipientId: 'user-123',
        badgeType: 'achievement'
      } as IssueBadgeBody;
      const issueParams = {id: 'badge-123', data: mockBadgeData};
      const mockResponse = {data: {id: 'issued-badge-456'} as Badge};

      (BadgeAPI.issueBadge as Mock).mockResolvedValue(mockResponse);

      // Create a query client with a spy on invalidateQueries
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

      const {result} = renderHook(() => useIssueBadge({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync(issueParams);

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-agentic-service-badge']});
    });

    it('calls onError callback when badge issuance fails', async () => {
      const mockBadgeData: IssueBadgeBody = {
        recipientId: 'user-123',
        badgeType: 'achievement'
      } as IssueBadgeBody;
      const issueParams = {id: 'badge-123', data: mockBadgeData};
      const onError = vi.fn();

      (BadgeAPI.issueBadge as Mock).mockRejectedValue(new Error('Issuance failed'));

      const {result} = renderHook(() => useIssueBadge({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(issueParams);
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });

    it('works without callbacks', async () => {
      const mockBadgeData: IssueBadgeBody = {
        recipientId: 'user-123',
        badgeType: 'achievement'
      } as IssueBadgeBody;
      const issueParams = {id: 'badge-123', data: mockBadgeData};
      const mockResponse = {data: {id: 'issued-badge-456'} as Badge};

      (BadgeAPI.issueBadge as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useIssueBadge({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(issueParams)).resolves.not.toThrow();
    });

    it('handles undefined callbacks gracefully', async () => {
      const mockBadgeData: IssueBadgeBody = {
        recipientId: 'user-123',
        badgeType: 'achievement'
      } as IssueBadgeBody;
      const issueParams = {id: 'badge-123', data: mockBadgeData};
      const mockResponse = {data: {id: 'issued-badge-456'} as Badge};

      (BadgeAPI.issueBadge as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useIssueBadge({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(issueParams)).resolves.not.toThrow();
    });

    it('handles partial callbacks - only onSuccess', async () => {
      const mockBadgeData: IssueBadgeBody = {
        recipientId: 'user-123',
        badgeType: 'achievement'
      } as IssueBadgeBody;
      const issueParams = {id: 'badge-123', data: mockBadgeData};
      const mockResponse = {data: {id: 'issued-badge-456'} as Badge};
      const onSuccess = vi.fn();

      (BadgeAPI.issueBadge as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useIssueBadge({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(issueParams);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('handles partial callbacks - only onError', async () => {
      const mockBadgeData: IssueBadgeBody = {
        recipientId: 'user-123',
        badgeType: 'achievement'
      } as IssueBadgeBody;
      const issueParams = {id: 'badge-123', data: mockBadgeData};
      const onError = vi.fn();

      (BadgeAPI.issueBadge as Mock).mockRejectedValue(new Error('API Error'));

      const {result} = renderHook(() => useIssueBadge({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(issueParams);
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('handles network errors for verify badge', async () => {
      const mockVerifyRequest: VerifyBadgeRequest = {
        badgeId: 'badge-123',
        signature: 'test-signature'
      } as VerifyBadgeRequest;
      const onError = vi.fn();

      (BadgeAPI.verifyBadge as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useVerifyBadge({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(mockVerifyRequest);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network Error');
      }

      expect(onError).toHaveBeenCalled();
    });

    it('handles network errors for issue badge', async () => {
      const mockBadgeData: IssueBadgeBody = {
        recipientId: 'user-123',
        badgeType: 'achievement'
      } as IssueBadgeBody;
      const issueParams = {id: 'badge-123', data: mockBadgeData};
      const onError = vi.fn();

      (BadgeAPI.issueBadge as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useIssueBadge({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(issueParams);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network Error');
      }

      expect(onError).toHaveBeenCalled();
    });
  });
});
