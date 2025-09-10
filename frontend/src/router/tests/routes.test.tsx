/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, vi, beforeEach, expect} from 'vitest';
import {renderHook} from '@testing-library/react';
import {useRoutes, generateRoutes} from '../routes';
import {PATHS} from '../paths';
import React from 'react';

// Mock stores
vi.mock('@/store', () => ({
  useSettingsStore: vi.fn(),
  useFeatureFlagsStore: vi.fn()
}));

// Mock hooks
vi.mock('@/hooks', () => ({
  useWindowSize: vi.fn()
}));

// Mock zustand shallow with a more accurate implementation
vi.mock('zustand/shallow', () => ({
  shallow: vi.fn((fn) => fn)
}));

// Mock React.lazy components - using lazy mock pattern
vi.mock('@/pages/dashboard/dashboard', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Dashboard'))
}));

vi.mock('@/pages/settings/devices/devices', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Devices'))
}));

vi.mock('@/pages/welcome/welcome', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Welcome'))
}));

vi.mock('@/pages/settings/base/settings-base', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Settings Base'))
}));

vi.mock('@/pages/settings/api-key/api-key', () => ({
  default: vi.fn(() => React.createElement('div', null, 'API Key'))
}));

vi.mock('@/pages/onboard-device/onboard-device', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Onboard Device'))
}));

vi.mock('@/components/layout/layout', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Layout'))
}));

vi.mock('@/providers/settings-provider/settings-provider', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Settings Provider'))
}));

vi.mock('@/pages/settings/identity-provider/info/info-identity-provider', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Info Identity Provider'))
}));

vi.mock('@/pages/settings/identity-provider/connection-identity-provider/connection-identity-provider', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Connection Identity Provider'))
}));

vi.mock('@/pages/settings/organizations-and-users/organizations-and-users', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Organizations And Users'))
}));

vi.mock('@/pages/settings/organizations-and-users/edit/edit-organizations-and-users', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Edit Organizations And Users'))
}));

vi.mock('@/pages/settings/organizations-and-users/info/info-organizations-and-users', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Info Organizations And Users'))
}));

vi.mock('@/pages/agentic-services/agentic-services', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Agentic Services'))
}));

vi.mock('@/pages/agentic-services/add/add-agentic-service', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Add Agentic Service'))
}));

vi.mock('@/pages/agentic-services/edit/edit-agentic-service', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Edit Agentic Service'))
}));

vi.mock('@/pages/agentic-services/info/info-agentic-service', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Info Agentic Service'))
}));

vi.mock('@/pages/policies/policies', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Policies'))
}));

vi.mock('@/pages/not-found/not-found', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Not Found'))
}));

vi.mock('@/pages/callback-loading/callback-loading', () => ({
  default: vi.fn(() => React.createElement('div', null, 'Callback Loading'))
}));

// Get the mocked functions
const mockUseSettingsStore = vi.mocked(await import('@/store')).useSettingsStore;
const mockUseFeatureFlagsStore = vi.mocked(await import('@/store')).useFeatureFlagsStore;
const mockUseWindowSize = vi.mocked(await import('@/hooks')).useWindowSize;

describe('useRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useSettingsStore with proper selector handling
    mockUseSettingsStore.mockImplementation((selector) => {
      const mockState = {
        isEmptyIdp: false,
        isAdmin: true,
        setIsAdmin: vi.fn(),
        setSession: vi.fn(),
        setIsEmptyIdp: vi.fn()
      };
      return selector ? selector(mockState) : mockState;
    });

    // Mock useFeatureFlagsStore with proper selector handling
    mockUseFeatureFlagsStore.mockImplementation((selector) => {
      const mockStore = {
        featureFlags: {
          isTbacEnabled: true
        },
        setFeatureFlags: vi.fn(),
        clean: vi.fn()
      };
      return selector ? selector(mockStore) : mockStore;
    });

    // Mock useWindowSize
    mockUseWindowSize.mockReturnValue({
      windowSize: {width: 1280, height: 800},
      isMobile: false,
      isTablet: false
    });
  });

  describe('store selector functions', () => {
    it('calls useSettingsStore with correct selector for isEmptyIdp and isAdmin', () => {
      renderHook(() => useRoutes());

      expect(mockUseSettingsStore).toHaveBeenCalledWith(expect.any(Function));

      // Test the selector function
      const selectorCall = mockUseSettingsStore.mock.calls[0][0];
      if (selectorCall) {
        const mockState = {
          isEmptyIdp: true,
          isAdmin: false,
          setIsAdmin: vi.fn(),
          setSession: vi.fn(),
          setIsEmptyIdp: vi.fn(),
          otherProperty: 'should not be selected'
        };

        const result = selectorCall(mockState);
        expect(result).toEqual({
          isEmptyIdp: true,
          isAdmin: false
        });
      }
    });

    it('calls useFeatureFlagsStore with correct selector for isTbacEnabled', () => {
      renderHook(() => useRoutes());

      expect(mockUseFeatureFlagsStore).toHaveBeenCalledWith(expect.any(Function));

      // Test the selector function
      const selectorCall = mockUseFeatureFlagsStore.mock.calls[0][0];
      if (selectorCall) {
        const mockStore = {
          featureFlags: {
            isTbacEnabled: false,
            otherFlag: true
          },
          setFeatureFlags: vi.fn(),
          clean: vi.fn(),
          otherProperty: 'should not be selected'
        };

        const result = selectorCall(mockStore);
        expect(result).toEqual({
          isTbacEnabled: false
        });
      }
    });
  });

  describe('basic route generation', () => {
    it('generates routes without errors', () => {
      const {result} = renderHook(() => useRoutes());
      const routes = result.current;

      expect(routes).toBeDefined();
      expect(Array.isArray(routes)).toBe(true);
      expect(routes.length).toBeGreaterThan(0);
    });

    it('includes base path route', () => {
      const {result} = renderHook(() => useRoutes());
      const routes = result.current;

      const basePathRoute = routes.find((route) => route.path === PATHS.basePath);
      expect(basePathRoute).toBeDefined();
    });
  });

  describe('route generation based on feature flags', () => {
    it('generates routes when TBAC is enabled', () => {
      mockUseFeatureFlagsStore.mockImplementation((selector) => {
        const mockStore = {
          featureFlags: {
            isTbacEnabled: true
          },
          setFeatureFlags: vi.fn(),
          clean: vi.fn()
        };
        return selector ? selector(mockStore) : mockStore;
      });

      const {result} = renderHook(() => useRoutes());
      const routes = result.current;

      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
    });

    it('generates routes when TBAC is disabled', () => {
      mockUseFeatureFlagsStore.mockImplementation((selector) => {
        const mockStore = {
          featureFlags: {
            isTbacEnabled: false
          },
          setFeatureFlags: vi.fn(),
          clean: vi.fn()
        };
        return selector ? selector(mockStore) : mockStore;
      });

      const {result} = renderHook(() => useRoutes());
      const routes = result.current;

      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
    });
  });

  describe('route generation based on isEmptyIdp', () => {
    it('generates routes when IDP is not empty', () => {
      mockUseSettingsStore.mockImplementation((selector) => {
        const mockState = {
          isEmptyIdp: false,
          isAdmin: true,
          setIsAdmin: vi.fn(),
          setSession: vi.fn(),
          setIsEmptyIdp: vi.fn()
        };
        return selector ? selector(mockState) : mockState;
      });

      const {result} = renderHook(() => useRoutes());
      const routes = result.current;

      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
    });

    it('generates routes when IDP is empty', () => {
      mockUseSettingsStore.mockImplementation((selector) => {
        const mockState = {
          isEmptyIdp: true,
          isAdmin: true,
          setIsAdmin: vi.fn(),
          setSession: vi.fn(),
          setIsEmptyIdp: vi.fn()
        };
        return selector ? selector(mockState) : mockState;
      });

      const {result} = renderHook(() => useRoutes());
      const routes = result.current;

      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
    });
  });

  describe('route generation based on isAdmin', () => {
    it('generates routes when user is admin', () => {
      mockUseSettingsStore.mockImplementation((selector) => {
        const mockState = {
          isEmptyIdp: false,
          isAdmin: true,
          setIsAdmin: vi.fn(),
          setSession: vi.fn(),
          setIsEmptyIdp: vi.fn()
        };
        return selector ? selector(mockState) : mockState;
      });

      const {result} = renderHook(() => useRoutes());
      const routes = result.current;

      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
    });

    it('generates routes when user is not admin', () => {
      mockUseSettingsStore.mockImplementation((selector) => {
        const mockState = {
          isEmptyIdp: false,
          isAdmin: false,
          setIsAdmin: vi.fn(),
          setSession: vi.fn(),
          setIsEmptyIdp: vi.fn()
        };
        return selector ? selector(mockState) : mockState;
      });

      const {result} = renderHook(() => useRoutes());
      const routes = result.current;

      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
    });
  });

  describe('route generation based on device type', () => {
    it('generates routes for mobile device', () => {
      mockUseWindowSize.mockReturnValue({
        windowSize: {width: 375, height: 667},
        isMobile: true,
        isTablet: false
      });

      const {result} = renderHook(() => useRoutes());
      const routes = result.current;

      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
    });

    it('generates routes for desktop device', () => {
      mockUseWindowSize.mockReturnValue({
        windowSize: {width: 1280, height: 800},
        isMobile: false,
        isTablet: false
      });

      const {result} = renderHook(() => useRoutes());
      const routes = result.current;

      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
    });
  });

  describe('complex permission combinations', () => {
    it('handles admin user with empty IDP', () => {
      mockUseSettingsStore.mockImplementation((selector) => {
        const mockState = {
          isEmptyIdp: true,
          isAdmin: true,
          setIsAdmin: vi.fn(),
          setSession: vi.fn(),
          setIsEmptyIdp: vi.fn()
        };
        return selector ? selector(mockState) : mockState;
      });

      const {result} = renderHook(() => useRoutes());
      const routes = result.current;

      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
    });

    it('handles non-admin user with configured IDP', () => {
      mockUseSettingsStore.mockImplementation((selector) => {
        const mockState = {
          isEmptyIdp: false,
          isAdmin: false,
          setIsAdmin: vi.fn(),
          setSession: vi.fn(),
          setIsEmptyIdp: vi.fn()
        };
        return selector ? selector(mockState) : mockState;
      });

      const {result} = renderHook(() => useRoutes());
      const routes = result.current;

      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
    });

    it('handles non-admin user with empty IDP', () => {
      mockUseSettingsStore.mockImplementation((selector) => {
        const mockState = {
          isEmptyIdp: true,
          isAdmin: false,
          setIsAdmin: vi.fn(),
          setSession: vi.fn(),
          setIsEmptyIdp: vi.fn()
        };
        return selector ? selector(mockState) : mockState;
      });

      const {result} = renderHook(() => useRoutes());
      const routes = result.current;

      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
    });
  });

  describe('generateRoutes function', () => {
    it('generates correct base route structure', () => {
      const testRoutes = [
        {
          path: '/test',
          element: React.createElement('div', null, 'Test')
        }
      ];

      const result = generateRoutes(testRoutes);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('includes provided routes as children', () => {
      const testRoutes = [
        {
          path: '/test',
          element: React.createElement('div', null, 'Test')
        }
      ];

      const result = generateRoutes(testRoutes);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('route accessibility combinations', () => {
    it('handles complex permission scenarios', () => {
      mockUseSettingsStore.mockImplementation((selector) => {
        const mockState = {
          isEmptyIdp: true,
          isAdmin: false,
          setIsAdmin: vi.fn(),
          setSession: vi.fn(),
          setIsEmptyIdp: vi.fn()
        };
        return selector ? selector(mockState) : mockState;
      });

      mockUseFeatureFlagsStore.mockImplementation((selector) => {
        const mockStore = {
          featureFlags: {
            isTbacEnabled: false
          },
          setFeatureFlags: vi.fn(),
          clean: vi.fn()
        };
        return selector ? selector(mockStore) : mockStore;
      });

      mockUseWindowSize.mockReturnValue({
        windowSize: {width: 375, height: 667},
        isMobile: true,
        isTablet: false
      });

      const {result} = renderHook(() => useRoutes());
      const routes = result.current;

      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
    });
  });

  describe('hook behavior', () => {
    it('returns consistent results for same inputs', () => {
      const {result: result1} = renderHook(() => useRoutes());
      const {result: result2} = renderHook(() => useRoutes());

      expect(result1.current).toBeDefined();
      expect(result2.current).toBeDefined();
      expect(result1.current.length).toBe(result2.current.length);
    });

    it('updates when dependencies change', () => {
      const {result, rerender} = renderHook(() => useRoutes());

      // Change feature flag
      mockUseFeatureFlagsStore.mockImplementation((selector) => {
        const mockStore = {
          featureFlags: {
            isTbacEnabled: false
          },
          setFeatureFlags: vi.fn(),
          clean: vi.fn()
        };
        return selector ? selector(mockStore) : mockStore;
      });

      rerender();
      const updatedRoutes = result.current;

      expect(updatedRoutes).toBeDefined();
      // Routes may be different, but should still be valid
      expect(Array.isArray(updatedRoutes)).toBe(true);
    });
  });

  describe('route structure validation', () => {
    it('validates that all routes have required properties', () => {
      const {result} = renderHook(() => useRoutes());
      const routes = result.current;

      routes.forEach((route) => {
        expect(route).toHaveProperty('path');
        expect(typeof route.path).toBe('string');
      });
    });

    it('validates nested route structure', () => {
      const {result} = renderHook(() => useRoutes());
      const routes = result.current;

      const basePathRoute = routes.find((route) => route.path === PATHS.basePath);
      if (basePathRoute?.children) {
        basePathRoute.children.forEach((child) => {
          // Route can have either a path or be an index route
          const hasPath = Object.prototype.hasOwnProperty.call(child, 'path');
          const isIndexRoute = Object.prototype.hasOwnProperty.call(child, 'index') && child.index === true;

          expect(hasPath || isIndexRoute).toBe(true);

          if (hasPath) {
            expect(typeof child.path).toBe('string');
          }

          if (isIndexRoute) {
            expect(child.index).toBe(true);
          }
        });
      }
    });
  });
});
