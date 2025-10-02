/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, expect, beforeEach, vi} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useLocalStore} from '../';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useLocalStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage to return null (empty state)
    localStorageMock.getItem.mockReturnValue(null);

    // Reset store to initial state before each test
    const {result} = renderHook(() => useLocalStore());
    act(() => {
      result.current.cleanThemeStore();
    });
  });

  describe('initial state', () => {
    it('has correct initial local state', () => {
      const {result} = renderHook(() => useLocalStore());

      expect(result.current.onBoarded).toBe(false);
      expect(result.current.idDevice).toBeUndefined();
    });
  });

  describe('setOnBoarded', () => {
    it('sets onboarded status to true', () => {
      const {result} = renderHook(() => useLocalStore());

      act(() => {
        result.current.setOnBoarded(true);
      });

      expect(result.current.onBoarded).toBe(true);
    });

    it('sets onboarded status to false', () => {
      const {result} = renderHook(() => useLocalStore());

      // First set to true
      act(() => {
        result.current.setOnBoarded(true);
      });

      expect(result.current.onBoarded).toBe(true);

      // Then set to false
      act(() => {
        result.current.setOnBoarded(false);
      });

      expect(result.current.onBoarded).toBe(false);
    });

    it('can be called multiple times with same value', () => {
      const {result} = renderHook(() => useLocalStore());

      act(() => {
        result.current.setOnBoarded(true);
        result.current.setOnBoarded(true);
      });

      expect(result.current.onBoarded).toBe(true);
    });
  });

  describe('setIdDevice', () => {
    it('sets device ID', () => {
      const {result} = renderHook(() => useLocalStore());
      const deviceId = 'device-123';

      act(() => {
        result.current.setIdDevice(deviceId);
      });

      expect(result.current.idDevice).toBe(deviceId);
    });

    it('sets device ID to undefined', () => {
      const {result} = renderHook(() => useLocalStore());

      // First set a device ID
      act(() => {
        result.current.setIdDevice('device-123');
      });

      expect(result.current.idDevice).toBe('device-123');

      // Then set to undefined
      act(() => {
        result.current.setIdDevice(undefined);
      });

      expect(result.current.idDevice).toBeUndefined();
    });

    it('updates device ID when called multiple times', () => {
      const {result} = renderHook(() => useLocalStore());

      act(() => {
        result.current.setIdDevice('device-1');
      });

      expect(result.current.idDevice).toBe('device-1');

      act(() => {
        result.current.setIdDevice('device-2');
      });

      expect(result.current.idDevice).toBe('device-2');
    });

    it('handles string device IDs correctly', () => {
      const {result} = renderHook(() => useLocalStore());
      const deviceIds = ['device-abc', 'device-123', 'very-long-device-id-string'];

      deviceIds.forEach((deviceId) => {
        act(() => {
          result.current.setIdDevice(deviceId);
        });
        expect(result.current.idDevice).toBe(deviceId);
      });
    });
  });

  describe('cleanThemeStore', () => {
    it('resets all state to initial values', () => {
      const {result} = renderHook(() => useLocalStore());

      // Set some values
      act(() => {
        result.current.setOnBoarded(true);
        result.current.setIdDevice('device-123');
      });

      expect(result.current.onBoarded).toBe(true);
      expect(result.current.idDevice).toBe('device-123');

      // Clean the store
      act(() => {
        result.current.cleanThemeStore();
      });

      expect(result.current.onBoarded).toBe(false);
      expect(result.current.idDevice).toBeUndefined();
    });

    it('can be called multiple times safely', () => {
      const {result} = renderHook(() => useLocalStore());

      act(() => {
        result.current.cleanThemeStore();
        result.current.cleanThemeStore();
      });

      expect(result.current.onBoarded).toBe(false);
      expect(result.current.idDevice).toBeUndefined();
    });

    it('resets state even when called without prior changes', () => {
      const {result} = renderHook(() => useLocalStore());

      // Clean without setting any values first
      act(() => {
        result.current.cleanThemeStore();
      });

      expect(result.current.onBoarded).toBe(false);
      expect(result.current.idDevice).toBeUndefined();
    });
  });

  describe('store integration', () => {
    it('maintains state across multiple hook instances', () => {
      const {result: result1} = renderHook(() => useLocalStore());
      const {result: result2} = renderHook(() => useLocalStore());

      act(() => {
        result1.current.setOnBoarded(true);
        result1.current.setIdDevice('device-123');
      });

      expect(result2.current.onBoarded).toBe(true);
      expect(result2.current.idDevice).toBe('device-123');
    });

    it('updates all subscribers when state changes', () => {
      const {result: result1} = renderHook(() => useLocalStore());
      const {result: result2} = renderHook(() => useLocalStore());

      act(() => {
        result1.current.setOnBoarded(true);
      });

      expect(result1.current.onBoarded).toBe(true);
      expect(result2.current.onBoarded).toBe(true);
    });

    it('synchronizes clean operations across instances', () => {
      const {result: result1} = renderHook(() => useLocalStore());
      const {result: result2} = renderHook(() => useLocalStore());

      // Set values in one instance
      act(() => {
        result1.current.setOnBoarded(true);
        result1.current.setIdDevice('device-123');
      });

      expect(result2.current.onBoarded).toBe(true);
      expect(result2.current.idDevice).toBe('device-123');

      // Clean from the other instance
      act(() => {
        result2.current.cleanThemeStore();
      });

      expect(result1.current.onBoarded).toBe(false);
      expect(result1.current.idDevice).toBeUndefined();
    });
  });

  describe('combined operations', () => {
    it('handles multiple state updates in sequence', () => {
      const {result} = renderHook(() => useLocalStore());

      act(() => {
        result.current.setOnBoarded(true);
        result.current.setIdDevice('device-123');
        result.current.setOnBoarded(false);
        result.current.setIdDevice('device-456');
      });

      expect(result.current.onBoarded).toBe(false);
      expect(result.current.idDevice).toBe('device-456');
    });

    it('handles set then clean sequence', () => {
      const {result} = renderHook(() => useLocalStore());

      act(() => {
        result.current.setOnBoarded(true);
        result.current.setIdDevice('device-123');
        result.current.cleanThemeStore();
      });

      expect(result.current.onBoarded).toBe(false);
      expect(result.current.idDevice).toBeUndefined();
    });

    it('handles rapid state changes correctly', () => {
      const {result} = renderHook(() => useLocalStore());

      act(() => {
        result.current.setOnBoarded(true);
        result.current.setOnBoarded(false);
        result.current.setOnBoarded(true);
        result.current.setIdDevice('device-1');
        result.current.setIdDevice('device-2');
        result.current.setIdDevice('device-3');
      });

      expect(result.current.onBoarded).toBe(true);
      expect(result.current.idDevice).toBe('device-3');
    });

    it('handles mixed operations with undefined values', () => {
      const {result} = renderHook(() => useLocalStore());

      act(() => {
        result.current.setOnBoarded(true);
        result.current.setIdDevice('device-123');
        result.current.setIdDevice(undefined);
        result.current.setOnBoarded(false);
      });

      expect(result.current.onBoarded).toBe(false);
      expect(result.current.idDevice).toBeUndefined();
    });
  });

  describe('state consistency', () => {
    it('maintains consistent state types', () => {
      const {result} = renderHook(() => useLocalStore());

      expect(typeof result.current.onBoarded).toBe('boolean');
      expect(['undefined', 'string'].includes(typeof result.current.idDevice)).toBe(true);

      act(() => {
        result.current.setOnBoarded(true);
        result.current.setIdDevice('device-123');
      });

      expect(typeof result.current.onBoarded).toBe('boolean');
      expect(typeof result.current.idDevice).toBe('string');
    });

    it('preserves function references', () => {
      const {result: result1} = renderHook(() => useLocalStore());
      const {result: result2} = renderHook(() => useLocalStore());

      expect(result1.current.setOnBoarded).toBe(result2.current.setOnBoarded);
      expect(result1.current.setIdDevice).toBe(result2.current.setIdDevice);
      expect(result1.current.cleanThemeStore).toBe(result2.current.cleanThemeStore);
    });
  });
});
