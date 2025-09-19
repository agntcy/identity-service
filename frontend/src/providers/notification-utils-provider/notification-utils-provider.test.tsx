/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable indent */
/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {describe, it, vi, beforeEach, expect, afterEach} from 'vitest';
import {renderHook, act, waitFor} from '@testing-library/react';
import React from 'react';
import {NotificationUtilsProvider, useNotificationUtils} from './notification-utils-provider';

// Mock external dependencies
vi.mock('@/lib/notifications', () => ({
  askPermissionNotifications: vi.fn(),
  checkNotifications: vi.fn(),
  getCurrentSubscription: vi.fn(),
  getNotificationPermissionState: vi.fn(),
  subscribeNotifications: vi.fn(),
  unsubscribeNotifications: vi.fn()
}));

vi.mock('@/lib/utils', () => ({
  arrayBufferToBase64: vi.fn()
}));

vi.mock('@/mutations', () => ({
  useRegisterDevice: vi.fn()
}));

vi.mock('@/providers/pwa-provider/pwa-provider', () => ({
  usePwa: vi.fn()
}));

vi.mock('@open-ui-kit/core', () => ({
  toast: vi.fn()
}));

vi.mock('@/lib/device', () => ({
  default: vi.fn()
}));

vi.mock('@/utils/notification-store', () => ({
  notificationUtils: {
    clearAllNotifications: vi.fn()
  }
}));

// Get mocked functions
const mockAskPermissionNotifications = vi.mocked(await import('@/lib/notifications')).askPermissionNotifications;
const mockCheckNotifications = vi.mocked(await import('@/lib/notifications')).checkNotifications;
const mockGetCurrentSubscription = vi.mocked(await import('@/lib/notifications')).getCurrentSubscription;
const mockGetNotificationPermissionState = vi.mocked(await import('@/lib/notifications')).getNotificationPermissionState;
const mockSubscribeNotifications = vi.mocked(await import('@/lib/notifications')).subscribeNotifications;
const mockUnsubscribeNotifications = vi.mocked(await import('@/lib/notifications')).unsubscribeNotifications;
const mockArrayBufferToBase64 = vi.mocked(await import('@/lib/utils')).arrayBufferToBase64;
const mockUseRegisterDevice = vi.mocked(await import('@/mutations')).useRegisterDevice;
const mockUsePwa = vi.mocked(await import('@/providers/pwa-provider/pwa-provider')).usePwa;
const mockToast = vi.mocked(await import('@open-ui-kit/core')).toast;
const mockGetDeviceInfo = vi.mocked(await import('@/lib/device')).default;
const mockNotificationUtils = vi.mocked(await import('@/utils/notification-store')).notificationUtils;

describe('NotificationUtilsProvider', () => {
  const mockMutateAsync = vi.fn();
  const mockUpdateServiceWorker = vi.fn();

  // Helper function to create consistent mock subscriptions
  const createMockSubscription = () =>
    ({
      endpoint: 'test-endpoint',
      getKey: vi.fn((keyName: string) => {
        if (keyName === 'p256dh') {
          return new ArrayBuffer(65); // Typical p256dh key size
        }
        if (keyName === 'auth') {
          return new ArrayBuffer(16); // Typical auth key size
        }
        return null;
      }),
      options: {},
      unsubscribe: vi.fn().mockResolvedValue(true)
    }) as unknown as PushSubscription;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockUseRegisterDevice.mockReturnValue({
      mutateAsync: mockMutateAsync
    } as any);

    mockUsePwa.mockReturnValue({
      updateServiceWorker: mockUpdateServiceWorker
    } as any);

    mockGetDeviceInfo.mockReturnValue({
      name: 'Test Device',
      model: 'Test Model',
      os: 'Test OS',
      osVersion: '1.0',
      browser: 'Test Browser',
      screenSize: '1920x1080',
      isMobile: false
    });

    mockArrayBufferToBase64.mockImplementation((buffer: ArrayBuffer) => {
      if (!buffer) {
        return '';
      }
      // Create a simple base64-like string for testing
      return `base64-${buffer.byteLength}`;
    });

    // Mock console methods to avoid test output noise
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createWrapper =
    () =>
    ({children}: {children: React.ReactNode}) =>
      React.createElement(NotificationUtilsProvider, null, children);

  describe('Context Provider', () => {
    it('provides context value to children', () => {
      mockCheckNotifications.mockReturnValue(true);
      mockGetNotificationPermissionState.mockResolvedValue('default');

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      expect(result.current).toBeDefined();
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('enabled');
      expect(result.current).toHaveProperty('supported');
      expect(result.current).toHaveProperty('enableNotifications');
      expect(result.current).toHaveProperty('disableNotifications');
      expect(result.current).toHaveProperty('handleToggleNotifications');
      expect(result.current).toHaveProperty('fixNotifications');
      expect(result.current).toHaveProperty('init');
    });

    it('throws error when used outside provider', () => {
      expect(() => {
        renderHook(() => useNotificationUtils());
      }).toThrow('useNotificationUtils must be used within a NotificationUtilsProvider');
    });
  });

  describe('Initialization', () => {
    it('initializes with notifications supported and permission granted with existing subscription', async () => {
      const mockSubscription = createMockSubscription();

      mockCheckNotifications.mockReturnValue(true);
      mockGetNotificationPermissionState.mockResolvedValue('granted');
      // @ts-expect-error - Ignoring PushSubscription type mismatch for testing
      mockGetCurrentSubscription.mockResolvedValue(mockSubscription);
      mockMutateAsync.mockResolvedValue({});

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.supported).toBe(true);
        expect(result.current.enabled).toBe(true);
      });

      expect(mockCheckNotifications).toHaveBeenCalled();
      expect(mockGetNotificationPermissionState).toHaveBeenCalled();
      expect(mockGetCurrentSubscription).toHaveBeenCalled();
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('initializes with notifications supported and permission granted without existing subscription', async () => {
      mockCheckNotifications.mockReturnValue(true);
      mockGetNotificationPermissionState.mockResolvedValue('granted');
      mockGetCurrentSubscription.mockResolvedValue(null);

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.supported).toBe(true);
        expect(result.current.enabled).toBe(false);
      });
    });

    it('initializes with notifications not supported', async () => {
      mockCheckNotifications.mockReturnValue(false);

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.supported).toBe(false);
        expect(result.current.enabled).toBe(false);
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Notifications Not Supported',
        description: 'Your browser does not support push notifications.',
        type: 'error',
        showCloseButton: false
      });
    });

    it('handles initialization error', async () => {
      mockCheckNotifications.mockReturnValue(true);
      mockGetNotificationPermissionState.mockRejectedValue(new Error('Permission error'));

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.supported).toBe(false);
        expect(result.current.enabled).toBe(false);
      });

      expect(console.error).toHaveBeenCalledWith('Failed to initialize notifications:', expect.any(Error));
    });
  });

  describe('enableNotifications', () => {
    beforeEach(() => {
      mockCheckNotifications.mockReturnValue(true);
      mockGetNotificationPermissionState.mockResolvedValue('default');
    });

    it('enables notifications successfully with existing subscription', async () => {
      const mockSubscription = createMockSubscription();

      // @ts-expect-error - Ignoring PushSubscription type mismatch for testing
      mockAskPermissionNotifications.mockResolvedValue(undefined);
      // @ts-expect-error - Ignoring PushSubscription type mismatch for testing
      mockGetCurrentSubscription.mockResolvedValue(mockSubscription);
      mockMutateAsync.mockResolvedValue({});

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.enableNotifications('test-id');
      });

      expect(mockAskPermissionNotifications).toHaveBeenCalled();
      expect(mockGetCurrentSubscription).toHaveBeenCalled();
      expect(result.current.enabled).toBe(true);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Notifications Enabled',
        description: 'You will now receive push notifications.',
        type: 'success',
        showCloseButton: false
      });
    });

    it('enables notifications successfully with new subscription', async () => {
      const mockSubscription = createMockSubscription();

      // @ts-expect-error - Ignoring PushSubscription type mismatch for testing
      mockAskPermissionNotifications.mockResolvedValue(undefined);
      mockGetCurrentSubscription.mockResolvedValue(null);
      mockSubscribeNotifications.mockResolvedValue(mockSubscription);
      mockMutateAsync.mockResolvedValue({});

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.enableNotifications('test-id');
      });

      expect(mockSubscribeNotifications).toHaveBeenCalled();
      expect(mockArrayBufferToBase64).toHaveBeenCalledTimes(2);
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: 'test-id',
        data: {
          subscriptionToken: JSON.stringify({
            endpoint: 'test-endpoint',
            p256dh: 'base64-65',
            auth: 'base64-16'
          }),
          name: 'Test Device'
        }
      });
      expect(result.current.enabled).toBe(true);
    });

    it('handles permission denied error', async () => {
      mockAskPermissionNotifications.mockRejectedValue(new Error('Permission denied'));

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.enableNotifications();
      });

      expect(result.current.enabled).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Permission Denied',
        description: 'Please enable notifications in your browser settings',
        type: 'error',
        showCloseButton: false
      });
    });

    it('handles subscription error', async () => {
      // @ts-expect-error - Ignoring PushSubscription type mismatch for testing
      mockAskPermissionNotifications.mockResolvedValue(undefined);
      mockGetCurrentSubscription.mockResolvedValue(null);
      mockSubscribeNotifications.mockRejectedValue(new Error('Subscription failed'));

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.enableNotifications();
      });

      expect(result.current.enabled).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Subscription Failed',
        description: 'Please try again later.',
        type: 'error',
        showCloseButton: false
      });
    });

    it('handles device registration error', async () => {
      const mockSubscription = createMockSubscription();

      // @ts-expect-error - Ignoring PushSubscription type mismatch for testing
      mockAskPermissionNotifications.mockResolvedValue(undefined);
      mockGetCurrentSubscription.mockResolvedValue(null);
      mockSubscribeNotifications.mockResolvedValue(mockSubscription);
      mockMutateAsync.mockRejectedValue(new Error('Registration failed'));

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.enableNotifications();
      });

      expect(result.current.enabled).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Subscription Failed',
        description: 'Please try again later.',
        type: 'error',
        showCloseButton: false
      });
    });

    it('uses default device name when device info name is not available', async () => {
      const mockSubscription = createMockSubscription();

      mockGetDeviceInfo.mockReturnValue({
        name: null as any,
        model: 'Test Model',
        os: 'Test OS',
        osVersion: '1.0',
        browser: 'Test Browser',
        screenSize: '1920x1080',
        isMobile: false
      });
      // @ts-expect-error - Ignoring PushSubscription type mismatch for testing
      mockAskPermissionNotifications.mockResolvedValue(undefined);
      mockGetCurrentSubscription.mockResolvedValue(null);
      mockSubscribeNotifications.mockResolvedValue(mockSubscription);
      mockMutateAsync.mockResolvedValue({});

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.enableNotifications();
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: '',
        data: {
          subscriptionToken: expect.any(String),
          name: 'Unknown Device'
        }
      });
    });
  });

  describe('disableNotifications', () => {
    beforeEach(() => {
      mockCheckNotifications.mockReturnValue(true);
      mockGetNotificationPermissionState.mockResolvedValue('default');
    });

    it('disables notifications successfully', async () => {
      // @ts-expect-error - Ignoring PushSubscription type mismatch for testing
      mockUnsubscribeNotifications.mockResolvedValue(undefined);

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.disableNotifications();
      });

      expect(mockUnsubscribeNotifications).toHaveBeenCalled();
      expect(result.current.enabled).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Notifications Disabled',
        description: 'You will no longer receive push notifications.',
        type: 'success',
        showCloseButton: false
      });
    });

    it('handles unsubscribe error', async () => {
      mockUnsubscribeNotifications.mockRejectedValue(new Error('Unsubscribe failed'));

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.disableNotifications();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Unsubscribe Failed',
        description: 'Please try again later.',
        type: 'error',
        showCloseButton: false
      });
    });
  });

  describe('handleToggleNotifications', () => {
    beforeEach(() => {
      mockCheckNotifications.mockReturnValue(true);
      mockGetNotificationPermissionState.mockResolvedValue('default');
    });

    it('enables notifications when disabled and supported', async () => {
      const mockSubscription = createMockSubscription();

      // @ts-expect-error - Ignoring PushSubscription type mismatch for testing
      mockAskPermissionNotifications.mockResolvedValue(undefined);
      // @ts-expect-error - Ignoring PushSubscription type mismatch for testing
      mockGetCurrentSubscription.mockResolvedValue(mockSubscription);
      mockMutateAsync.mockResolvedValue({});

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.supported).toBe(true);
      });

      act(() => {
        result.current.handleToggleNotifications('test-id');
      });

      await waitFor(() => {
        expect(mockAskPermissionNotifications).toHaveBeenCalled();
      });
    });

    it('disables notifications when enabled and supported', async () => {
      const mockSubscription = createMockSubscription();

      mockGetNotificationPermissionState.mockResolvedValue('granted');
      // @ts-expect-error - Ignoring PushSubscription type mismatch for testing
      mockGetCurrentSubscription.mockResolvedValue(mockSubscription);
      // @ts-expect-error - Ignoring PushSubscription type mismatch for testing
      mockUnsubscribeNotifications.mockResolvedValue(undefined);
      mockMutateAsync.mockResolvedValue({});

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.enabled).toBe(true);
      });

      act(() => {
        result.current.handleToggleNotifications();
      });

      await waitFor(() => {
        expect(mockUnsubscribeNotifications).toHaveBeenCalled();
      });
    });

    it('does nothing when not supported', async () => {
      mockCheckNotifications.mockReturnValue(false);

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.supported).toBe(false);
      });

      act(() => {
        result.current.handleToggleNotifications();
      });

      expect(mockAskPermissionNotifications).not.toHaveBeenCalled();
      expect(mockUnsubscribeNotifications).not.toHaveBeenCalled();
    });
  });

  describe('fixNotifications', () => {
    beforeEach(() => {
      mockCheckNotifications.mockReturnValue(true);
      mockGetNotificationPermissionState.mockResolvedValue('default');
    });

    it('fixes notifications successfully', async () => {
      mockUpdateServiceWorker.mockResolvedValue(undefined);
      // @ts-expect-error - Ignoring PushSubscription type mismatch for testing
      mockNotificationUtils.clearAllNotifications.mockResolvedValue(undefined);

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.fixNotifications();
      });

      expect(mockUpdateServiceWorker).toHaveBeenCalled();
      expect(mockNotificationUtils.clearAllNotifications).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Notifications Fixed',
        description: 'Your notification issues have been resolved.',
        type: 'success',
        showCloseButton: false
      });
    });

    it('handles fix error', async () => {
      mockUpdateServiceWorker.mockRejectedValue(new Error('Update failed'));

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.fixNotifications();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Fix Failed',
        description: 'Please try again later.',
        type: 'error',
        showCloseButton: false
      });
    });
  });

  describe('Loading state management', () => {
    beforeEach(() => {
      mockCheckNotifications.mockReturnValue(true);
      mockGetNotificationPermissionState.mockResolvedValue('default');
    });

    it('manages loading state during enableNotifications', async () => {
      const mockSubscription = createMockSubscription();

      mockAskPermissionNotifications.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      // @ts-expect-error - Ignoring PushSubscription type mismatch for testing
      mockGetCurrentSubscription.mockResolvedValue(mockSubscription);
      mockMutateAsync.mockResolvedValue({});

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      act(() => {
        void result.current.enableNotifications();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('manages loading state during disableNotifications', async () => {
      mockUnsubscribeNotifications.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      act(() => {
        void result.current.disableNotifications();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('manages loading state during fixNotifications', async () => {
      mockUpdateServiceWorker.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      // @ts-expect-error - Ignoring PushSubscription type mismatch for testing
      mockNotificationUtils.clearAllNotifications.mockResolvedValue(undefined);

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      act(() => {
        void result.current.fixNotifications();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Edge cases', () => {
    it('handles multiple rapid calls to enableNotifications', async () => {
      const mockSubscription = createMockSubscription();

      mockCheckNotifications.mockReturnValue(true);
      mockGetNotificationPermissionState.mockResolvedValue('default');
      // @ts-expect-error - Ignoring PushSubscription type mismatch for testing
      mockAskPermissionNotifications.mockResolvedValue(undefined);
      // @ts-expect-error - Ignoring PushSubscription type mismatch for testing
      mockGetCurrentSubscription.mockResolvedValue(mockSubscription);
      mockMutateAsync.mockResolvedValue({});

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.supported).toBe(true);
      });

      // Make multiple rapid calls
      act(() => {
        void result.current.enableNotifications();
        void result.current.enableNotifications();
        void result.current.enableNotifications();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should call multiple times since there's no loading state protection in the current implementation
      expect(mockAskPermissionNotifications).toHaveBeenCalledTimes(3);
    });

    it('handles re-initialization', async () => {
      mockCheckNotifications.mockReturnValue(true);
      mockGetNotificationPermissionState.mockResolvedValue('default');

      const {result} = renderHook(() => useNotificationUtils(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.supported).toBe(true);
      });

      await act(async () => {
        await result.current.init();
      });

      expect(mockCheckNotifications).toHaveBeenCalledTimes(2);
      expect(mockGetNotificationPermissionState).toHaveBeenCalledTimes(2);
    });
  });
});
