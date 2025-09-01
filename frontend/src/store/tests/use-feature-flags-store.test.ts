/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, expect, beforeEach} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useFeatureFlagsStore} from '..';

describe('useFeatureFlagsStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const {result} = renderHook(() => useFeatureFlagsStore());
    act(() => {
      result.current.clean();
    });
  });

  describe('initial state', () => {
    it('has correct initial feature flags', () => {
      const {result} = renderHook(() => useFeatureFlagsStore());

      expect(result.current.featureFlags).toEqual({
        isTbacEnabled: true
      });
    });
  });

  describe('setFeatureFlags', () => {
    it('updates feature flags with partial values', () => {
      const {result} = renderHook(() => useFeatureFlagsStore());

      act(() => {
        result.current.setFeatureFlags({
          isTbacEnabled: false
        });
      });

      expect(result.current.featureFlags.isTbacEnabled).toBe(false);
    });

    it('merges partial updates with existing flags', () => {
      const {result} = renderHook(() => useFeatureFlagsStore());

      // Set initial state
      act(() => {
        result.current.setFeatureFlags({
          isTbacEnabled: false
        });
      });

      // Update back to true
      act(() => {
        result.current.setFeatureFlags({
          isTbacEnabled: true
        });
      });

      expect(result.current.featureFlags.isTbacEnabled).toBe(true);
    });

    it('preserves existing flags when updating with empty object', () => {
      const {result} = renderHook(() => useFeatureFlagsStore());

      // Set initial state
      act(() => {
        result.current.setFeatureFlags({
          isTbacEnabled: false
        });
      });

      // Update with empty object should preserve existing
      act(() => {
        result.current.setFeatureFlags({});
      });

      expect(result.current.featureFlags.isTbacEnabled).toBe(false);
    });
  });

  describe('clean', () => {
    it('resets feature flags to initial state', () => {
      const {result} = renderHook(() => useFeatureFlagsStore());

      // Modify state
      act(() => {
        result.current.setFeatureFlags({
          isTbacEnabled: false
        });
      });

      expect(result.current.featureFlags.isTbacEnabled).toBe(false);

      // Clean state
      act(() => {
        result.current.clean();
      });

      expect(result.current.featureFlags).toEqual({
        isTbacEnabled: true
      });
    });

    it('can be called multiple times safely', () => {
      const {result} = renderHook(() => useFeatureFlagsStore());

      act(() => {
        result.current.clean();
        result.current.clean();
      });

      expect(result.current.featureFlags).toEqual({
        isTbacEnabled: true
      });
    });
  });

  describe('store integration', () => {
    it('maintains state across multiple hook instances', () => {
      const {result: result1} = renderHook(() => useFeatureFlagsStore());
      const {result: result2} = renderHook(() => useFeatureFlagsStore());

      act(() => {
        result1.current.setFeatureFlags({
          isTbacEnabled: false
        });
      });

      expect(result2.current.featureFlags.isTbacEnabled).toBe(false);
    });

    it('updates all subscribers when state changes', () => {
      const {result: result1} = renderHook(() => useFeatureFlagsStore());
      const {result: result2} = renderHook(() => useFeatureFlagsStore());

      act(() => {
        result1.current.setFeatureFlags({
          isTbacEnabled: false
        });
      });

      expect(result1.current.featureFlags.isTbacEnabled).toBe(false);
      expect(result2.current.featureFlags.isTbacEnabled).toBe(false);
    });
  });

  describe('state transitions', () => {
    it('handles rapid state updates correctly', () => {
      const {result} = renderHook(() => useFeatureFlagsStore());

      act(() => {
        result.current.setFeatureFlags({isTbacEnabled: false});
        result.current.setFeatureFlags({isTbacEnabled: true});
        result.current.setFeatureFlags({isTbacEnabled: false});
      });

      expect(result.current.featureFlags.isTbacEnabled).toBe(false);
    });

    it('handles set then clean sequence', () => {
      const {result} = renderHook(() => useFeatureFlagsStore());

      act(() => {
        result.current.setFeatureFlags({isTbacEnabled: false});
        result.current.clean();
      });

      expect(result.current.featureFlags).toEqual({
        isTbacEnabled: true
      });
    });
  });
});
