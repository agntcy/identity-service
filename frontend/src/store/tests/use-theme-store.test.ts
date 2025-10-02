/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, expect, beforeEach} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useThemeStore} from '../';

describe('useThemeStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const {result} = renderHook(() => useThemeStore());
    act(() => {
      result.current.setDarkMode(false);
    });
  });

  describe('initial state', () => {
    it('has correct initial theme state', () => {
      const {result} = renderHook(() => useThemeStore());

      expect(result.current.isDarkMode).toBe(false);
    });
  });

  describe('setDarkMode', () => {
    it('sets dark mode to true', () => {
      const {result} = renderHook(() => useThemeStore());

      act(() => {
        result.current.setDarkMode(true);
      });

      expect(result.current.isDarkMode).toBe(true);
    });

    it('sets dark mode to false', () => {
      const {result} = renderHook(() => useThemeStore());

      // First set to true
      act(() => {
        result.current.setDarkMode(true);
      });

      expect(result.current.isDarkMode).toBe(true);

      // Then set to false
      act(() => {
        result.current.setDarkMode(false);
      });

      expect(result.current.isDarkMode).toBe(false);
    });

    it('can be called multiple times with same value', () => {
      const {result} = renderHook(() => useThemeStore());

      act(() => {
        result.current.setDarkMode(true);
        result.current.setDarkMode(true);
        result.current.setDarkMode(true);
      });

      expect(result.current.isDarkMode).toBe(true);
    });
  });

  describe('toggleDarkMode', () => {
    it('toggles from light to dark mode', () => {
      const {result} = renderHook(() => useThemeStore());

      expect(result.current.isDarkMode).toBe(false);

      act(() => {
        result.current.toggleDarkMode();
      });

      expect(result.current.isDarkMode).toBe(true);
    });

    it('toggles from dark to light mode', () => {
      const {result} = renderHook(() => useThemeStore());

      // Set to dark mode first
      act(() => {
        result.current.setDarkMode(true);
      });

      expect(result.current.isDarkMode).toBe(true);

      // Toggle back to light
      act(() => {
        result.current.toggleDarkMode();
      });

      expect(result.current.isDarkMode).toBe(false);
    });

    it('handles multiple toggles correctly', () => {
      const {result} = renderHook(() => useThemeStore());

      expect(result.current.isDarkMode).toBe(false);

      act(() => {
        result.current.toggleDarkMode(); // true
        result.current.toggleDarkMode(); // false
        result.current.toggleDarkMode(); // true
      });

      expect(result.current.isDarkMode).toBe(true);
    });
  });

  describe('store integration', () => {
    it('maintains state across multiple hook instances', () => {
      const {result: result1} = renderHook(() => useThemeStore());
      const {result: result2} = renderHook(() => useThemeStore());

      act(() => {
        result1.current.setDarkMode(true);
      });

      expect(result2.current.isDarkMode).toBe(true);
    });

    it('updates all subscribers when state changes', () => {
      const {result: result1} = renderHook(() => useThemeStore());
      const {result: result2} = renderHook(() => useThemeStore());

      act(() => {
        result1.current.toggleDarkMode();
      });

      expect(result1.current.isDarkMode).toBe(true);
      expect(result2.current.isDarkMode).toBe(true);
    });
  });

  describe('mixed operations', () => {
    it('handles combination of set and toggle operations', () => {
      const {result} = renderHook(() => useThemeStore());

      act(() => {
        result.current.setDarkMode(true);
        result.current.toggleDarkMode();
        result.current.setDarkMode(true);
        result.current.toggleDarkMode();
      });

      expect(result.current.isDarkMode).toBe(false);
    });
  });
});
