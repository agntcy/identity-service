/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable react/display-name */
import {describe, it, expect, vi, beforeEach, type Mock} from 'vitest';
import {renderHook} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {useSetApiKey, useSetIdentityProvider} from '../';
import {SettingsAPI} from '@/api/services';
import {
  V1Alpha1ApiKey,
  V1Alpha1IssuerSettings,
  V1Alpha1SetIssuerRequest
} from '@/api/generated/identity/settings_service.swagger.api';
import React from 'react';

// Mock the API module
vi.mock('@/api/services', () => ({
  SettingsAPI: {
    settingsServiceSetApiKey: vi.fn(),
    setUpIssuer: vi.fn()
  }
}));

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

describe('settings mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSetApiKey', () => {
    it('calls SettingsAPI.settingsServiceSetApiKey with no parameters', async () => {
      const mockApiKey: V1Alpha1ApiKey = {
        apiKey: 'test-api-key-123'
      };
      const mockResponse = {data: mockApiKey};

      (SettingsAPI.settingsServiceSetApiKey as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useSetApiKey({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync();

      expect(SettingsAPI.settingsServiceSetApiKey).toHaveBeenCalledWith();
    });

    it('calls onSuccess callback when API key creation succeeds', async () => {
      const mockApiKey: V1Alpha1ApiKey = {
        apiKey: 'test-api-key-123'
      };
      const mockResponse = {data: mockApiKey};
      const onSuccess = vi.fn();

      (SettingsAPI.settingsServiceSetApiKey as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useSetApiKey({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync();

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates get-settings queries on success', async () => {
      const mockApiKey: V1Alpha1ApiKey = {
        apiKey: 'test-api-key-123'
      };
      const mockResponse = {data: mockApiKey};

      (SettingsAPI.settingsServiceSetApiKey as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useSetApiKey({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync();

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-settings']});
    });

    it('calls onError callback when API key creation fails', async () => {
      const onError = vi.fn();
      const error = new Error('API key creation failed');

      (SettingsAPI.settingsServiceSetApiKey as Mock).mockRejectedValue(error);

      const {result} = renderHook(() => useSetApiKey({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync()).rejects.toThrow('API key creation failed');
      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('works without callbacks', async () => {
      const mockApiKey: V1Alpha1ApiKey = {
        apiKey: 'test-api-key-123'
      };
      const mockResponse = {data: mockApiKey};

      (SettingsAPI.settingsServiceSetApiKey as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useSetApiKey({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync()).resolves.toEqual(mockResponse);
    });

    it('handles empty API key response', async () => {
      const mockApiKey: V1Alpha1ApiKey = {};
      const mockResponse = {data: mockApiKey};

      (SettingsAPI.settingsServiceSetApiKey as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useSetApiKey({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync()).resolves.toEqual(mockResponse);
    });
  });

  describe('useSetIdentityProvider', () => {
    it('calls SettingsAPI.setUpIssuer with correct parameters', async () => {
      const mockSetIssuerRequest: V1Alpha1SetIssuerRequest = {
        issuerSettings: {
          issuerId: 'test-issuer-id',
          keyId: 'test-key-id'
        }
      };
      const mockIssuerSettings: V1Alpha1IssuerSettings = {
        issuerId: 'test-issuer-id',
        keyId: 'test-key-id'
      };
      const mockResponse = {data: mockIssuerSettings};

      (SettingsAPI.setUpIssuer as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useSetIdentityProvider({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(mockSetIssuerRequest);

      expect(SettingsAPI.setUpIssuer).toHaveBeenCalledWith(mockSetIssuerRequest);
    });

    it('calls onSuccess callback when identity provider setup succeeds', async () => {
      const mockSetIssuerRequest: V1Alpha1SetIssuerRequest = {
        issuerSettings: {
          issuerId: 'test-issuer-id',
          keyId: 'test-key-id'
        }
      };
      const mockIssuerSettings: V1Alpha1IssuerSettings = {
        issuerId: 'test-issuer-id',
        keyId: 'test-key-id'
      };
      const mockResponse = {data: mockIssuerSettings};
      const onSuccess = vi.fn();

      (SettingsAPI.setUpIssuer as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useSetIdentityProvider({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(mockSetIssuerRequest);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates get-settings queries on success', async () => {
      const mockSetIssuerRequest: V1Alpha1SetIssuerRequest = {
        issuerSettings: {
          issuerId: 'test-issuer-id',
          keyId: 'test-key-id'
        }
      };
      const mockIssuerSettings: V1Alpha1IssuerSettings = {
        issuerId: 'test-issuer-id',
        keyId: 'test-key-id'
      };
      const mockResponse = {data: mockIssuerSettings};

      (SettingsAPI.setUpIssuer as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useSetIdentityProvider({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync(mockSetIssuerRequest);

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-settings']});
    });

    it('calls onError callback when identity provider setup fails', async () => {
      const mockSetIssuerRequest: V1Alpha1SetIssuerRequest = {
        issuerSettings: {
          issuerId: 'test-issuer-id',
          keyId: 'test-key-id'
        }
      };
      const onError = vi.fn();
      const error = new Error('Identity provider setup failed');

      (SettingsAPI.setUpIssuer as Mock).mockRejectedValue(error);

      const {result} = renderHook(() => useSetIdentityProvider({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(mockSetIssuerRequest)).rejects.toThrow('Identity provider setup failed');
      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('works without callbacks', async () => {
      const mockSetIssuerRequest: V1Alpha1SetIssuerRequest = {
        issuerSettings: {
          issuerId: 'test-issuer-id',
          keyId: 'test-key-id'
        }
      };
      const mockIssuerSettings: V1Alpha1IssuerSettings = {
        issuerId: 'test-issuer-id',
        keyId: 'test-key-id'
      };
      const mockResponse = {data: mockIssuerSettings};

      (SettingsAPI.setUpIssuer as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useSetIdentityProvider({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(mockSetIssuerRequest)).resolves.toEqual(mockResponse);
    });

    it('handles empty issuer settings request', async () => {
      const mockSetIssuerRequest: V1Alpha1SetIssuerRequest = {
        issuerSettings: {}
      };
      const mockIssuerSettings: V1Alpha1IssuerSettings = {};
      const mockResponse = {data: mockIssuerSettings};

      (SettingsAPI.setUpIssuer as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useSetIdentityProvider({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(mockSetIssuerRequest)).resolves.toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    it('handles network errors for set API key', async () => {
      const onError = vi.fn();
      const error = new Error('Network error');
      (SettingsAPI.settingsServiceSetApiKey as Mock).mockRejectedValue(error);

      const {result} = renderHook(() => useSetApiKey({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync()).rejects.toThrow('Network error');
      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('handles network errors for set identity provider', async () => {
      const mockSetIssuerRequest: V1Alpha1SetIssuerRequest = {
        issuerSettings: {
          issuerId: 'test-issuer-id',
          keyId: 'test-key-id'
        }
      };
      const onError = vi.fn();
      const error = new Error('Network error');
      (SettingsAPI.setUpIssuer as Mock).mockRejectedValue(error);

      const {result} = renderHook(() => useSetIdentityProvider({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(mockSetIssuerRequest)).rejects.toThrow('Network error');
      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('handles malformed request data gracefully', async () => {
      const malformedRequest = {} as V1Alpha1SetIssuerRequest;
      const onError = vi.fn();
      const error = new Error('Invalid request data');

      (SettingsAPI.setUpIssuer as Mock).mockRejectedValue(error);

      const {result} = renderHook(() => useSetIdentityProvider({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(malformedRequest)).rejects.toThrow('Invalid request data');
      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe('callback handling', () => {
    it('handles undefined callbacks gracefully for both mutations', async () => {
      const mockApiKey: V1Alpha1ApiKey = {
        apiKey: 'test-api-key-123'
      };
      const mockSetIssuerRequest: V1Alpha1SetIssuerRequest = {
        issuerSettings: {
          issuerId: 'test-issuer-id',
          keyId: 'test-key-id'
        }
      };
      const mockIssuerSettings: V1Alpha1IssuerSettings = {
        issuerId: 'test-issuer-id',
        keyId: 'test-key-id'
      };

      (SettingsAPI.settingsServiceSetApiKey as Mock).mockResolvedValue({data: mockApiKey});
      (SettingsAPI.setUpIssuer as Mock).mockResolvedValue({data: mockIssuerSettings});

      const {result: result1} = renderHook(() => useSetApiKey({callbacks: undefined}), {
        wrapper: createWrapper()
      });
      const {result: result2} = renderHook(() => useSetIdentityProvider({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(result1.current.mutateAsync()).resolves.toEqual({data: mockApiKey});
      await expect(result2.current.mutateAsync(mockSetIssuerRequest)).resolves.toEqual({data: mockIssuerSettings});
    });

    it('handles partial callbacks - only onSuccess for both mutations', async () => {
      const mockApiKey: V1Alpha1ApiKey = {
        apiKey: 'test-api-key-123'
      };
      const mockSetIssuerRequest: V1Alpha1SetIssuerRequest = {
        issuerSettings: {
          issuerId: 'test-issuer-id',
          keyId: 'test-key-id'
        }
      };
      const mockIssuerSettings: V1Alpha1IssuerSettings = {
        issuerId: 'test-issuer-id',
        keyId: 'test-key-id'
      };

      const onSuccess1 = vi.fn();
      const onSuccess2 = vi.fn();

      (SettingsAPI.settingsServiceSetApiKey as Mock).mockResolvedValue({data: mockApiKey});
      (SettingsAPI.setUpIssuer as Mock).mockResolvedValue({data: mockIssuerSettings});

      const {result: result1} = renderHook(() => useSetApiKey({callbacks: {onSuccess: onSuccess1}}), {
        wrapper: createWrapper()
      });
      const {result: result2} = renderHook(() => useSetIdentityProvider({callbacks: {onSuccess: onSuccess2}}), {
        wrapper: createWrapper()
      });

      await result1.current.mutateAsync();
      await result2.current.mutateAsync(mockSetIssuerRequest);

      expect(onSuccess1).toHaveBeenCalledWith({data: mockApiKey});
      expect(onSuccess2).toHaveBeenCalledWith({data: mockIssuerSettings});
    });
  });
});
