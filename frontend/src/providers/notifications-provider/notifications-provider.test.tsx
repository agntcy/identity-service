/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import {describe, it, vi, beforeEach, expect, afterEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import {NotificationsProvider} from './notifications-provider';
import {INotification, NotificationType} from '@/types/sw/notification';

// Mock dependencies
vi.mock('@/components/notifications/notification-content', () => ({
  NotificationContent: ({notification, index, onHandleRequest, defaultOpen, useOverlay}: any) => (
    <div
      data-testid={`notification-content-${notification.id}`}
      data-index={index}
      data-default-open={defaultOpen}
      data-use-overlay={useOverlay}
      onClick={() => onHandleRequest(notification)}
    >
      Notification: {notification.id}
    </div>
  )
}));

vi.mock('@/hooks', () => ({
  useWindowSize: vi.fn()
}));

vi.mock('../notification-utils-provider/notification-utils-provider', () => ({
  useNotificationUtils: vi.fn()
}));

vi.mock('@/utils/notification-store', () => ({
  notificationUtils: {
    getNotifications: vi.fn(),
    removeNotification: vi.fn()
  }
}));

// Mock globals
const mockServiceWorker = {
  ready: Promise.resolve({
    active: {
      postMessage: vi.fn()
    }
  }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

const mockNavigator = {
  serviceWorker: mockServiceWorker
};

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
});

// Mock Date.now
const mockDateNow = vi.fn();
vi.stubGlobal('Date', {
  ...Date,
  now: mockDateNow
});

// Mock setInterval and clearInterval
const mockSetInterval = vi.fn();
const mockClearInterval = vi.fn();
vi.stubGlobal('setInterval', mockSetInterval);
vi.stubGlobal('clearInterval', mockClearInterval);

// Mock console.error
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

// Import mocked modules
import * as hooks from '@/hooks';
import * as notificationUtilsProvider from '../notification-utils-provider/notification-utils-provider';
import * as notificationStore from '@/utils/notification-store';

// Type the mocks properly
const mockUseWindowSize = vi.mocked(hooks.useWindowSize);
const mockUseNotificationUtils = vi.mocked(notificationUtilsProvider.useNotificationUtils);
const mockNotificationUtils = {
  getNotifications: vi.mocked(notificationStore.notificationUtils.getNotifications),
  removeNotification: vi.mocked(notificationStore.notificationUtils.removeNotification)
};

describe('NotificationsProvider', () => {
  const mockNotification: INotification = {
    id: 'test-notification-1',
    type: NotificationType.APPROVAL_REQUEST,
    timestamp: 1000000000,
    approval_request_info: {
      timeout_in_seconds: 120
    }
  };

  const mockNotification2: INotification = {
    id: 'test-notification-2',
    type: NotificationType.APPROVAL_REQUEST,
    timestamp: 2000000000,
    approval_request_info: {
      timeout_in_seconds: 60
    }
  };

  const mockNotificationUtilsContext = {
    enabled: true,
    loading: false,
    supported: true,
    enableNotifications: vi.fn(),
    disableNotifications: vi.fn(),
    requestPermission: vi.fn(),
    getPermissionStatus: vi.fn().mockReturnValue('granted'),
    handleToggleNotifications: vi.fn(),
    fixNotifications: vi.fn(),
    init: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDateNow.mockReturnValue(1000060000); // 60 seconds after first notification
    mockUseWindowSize.mockReturnValue({
      windowSize: {width: 768, height: 1024},
      isMobile: true,
      isTablet: false
    });
    mockUseNotificationUtils.mockReturnValue(mockNotificationUtilsContext);
    mockNotificationUtils.getNotifications.mockResolvedValue([]);
    mockNotificationUtils.removeNotification.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders children correctly', () => {
    render(
      <NotificationsProvider>
        <div data-testid="test-child">Test Child</div>
      </NotificationsProvider>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('does not render notifications when not mobile', () => {
    mockUseWindowSize.mockReturnValue({
      windowSize: {width: 1200, height: 800},
      isMobile: false,
      isTablet: false
    });
    mockNotificationUtils.getNotifications.mockResolvedValue([mockNotification]);

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    expect(screen.queryByTestId(`notification-content-${mockNotification.id}`)).not.toBeInTheDocument();
  });

  it('does not render notifications when not enabled', () => {
    mockUseNotificationUtils.mockReturnValue({
      ...mockNotificationUtilsContext,
      enabled: false
    });
    mockNotificationUtils.getNotifications.mockResolvedValue([mockNotification]);

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    expect(screen.queryByTestId(`notification-content-${mockNotification.id}`)).not.toBeInTheDocument();
  });

  it('loads notifications on mount when mobile and enabled', async () => {
    mockNotificationUtils.getNotifications.mockResolvedValue([mockNotification]);

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    await waitFor(() => {
      expect(mockNotificationUtils.getNotifications).toHaveBeenCalledOnce();
    });
  });

  it('renders notification content when has approval request notifications', async () => {
    mockNotificationUtils.getNotifications.mockResolvedValue([mockNotification]);

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId(`notification-content-${mockNotification.id}`)).toBeInTheDocument();
    });
  });

  it('sorts notifications by timestamp', async () => {
    mockNotificationUtils.getNotifications.mockResolvedValue([mockNotification2, mockNotification]);

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    await waitFor(() => {
      const notifications = screen.getAllByTestId(/notification-content-/);
      expect(notifications[0]).toHaveAttribute('data-index', '0');
      expect(notifications[1]).toHaveAttribute('data-index', '1');
    });
  });

  it('handles error when loading notifications', async () => {
    const error = new Error('Load error');

    // Clear any previous mock calls and setup the rejection
    mockNotificationUtils.getNotifications.mockClear();
    mockNotificationUtils.getNotifications.mockRejectedValue(error);

    // Clear previous console.error calls
    mockConsoleError.mockClear();

    // Ensure the exact conditions that trigger loadNotifications
    mockUseWindowSize.mockReturnValue({
      windowSize: {width: 768, height: 1024},
      isMobile: true,
      isTablet: false
    });

    mockUseNotificationUtils.mockReturnValue({
      ...mockNotificationUtilsContext,
      enabled: true
    });

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    // Wait for the component to mount and the useEffect to trigger loadNotifications
    await waitFor(() => {
      expect(mockNotificationUtils.getNotifications).toHaveBeenCalled();
    });

    // Wait for the error to be caught and logged
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith('Error loading notifications:', error);
    });
  });

  it('removes notification correctly', async () => {
    mockNotificationUtils.getNotifications.mockResolvedValue([mockNotification]);

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId(`notification-content-${mockNotification.id}`)).toBeInTheDocument();
    });

    // Click to trigger removal
    screen.getByTestId(`notification-content-${mockNotification.id}`).click();

    await waitFor(() => {
      expect(mockNotificationUtils.removeNotification).toHaveBeenCalledWith(mockNotification.id);
    });
  });

  it('posts message to service worker when removing notification', async () => {
    const mockPostMessage = vi.fn();

    // Create a proper mock for the service worker ready promise
    const mockServiceWorkerRegistration = {
      active: {
        postMessage: mockPostMessage
      }
    };

    const mockReadyPromise = Promise.resolve(mockServiceWorkerRegistration);

    // Override the global navigator for this test
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {
          ready: mockReadyPromise,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        }
      },
      writable: true,
      configurable: true
    });

    mockNotificationUtils.getNotifications.mockResolvedValue([mockNotification]);

    // Reset removeNotification mock to ensure it succeeds
    mockNotificationUtils.removeNotification.mockResolvedValue(undefined);

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId(`notification-content-${mockNotification.id}`)).toBeInTheDocument();
    });

    // Click to trigger removal
    screen.getByTestId(`notification-content-${mockNotification.id}`).click();

    // Wait for removeNotification to be called
    await waitFor(() => {
      expect(mockNotificationUtils.removeNotification).toHaveBeenCalledWith(mockNotification.id);
    });

    // Wait for the service worker ready promise to resolve and postMessage to be called
    await waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'CLOSE_NOTIFICATION',
        notificationId: mockNotification.id
      });
    });

    // Restore original navigator
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true
    });
  });

  it('handles error when removing notification', async () => {
    const error = new Error('Remove error');

    // Set up the initial successful load
    mockNotificationUtils.getNotifications.mockResolvedValueOnce([mockNotification]);

    // Mock removeNotification to throw an error
    mockNotificationUtils.removeNotification.mockRejectedValueOnce(error);

    // Clear previous console.error calls
    mockConsoleError.mockClear();

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId(`notification-content-${mockNotification.id}`)).toBeInTheDocument();
    });

    // Click to trigger removal
    screen.getByTestId(`notification-content-${mockNotification.id}`).click();

    // Wait for removeNotification to be called and the error to be caught
    await waitFor(() => {
      expect(mockNotificationUtils.removeNotification).toHaveBeenCalledWith(mockNotification.id);
    });

    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith('Error removing notification:', error);
    });
  });

  it('checks if notification is expired correctly', async () => {
    const expiredNotification = {
      ...mockNotification,
      timestamp: 1000000000, // 60 seconds ago with 60s timeout = expired
      approval_request_info: {timeout_in_seconds: 60}
    };
    const validNotification = {
      ...mockNotification2,
      timestamp: 1000000000, // 60 seconds ago with 120s timeout = still valid
      approval_request_info: {timeout_in_seconds: 120}
    };

    mockDateNow.mockReturnValue(1000060000); // Current time
    mockNotificationUtils.getNotifications.mockResolvedValue([expiredNotification, validNotification]);

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    await waitFor(() => {
      const expiredElement = screen.getByTestId(`notification-content-${expiredNotification.id}`);
      const validElement = screen.getByTestId(`notification-content-${validNotification.id}`);

      expect(expiredElement).toHaveAttribute('data-default-open', 'false');
      expect(validElement).toHaveAttribute('data-default-open', 'true');
    });
  });

  it('sets up cleanup interval for expired notifications', async () => {
    mockNotificationUtils.getNotifications.mockResolvedValue([mockNotification]);

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    await waitFor(() => {
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
    });
  });

  it('clears cleanup interval on unmount', async () => {
    const mockIntervalId = 123;
    mockSetInterval.mockReturnValue(mockIntervalId);
    mockNotificationUtils.getNotifications.mockResolvedValue([mockNotification]);

    const {unmount} = render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    await waitFor(() => {
      expect(mockSetInterval).toHaveBeenCalled();
    });

    unmount();

    expect(mockClearInterval).toHaveBeenCalledWith(mockIntervalId);
  });

  it('adds service worker message listeners when mobile and enabled', () => {
    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    expect(mockServiceWorker.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    expect(mockServiceWorker.addEventListener).toHaveBeenCalledTimes(2);
  });

  it('removes service worker message listeners on unmount', () => {
    const {unmount} = render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    unmount();

    expect(mockServiceWorker.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    expect(mockServiceWorker.removeEventListener).toHaveBeenCalledTimes(2);
  });

  it('handles push notification message from service worker', async () => {
    mockNotificationUtils.getNotifications.mockResolvedValue([]);

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    // Get the message listener
    const messageListener = mockServiceWorker.addEventListener.mock.calls.find((call) => call[0] === 'message')?.[1];

    // Simulate push notification message
    const mockEvent = {
      data: {
        type: 'PUSH_NOTIFICATION',
        payload: mockNotification
      }
    };

    await messageListener(mockEvent);

    // Should call loadNotifications
    await waitFor(() => {
      expect(mockNotificationUtils.getNotifications).toHaveBeenCalled();
    });
  });

  it('handles remove notification message from service worker', async () => {
    mockNotificationUtils.getNotifications.mockResolvedValue([mockNotification]);

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    // Get the message listener (second one for remove)
    const messageListener = mockServiceWorker.addEventListener.mock.calls[1]?.[1];

    // Simulate remove notification message
    const mockEvent = {
      data: {
        type: 'REMOVE_NOTIFICATION',
        payload: mockNotification
      }
    };

    await messageListener(mockEvent);

    await waitFor(() => {
      expect(mockNotificationUtils.removeNotification).toHaveBeenCalledWith(mockNotification.id);
    });
  });

  it('does not handle non-mobile push notifications', () => {
    mockUseWindowSize.mockReturnValue({
      windowSize: {width: 1200, height: 800},
      isMobile: false,
      isTablet: false
    });
    mockNotificationUtils.getNotifications.mockResolvedValue([]);

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    // Should not call getNotifications initially for non-mobile
    expect(mockNotificationUtils.getNotifications).not.toHaveBeenCalled();
  });

  it('handles notification without id during removal', async () => {
    const notificationWithoutId = {...mockNotification, id: undefined};
    mockNotificationUtils.getNotifications.mockResolvedValue([notificationWithoutId]);

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    // Should not crash and not call removeNotification
    await waitFor(() => {
      expect(mockNotificationUtils.removeNotification).not.toHaveBeenCalled();
    });
  });

  it('returns false for non-approval request notifications in checkIsExpired', () => {
    const nonApprovalNotification = {
      ...mockNotification,
      type: 'OTHER_TYPE' as NotificationType
    };
    mockNotificationUtils.getNotifications.mockResolvedValue([nonApprovalNotification]);

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    // Non-approval notifications won't be rendered because hasNotificationsRequest will be false
    expect(screen.queryByTestId(`notification-content-${nonApprovalNotification.id}`)).not.toBeInTheDocument();
  });

  it('uses default timeout when approval_request_info is missing', async () => {
    const notificationNoTimeout = {
      ...mockNotification,
      approval_request_info: undefined
    };
    mockDateNow.mockReturnValue(1000000000 + 59000); // 59 seconds later (within default 60s)
    mockNotificationUtils.getNotifications.mockResolvedValue([notificationNoTimeout]);

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    await waitFor(() => {
      const element = screen.getByTestId(`notification-content-${notificationNoTimeout.id}`);
      expect(element).toHaveAttribute('data-default-open', 'true');
    });
  });

  it('handles error when adding notification', async () => {
    const error = new Error('Add error');
    mockNotificationUtils.getNotifications.mockRejectedValue(error);

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    // Get the message listener for push notifications
    const messageListener = mockServiceWorker.addEventListener.mock.calls.find((call) => call[0] === 'message')?.[1];

    // Simulate push notification message
    const mockEvent = {
      data: {
        type: 'PUSH_NOTIFICATION',
        payload: mockNotification
      }
    };

    await messageListener(mockEvent);

    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith('Error loading notifications:', error);
    });
  });

  it('only handles approval request notifications for push', async () => {
    const nonApprovalNotification = {
      ...mockNotification,
      type: 'OTHER_TYPE' as NotificationType
    };

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    // Get the message listener for push notifications
    const messageListener = mockServiceWorker.addEventListener.mock.calls.find((call) => call[0] === 'message')?.[1];

    // Simulate push notification message with non-approval type
    const mockEvent = {
      data: {
        type: 'PUSH_NOTIFICATION',
        payload: nonApprovalNotification
      }
    };

    await messageListener(mockEvent);

    // Should not call getNotifications for non-approval notifications
    expect(mockNotificationUtils.getNotifications).toHaveBeenCalledOnce(); // Only the initial call
  });

  it('cleans up expired notifications when interval runs', async () => {
    const expiredNotification = {
      ...mockNotification,
      timestamp: 1000000000,
      approval_request_info: {timeout_in_seconds: 30}
    };

    mockDateNow.mockReturnValue(1000040000); // 40 seconds later (expired)
    mockNotificationUtils.getNotifications.mockResolvedValue([expiredNotification]);

    let intervalCallback: (() => void) | undefined;
    mockSetInterval.mockImplementation((callback: () => void) => {
      intervalCallback = callback;
      return 123;
    });

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    await waitFor(() => {
      expect(mockSetInterval).toHaveBeenCalled();
    });

    // Run the interval callback
    if (intervalCallback) {
      intervalCallback();
    }

    await waitFor(() => {
      expect(mockNotificationUtils.removeNotification).toHaveBeenCalledWith(expiredNotification.id);
    });
  });

  it('does not setup interval when not mobile', () => {
    mockUseWindowSize.mockReturnValue({
      windowSize: {width: 1200, height: 800},
      isMobile: false,
      isTablet: false
    });

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    expect(mockSetInterval).not.toHaveBeenCalled();
  });

  it('does not setup interval when notifications array is empty', () => {
    mockNotificationUtils.getNotifications.mockResolvedValue([]);

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    expect(mockSetInterval).not.toHaveBeenCalled();
  });

  it('does not setup interval when not enabled', () => {
    mockUseNotificationUtils.mockReturnValue({
      ...mockNotificationUtilsContext,
      enabled: false
    });
    mockNotificationUtils.getNotifications.mockResolvedValue([mockNotification]);

    render(
      <NotificationsProvider>
        <div>Test</div>
      </NotificationsProvider>
    );

    expect(mockSetInterval).not.toHaveBeenCalled();
  });
});
