/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {describe, it, vi, beforeEach, expect, afterEach} from 'vitest';
import {render, screen, act} from '@testing-library/react';
import {PwaProvider, usePwa} from './pwa-provider';
import React from 'react';

// Mock virtual:pwa-register/react with factory function
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn()
}));

// Mock toast
vi.mock('@cisco-eti/spark-design', () => ({
  toast: vi.fn()
}));

// Mock global fetch
global.fetch = vi.fn();

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Get mocked functions after the mocks are set up
const mockUseRegisterSW = vi.mocked(await import('virtual:pwa-register/react')).useRegisterSW;
const mockToast = vi.mocked(await import('@cisco-eti/spark-design')).toast;

describe('PwaProvider', () => {
  const mockUpdateServiceWorker = vi.fn();
  const mockRegistration = {
    update: vi.fn()
  } as unknown as ServiceWorkerRegistration;

  const createMockUseRegisterSW = (
    options: {
      offlineReady?: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
      needRefresh?: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
      updateServiceWorker?: (reloadPage?: boolean) => Promise<void>;
    } = {}
  ) => ({
    offlineReady: options.offlineReady || [false, vi.fn() as React.Dispatch<React.SetStateAction<boolean>>],
    needRefresh: options.needRefresh || [false, vi.fn() as React.Dispatch<React.SetStateAction<boolean>>],
    updateServiceWorker: options.updateServiceWorker || mockUpdateServiceWorker
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Default mock implementation
    mockUseRegisterSW.mockReturnValue(createMockUseRegisterSW());

    // Reset fetch mock
    (global.fetch as any).mockResolvedValue({
      status: 200
    });

    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Provider Setup', () => {
    it('renders children correctly', () => {
      render(
        <PwaProvider PERIOD={5}>
          <div data-testid="child">Test Content</div>
        </PwaProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('provides correct initial context values', () => {
      const TestComponent = () => {
        const pwa = usePwa();
        return (
          <div>
            <span data-testid="offline-ready">{pwa.offlineReady.toString()}</span>
            <span data-testid="need-refresh">{pwa.needRefresh.toString()}</span>
            <span data-testid="sw-url">{pwa.swUrl || 'undefined'}</span>
            <span data-testid="sw-r">{pwa.swR ? 'defined' : 'undefined'}</span>
          </div>
        );
      };

      render(
        <PwaProvider PERIOD={5}>
          <TestComponent />
        </PwaProvider>
      );

      expect(screen.getByTestId('offline-ready')).toHaveTextContent('false');
      expect(screen.getByTestId('need-refresh')).toHaveTextContent('false');
      expect(screen.getByTestId('sw-url')).toHaveTextContent('undefined');
      expect(screen.getByTestId('sw-r')).toHaveTextContent('undefined');
    });

    it('calls useRegisterSW with correct options', () => {
      render(
        <PwaProvider PERIOD={5}>
          <div>Content</div>
        </PwaProvider>
      );

      expect(mockUseRegisterSW).toHaveBeenCalledWith({
        onRegisteredSW: expect.any(Function),
        onRegisterError: expect.any(Function),
        onOfflineReady: expect.any(Function),
        onNeedRefresh: expect.any(Function),
        immediate: true
      });
    });

    it('uses default PERIOD when not provided', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <PwaProvider>
          <div>Content</div>
        </PwaProvider>
      );

      const registerCalls = mockUseRegisterSW.mock.calls;
      expect(registerCalls.length).toBeGreaterThan(0);

      const registerOptions = registerCalls[0][0];

      if (registerOptions) {
        act(() => {
          registerOptions.onRegisteredSW!('test-sw-url', mockRegistration);
        });

        // Check that the periodic sync log shows the default 3600 milliseconds
        expect(consoleLogSpy).toHaveBeenCalledWith('🔄 Registering periodic sync every 3600 milliseconds...');
      }

      consoleLogSpy.mockRestore();
    });
  });

  describe('usePwa Hook', () => {
    it('throws error when used outside provider', () => {
      const TestComponent = () => {
        usePwa();
        return <div>Test</div>;
      };

      expect(() => render(<TestComponent />)).toThrow('usePwa must be used within a PwaProvider');
    });

    it('returns context when used within provider', () => {
      const TestComponent = () => {
        const pwa = usePwa();
        expect(pwa).toBeDefined();
        expect(pwa.closePwa).toBeInstanceOf(Function);
        expect(pwa.updateServiceWorker).toBeInstanceOf(Function);
        return <div>Test</div>;
      };

      render(
        <PwaProvider PERIOD={5}>
          <TestComponent />
        </PwaProvider>
      );
    });
  });

  describe('Service Worker Callbacks', () => {
    it('handles onRegisteredSW callback correctly', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <PwaProvider PERIOD={5}>
          <div>Content</div>
        </PwaProvider>
      );

      const calls = mockUseRegisterSW.mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      const registerOptions = calls[0][0];

      if (registerOptions) {
        act(() => {
          registerOptions.onRegisteredSW!('test-sw-url', mockRegistration);
        });
      }

      expect(consoleLogSpy).toHaveBeenCalledWith('✅ SW registered successfully:', 'test-sw-url');

      consoleLogSpy.mockRestore();
    });

    it('handles onRegisterError callback correctly', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const testError = new Error('Registration failed');

      render(
        <PwaProvider PERIOD={5}>
          <div>Content</div>
        </PwaProvider>
      );

      const calls = mockUseRegisterSW.mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      const registerOptions = calls[0][0];

      if (registerOptions) {
        act(() => {
          registerOptions.onRegisterError!(testError);
        });
      }

      expect(consoleLogSpy).toHaveBeenCalledWith('❌ SW registration error:', testError);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'SW Registration Error',
        description: 'There was an error registering the service worker. Please try again later.',
        type: 'error',
        showCloseButton: false
      });

      consoleLogSpy.mockRestore();
    });

    it('handles onOfflineReady callback correctly', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <PwaProvider PERIOD={5}>
          <div>Content</div>
        </PwaProvider>
      );

      const calls = mockUseRegisterSW.mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      const registerOptions = calls[0][0];

      if (registerOptions) {
        act(() => {
          registerOptions.onOfflineReady!();
        });
      }

      expect(consoleLogSpy).toHaveBeenCalledWith('✅ SW is ready to work offline.');

      consoleLogSpy.mockRestore();
    });

    it('handles onNeedRefresh callback correctly', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <PwaProvider PERIOD={5}>
          <div>Content</div>
        </PwaProvider>
      );

      const calls = mockUseRegisterSW.mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      const registerOptions = calls[0][0];

      if (registerOptions) {
        act(() => {
          registerOptions.onNeedRefresh!();
        });
      }

      expect(consoleLogSpy).toHaveBeenCalledWith('🔄 SW needs refresh.');

      consoleLogSpy.mockRestore();
    });
  });

  describe('Periodic Sync', () => {
    it('sets up periodic sync when service worker is registered', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <PwaProvider PERIOD={5}>
          <div>Content</div>
        </PwaProvider>
      );

      const registerCalls = mockUseRegisterSW.mock.calls;
      expect(registerCalls.length).toBeGreaterThan(0);

      const registerOptions = registerCalls[0][0];

      if (registerOptions) {
        act(() => {
          registerOptions.onRegisteredSW!('test-sw-url', mockRegistration);
        });

        expect(consoleLogSpy).toHaveBeenCalledWith('🔄 Registering periodic sync every 5 milliseconds...');
      }

      consoleLogSpy.mockRestore();
    });

    it('executes periodic sync when online and advances timers', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <PwaProvider PERIOD={5}>
          <div>Content</div>
        </PwaProvider>
      );

      const registerCalls = mockUseRegisterSW.mock.calls;
      expect(registerCalls.length).toBeGreaterThan(0);

      const registerOptions = registerCalls[0][0];

      if (registerOptions) {
        act(() => {
          registerOptions.onRegisteredSW!('test-sw-url', mockRegistration);
        });

        // Fast-forward time by 5ms to trigger the interval
        await act(async () => {
          vi.advanceTimersByTime(5);
        });

        // Verify fetch was called during the interval execution
        expect(global.fetch).toHaveBeenCalledWith('test-sw-url', {
          cache: 'no-store',
          headers: {
            cache: 'no-store',
            'cache-control': 'no-cache'
          }
        });

        expect(mockRegistration.update).toHaveBeenCalled();
      }

      consoleLogSpy.mockRestore();
    });

    it('skips periodic sync when offline', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      Object.defineProperty(navigator, 'onLine', {
        value: false
      });

      render(
        <PwaProvider PERIOD={5}>
          <div>Content</div>
        </PwaProvider>
      );

      const registerCalls = mockUseRegisterSW.mock.calls;
      expect(registerCalls.length).toBeGreaterThan(0);

      const registerOptions = registerCalls[0][0];

      if (registerOptions) {
        act(() => {
          registerOptions.onRegisteredSW!('test-sw-url', mockRegistration);
        });

        // Fast-forward time to trigger the interval
        await act(async () => {
          vi.advanceTimersByTime(5);
        });

        expect(global.fetch).not.toHaveBeenCalled();
        expect(mockRegistration.update).not.toHaveBeenCalled();
      }

      consoleLogSpy.mockRestore();
    });

    it('does not update service worker when fetch returns non-200 status', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      (global.fetch as any).mockResolvedValue({
        status: 404
      });

      render(
        <PwaProvider PERIOD={5}>
          <div>Content</div>
        </PwaProvider>
      );

      const registerCalls = mockUseRegisterSW.mock.calls;
      expect(registerCalls.length).toBeGreaterThan(0);

      const registerOptions = registerCalls[0][0];

      if (registerOptions) {
        act(() => {
          registerOptions.onRegisteredSW!('test-sw-url', mockRegistration);
        });

        // Fast-forward time to trigger the interval
        await act(async () => {
          vi.advanceTimersByTime(5);
        });

        expect(global.fetch).toHaveBeenCalled();
        expect(mockRegistration.update).not.toHaveBeenCalled();
      }

      consoleLogSpy.mockRestore();
    });

    it('handles fetch errors gracefully', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(
        <PwaProvider PERIOD={5}>
          <div>Content</div>
        </PwaProvider>
      );

      const registerCalls = mockUseRegisterSW.mock.calls;
      expect(registerCalls.length).toBeGreaterThan(0);

      const registerOptions = registerCalls[0][0];

      if (registerOptions) {
        act(() => {
          registerOptions.onRegisteredSW!('test-sw-url', mockRegistration);
        });

        // Fast-forward time to trigger the interval
        await act(async () => {
          vi.advanceTimersByTime(5);
        });

        // Verify that the error was logged
        expect(consoleErrorSpy).toHaveBeenCalledWith('Periodic sync fetch error:', expect.any(Error));
        // Verify that the service worker update was not called
        expect(mockRegistration.update).not.toHaveBeenCalled();
      }

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('skips periodic sync setup when period is zero', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <PwaProvider PERIOD={0}>
          <div>Content</div>
        </PwaProvider>
      );

      const registerCalls = mockUseRegisterSW.mock.calls;
      expect(registerCalls.length).toBeGreaterThan(0);

      const registerOptions = registerCalls[0][0];

      if (registerOptions) {
        act(() => {
          registerOptions.onRegisteredSW!('test-sw-url', mockRegistration);
        });

        // Since period is 0, periodic sync should not be logged
        expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Registering periodic sync'));
      }

      consoleLogSpy.mockRestore();
    });

    it('skips periodic sync setup when period is negative', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <PwaProvider PERIOD={-1}>
          <div>Content</div>
        </PwaProvider>
      );

      const registerCalls = mockUseRegisterSW.mock.calls;
      expect(registerCalls.length).toBeGreaterThan(0);

      const registerOptions = registerCalls[0][0];

      if (registerOptions) {
        act(() => {
          registerOptions.onRegisteredSW!('test-sw-url', mockRegistration);
        });

        // Since period is negative, periodic sync should not be logged
        expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Registering periodic sync'));
      }

      consoleLogSpy.mockRestore();
    });

    it('logs periodic sync registration with correct period', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <PwaProvider PERIOD={5}>
          <div>Content</div>
        </PwaProvider>
      );

      const registerCalls = mockUseRegisterSW.mock.calls;
      expect(registerCalls.length).toBeGreaterThan(0);

      const registerOptions = registerCalls[0][0];

      if (registerOptions) {
        act(() => {
          registerOptions.onRegisteredSW!('test-sw-url', mockRegistration);
        });

        expect(consoleLogSpy).toHaveBeenCalledWith('🔄 Registering periodic sync every 5 milliseconds...');
      }

      consoleLogSpy.mockRestore();
    });

    it('handles navigator without onLine property', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Mock navigator to not have onLine property
      const originalNavigator = global.navigator;
      // @ts-expect-error - Intentionally creating navigator without onLine
      global.navigator = {
        userAgent: originalNavigator.userAgent
        // Deliberately omit onLine property
      };

      render(
        <PwaProvider PERIOD={5}>
          <div>Content</div>
        </PwaProvider>
      );

      const registerCalls = mockUseRegisterSW.mock.calls;
      expect(registerCalls.length).toBeGreaterThan(0);

      const registerOptions = registerCalls[0][0];

      if (registerOptions) {
        act(() => {
          registerOptions.onRegisteredSW!('test-sw-url', mockRegistration);
        });

        // Fast-forward time to trigger the interval
        await act(async () => {
          vi.advanceTimersByTime(5);
        });

        // Should still perform fetch when onLine property doesn't exist
        expect(global.fetch).toHaveBeenCalled();
      }

      // Restore original navigator
      global.navigator = originalNavigator;

      consoleLogSpy.mockRestore();
    });

    it('executes multiple periodic sync cycles', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <PwaProvider PERIOD={5}>
          <div>Content</div>
        </PwaProvider>
      );

      const registerCalls = mockUseRegisterSW.mock.calls;
      expect(registerCalls.length).toBeGreaterThan(0);

      const registerOptions = registerCalls[0][0];

      if (registerOptions) {
        act(() => {
          registerOptions.onRegisteredSW!('test-sw-url', mockRegistration);
        });

        // Since PERIOD is 5ms, advancing by 15ms should trigger the interval 3 times
        await act(async () => {
          vi.advanceTimersByTime(15);
        });

        // Should have called fetch 3 times (at 5ms, 10ms, and 15ms)
        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(mockRegistration.update).toHaveBeenCalledTimes(3);
      }

      consoleLogSpy.mockRestore();
    });
  });

  describe('closePwa Function', () => {
    it('resets state when closePwa is called', () => {
      const mockSetOfflineReady = vi.fn() as React.Dispatch<React.SetStateAction<boolean>>;
      const mockSetNeedRefresh = vi.fn() as React.Dispatch<React.SetStateAction<boolean>>;

      mockUseRegisterSW.mockReturnValue(
        createMockUseRegisterSW({
          offlineReady: [true, mockSetOfflineReady],
          needRefresh: [true, mockSetNeedRefresh]
        })
      );

      const TestComponent = () => {
        const pwa = usePwa();
        return (
          <button data-testid="close-button" onClick={pwa.closePwa}>
            Close
          </button>
        );
      };

      render(
        <PwaProvider PERIOD={5}>
          <TestComponent />
        </PwaProvider>
      );

      act(() => {
        screen.getByTestId('close-button').click();
      });

      expect(mockSetOfflineReady).toHaveBeenCalledWith(false);
      expect(mockSetNeedRefresh).toHaveBeenCalledWith(false);
    });
  });

  describe('Context Values', () => {
    it('provides updateServiceWorker function from useRegisterSW', () => {
      const TestComponent = () => {
        const pwa = usePwa();
        expect(pwa.updateServiceWorker).toBe(mockUpdateServiceWorker);
        return <div>Test</div>;
      };

      render(
        <PwaProvider PERIOD={5}>
          <TestComponent />
        </PwaProvider>
      );
    });

    it('updates swUrl and swR when service worker is registered', () => {
      const TestComponent = () => {
        const pwa = usePwa();
        return (
          <div>
            <span data-testid="sw-url">{pwa.swUrl || 'undefined'}</span>
            <span data-testid="sw-r">{pwa.swR ? 'defined' : 'undefined'}</span>
          </div>
        );
      };

      render(
        <PwaProvider PERIOD={5}>
          <TestComponent />
        </PwaProvider>
      );

      expect(screen.getByTestId('sw-url')).toHaveTextContent('undefined');
      expect(screen.getByTestId('sw-r')).toHaveTextContent('undefined');

      const registerCalls = mockUseRegisterSW.mock.calls;
      expect(registerCalls.length).toBeGreaterThan(0);

      const registerOptions = registerCalls[0][0];

      if (registerOptions) {
        act(() => {
          registerOptions.onRegisteredSW!('test-sw-url', mockRegistration);
        });
      }

      expect(screen.getByTestId('sw-url')).toHaveTextContent('test-sw-url');
      expect(screen.getByTestId('sw-r')).toHaveTextContent('defined');
    });
  });

  describe('Edge Cases', () => {
    it('handles null service worker registration', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <PwaProvider PERIOD={5}>
          <div>Content</div>
        </PwaProvider>
      );

      const registerCalls = mockUseRegisterSW.mock.calls;
      expect(registerCalls.length).toBeGreaterThan(0);

      const registerOptions = registerCalls[0][0];

      if (registerOptions) {
        act(() => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          registerOptions.onRegisteredSW!('test-sw-url', null as any);
        });
      }

      // Should not set up periodic sync with null registration
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Registering periodic sync'));

      consoleLogSpy.mockRestore();
    });

    it('handles undefined service worker registration', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <PwaProvider PERIOD={5}>
          <div>Content</div>
        </PwaProvider>
      );

      const registerCalls = mockUseRegisterSW.mock.calls;
      expect(registerCalls.length).toBeGreaterThan(0);

      const registerOptions = registerCalls[0][0];

      if (registerOptions) {
        act(() => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          registerOptions.onRegisteredSW!('test-sw-url', undefined as any);
        });
      }

      // Should not set up periodic sync with undefined registration
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Registering periodic sync'));

      consoleLogSpy.mockRestore();
    });

    it('renders multiple children correctly', () => {
      render(
        <PwaProvider PERIOD={5}>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <span data-testid="child-3">Child 3</span>
        </PwaProvider>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });
  });
});
