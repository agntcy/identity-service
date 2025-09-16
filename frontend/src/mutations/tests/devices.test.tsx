/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable react/display-name */
import {describe, it, expect, vi, beforeEach, Mock} from 'vitest';
import {renderHook} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Device} from '@/types/api/device';
import React from 'react';
import {useAddDevice, useRegisterDevice, useDeleteDevice, useTestDevice} from '../';

// Mock the API module
vi.mock('@/api/services', () => ({
  DevicesAPI: {
    addDevice: vi.fn(),
    registerDevice: vi.fn(),
    deleteDevice: vi.fn(),
    testDevice: vi.fn()
  }
}));

// Import the mocked API to access it in tests
import {DevicesAPI} from '@/api/services';

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

describe('devices mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAddDevice', () => {
    it('calls DevicesAPI.addDevice with correct data', async () => {
      const mockDevice: Device = {
        id: '1',
        name: 'Test Device',
        type: 'sensor'
      } as Device;
      const mockResponse = {data: mockDevice};

      (DevicesAPI.addDevice as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useAddDevice({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(mockDevice);

      expect(DevicesAPI.addDevice).toHaveBeenCalledWith(mockDevice);
    });

    it('calls onSuccess callback when device addition succeeds', async () => {
      const mockDevice: Device = {
        id: '1',
        name: 'Test Device',
        type: 'sensor'
      } as Device;
      const mockResponse = {data: mockDevice};
      const onSuccess = vi.fn();

      (DevicesAPI.addDevice as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useAddDevice({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(mockDevice);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates devices queries on success', async () => {
      const mockDevice: Device = {
        id: '1',
        name: 'Test Device',
        type: 'sensor'
      } as Device;
      const mockResponse = {data: mockDevice};

      (DevicesAPI.addDevice as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useAddDevice({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync(mockDevice);

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-devices']});
    });

    it('calls onError callback when device addition fails', async () => {
      const mockDevice: Device = {
        id: '1',
        name: 'Test Device',
        type: 'sensor'
      } as Device;
      const onError = vi.fn();

      (DevicesAPI.addDevice as Mock).mockRejectedValue(new Error('Addition failed'));

      const {result} = renderHook(() => useAddDevice({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(mockDevice);
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });

    it('works without callbacks', async () => {
      const mockDevice: Device = {
        id: '1',
        name: 'Test Device',
        type: 'sensor'
      } as Device;
      const mockResponse = {data: mockDevice};

      (DevicesAPI.addDevice as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useAddDevice({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(mockDevice)).resolves.not.toThrow();
    });

    it('handles partial callbacks - only onSuccess', async () => {
      const mockDevice: Device = {
        id: '1',
        name: 'Test Device',
        type: 'sensor'
      } as Device;
      const mockResponse = {data: mockDevice};
      const onSuccess = vi.fn();

      (DevicesAPI.addDevice as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useAddDevice({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(mockDevice);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });
  });

  describe('useRegisterDevice', () => {
    it('calls DevicesAPI.registerDevice with correct parameters', async () => {
      const mockDevice: Device = {
        id: '1',
        name: 'Registered Device',
        type: 'controller'
      } as Device;
      const registerParams = {id: '1', data: mockDevice};
      const mockResponse = {data: mockDevice};

      (DevicesAPI.registerDevice as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useRegisterDevice({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(registerParams);

      expect(DevicesAPI.registerDevice).toHaveBeenCalledWith('1', mockDevice);
    });

    it('calls onSuccess callback when device registration succeeds', async () => {
      const mockDevice: Device = {
        id: '1',
        name: 'Registered Device',
        type: 'controller'
      } as Device;
      const registerParams = {id: '1', data: mockDevice};
      const mockResponse = {data: mockDevice};
      const onSuccess = vi.fn();

      (DevicesAPI.registerDevice as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useRegisterDevice({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync(registerParams);

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates devices queries on success', async () => {
      const mockDevice: Device = {
        id: '1',
        name: 'Registered Device',
        type: 'controller'
      } as Device;
      const registerParams = {id: '1', data: mockDevice};
      const mockResponse = {data: mockDevice};

      (DevicesAPI.registerDevice as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useRegisterDevice({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync(registerParams);

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-devices']});
    });

    it('calls onError callback when device registration fails', async () => {
      const mockDevice: Device = {
        id: '1',
        name: 'Registered Device',
        type: 'controller'
      } as Device;
      const registerParams = {id: '1', data: mockDevice};
      const onError = vi.fn();

      (DevicesAPI.registerDevice as Mock).mockRejectedValue(new Error('Registration failed'));

      const {result} = renderHook(() => useRegisterDevice({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(registerParams);
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });

    it('works with default empty callbacks parameter', async () => {
      const mockDevice: Device = {
        id: '1',
        name: 'Registered Device',
        type: 'controller'
      } as Device;
      const registerParams = {id: '1', data: mockDevice};
      const mockResponse = {data: mockDevice};

      (DevicesAPI.registerDevice as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useRegisterDevice({}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync(registerParams)).resolves.not.toThrow();
    });
  });

  describe('useDeleteDevice', () => {
    it('calls DevicesAPI.deleteDevice with correct id', async () => {
      const mockResponse = {data: {success: true}};

      (DevicesAPI.deleteDevice as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useDeleteDevice({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync('1');

      expect(DevicesAPI.deleteDevice).toHaveBeenCalledWith('1');
    });

    it('calls onSuccess callback when device deletion succeeds', async () => {
      const mockResponse = {data: {success: true}};
      const onSuccess = vi.fn();

      (DevicesAPI.deleteDevice as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useDeleteDevice({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync('1');

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('invalidates devices queries on success', async () => {
      const mockResponse = {data: {success: true}};

      (DevicesAPI.deleteDevice as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useDeleteDevice({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync('1');

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({queryKey: ['get-devices']});
    });

    it('calls onError callback when device deletion fails', async () => {
      const onError = vi.fn();

      (DevicesAPI.deleteDevice as Mock).mockRejectedValue(new Error('Deletion failed'));

      const {result} = renderHook(() => useDeleteDevice({callbacks: {onError}}), {
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
      const mockResponse = {data: {success: true}};

      (DevicesAPI.deleteDevice as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useDeleteDevice({}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync('1')).resolves.not.toThrow();
    });
  });

  describe('useTestDevice', () => {
    it('calls DevicesAPI.testDevice with correct id', async () => {
      const mockResponse = {data: {testResult: 'passed'}};

      (DevicesAPI.testDevice as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useTestDevice({callbacks: {}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync('1');

      expect(DevicesAPI.testDevice).toHaveBeenCalledWith('1');
    });

    it('calls onSuccess callback when device test succeeds', async () => {
      const mockResponse = {data: {testResult: 'passed'}};
      const onSuccess = vi.fn();

      (DevicesAPI.testDevice as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useTestDevice({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync('1');

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('calls onError callback when device test fails', async () => {
      const onError = vi.fn();

      (DevicesAPI.testDevice as Mock).mockRejectedValue(new Error('Test failed'));

      const {result} = renderHook(() => useTestDevice({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync('1');
      } catch {
        // Expected to fail
      }

      expect(onError).toHaveBeenCalled();
    });

    it('does not invalidate queries on success', async () => {
      const mockResponse = {data: {testResult: 'passed'}};

      (DevicesAPI.testDevice as Mock).mockResolvedValue(mockResponse);

      const {CustomWrapper, invalidateQueriesSpy} = createWrapperWithSpy();

      const {result} = renderHook(() => useTestDevice({callbacks: {}}), {
        wrapper: CustomWrapper
      });

      await result.current.mutateAsync('1');

      // useTestDevice should NOT invalidate queries
      expect(invalidateQueriesSpy).not.toHaveBeenCalled();
    });

    it('works with default empty callbacks parameter', async () => {
      const mockResponse = {data: {testResult: 'passed'}};

      (DevicesAPI.testDevice as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useTestDevice({}), {
        wrapper: createWrapper()
      });

      await expect(result.current.mutateAsync('1')).resolves.not.toThrow();
    });

    it('handles partial callbacks - only onSuccess', async () => {
      const mockResponse = {data: {testResult: 'passed'}};
      const onSuccess = vi.fn();

      (DevicesAPI.testDevice as Mock).mockResolvedValue(mockResponse);

      const {result} = renderHook(() => useTestDevice({callbacks: {onSuccess}}), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync('1');

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('handles partial callbacks - only onError', async () => {
      const onError = vi.fn();

      (DevicesAPI.testDevice as Mock).mockRejectedValue(new Error('Test failed'));

      const {result} = renderHook(() => useTestDevice({callbacks: {onError}}), {
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

  describe('edge cases', () => {
    it('handles network errors for add device', async () => {
      const mockDevice: Device = {
        id: '1',
        name: 'Test Device',
        type: 'sensor'
      } as Device;
      const onError = vi.fn();

      (DevicesAPI.addDevice as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useAddDevice({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(mockDevice);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network Error');
      }

      expect(onError).toHaveBeenCalled();
    });

    it('handles network errors for register device', async () => {
      const mockDevice: Device = {
        id: '1',
        name: 'Test Device',
        type: 'sensor'
      } as Device;
      const registerParams = {id: '1', data: mockDevice};
      const onError = vi.fn();

      (DevicesAPI.registerDevice as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useRegisterDevice({callbacks: {onError}}), {
        wrapper: createWrapper()
      });

      try {
        await result.current.mutateAsync(registerParams);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network Error');
      }

      expect(onError).toHaveBeenCalled();
    });

    it('handles network errors for delete device', async () => {
      const onError = vi.fn();

      (DevicesAPI.deleteDevice as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useDeleteDevice({callbacks: {onError}}), {
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

    it('handles network errors for test device', async () => {
      const onError = vi.fn();

      (DevicesAPI.testDevice as Mock).mockRejectedValue(new Error('Network Error'));

      const {result} = renderHook(() => useTestDevice({callbacks: {onError}}), {
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
      const mockDevice: Device = {
        id: '1',
        name: 'Test Device',
        type: 'sensor'
      } as Device;
      const mockResponse = {data: mockDevice};

      (DevicesAPI.addDevice as Mock).mockResolvedValue(mockResponse);
      (DevicesAPI.registerDevice as Mock).mockResolvedValue(mockResponse);
      (DevicesAPI.deleteDevice as Mock).mockResolvedValue(mockResponse);
      (DevicesAPI.testDevice as Mock).mockResolvedValue(mockResponse);

      const {result: addResult} = renderHook(() => useAddDevice({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      const {result: registerResult} = renderHook(() => useRegisterDevice({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      const {result: deleteResult} = renderHook(() => useDeleteDevice({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      const {result: testResult} = renderHook(() => useTestDevice({callbacks: undefined}), {
        wrapper: createWrapper()
      });

      await expect(addResult.current.mutateAsync(mockDevice)).resolves.not.toThrow();
      await expect(registerResult.current.mutateAsync({id: '1', data: mockDevice})).resolves.not.toThrow();
      await expect(deleteResult.current.mutateAsync('1')).resolves.not.toThrow();
      await expect(testResult.current.mutateAsync('1')).resolves.not.toThrow();
    });
  });
});
