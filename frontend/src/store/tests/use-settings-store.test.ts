/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, expect, beforeEach} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useSettingsStore} from '../';
import {GetSessionResponse} from '@/types/api/iam';

describe('useSettingsStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const {result} = renderHook(() => useSettingsStore());
    act(() => {
      result.current.setIsAdmin(false);
      result.current.setIsEmptyIdp(true);
      // result.current.setSession(undefined);
    });
  });

  describe('initial state', () => {
    it('has correct initial settings state', () => {
      const {result} = renderHook(() => useSettingsStore());

      expect(result.current.isEmptyIdp).toBe(true);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.session).toBeUndefined();
    });
  });

  describe('setIsAdmin', () => {
    it('sets admin status to true', () => {
      const {result} = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setIsAdmin(true);
      });

      expect(result.current.isAdmin).toBe(true);
    });

    it('sets admin status to false', () => {
      const {result} = renderHook(() => useSettingsStore());

      // First set to true
      act(() => {
        result.current.setIsAdmin(true);
      });

      expect(result.current.isAdmin).toBe(true);

      // Then set to false
      act(() => {
        result.current.setIsAdmin(false);
      });

      expect(result.current.isAdmin).toBe(false);
    });

    it('can be called multiple times with same value', () => {
      const {result} = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setIsAdmin(true);
        result.current.setIsAdmin(true);
      });

      expect(result.current.isAdmin).toBe(true);
    });
  });

  describe('setIsEmptyIdp', () => {
    it('sets empty IDP status to true', () => {
      const {result} = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setIsEmptyIdp(true);
      });

      expect(result.current.isEmptyIdp).toBe(true);
    });

    it('sets empty IDP status to false', () => {
      const {result} = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setIsEmptyIdp(false);
      });

      expect(result.current.isEmptyIdp).toBe(false);
    });

    it('toggles empty IDP status correctly', () => {
      const {result} = renderHook(() => useSettingsStore());

      expect(result.current.isEmptyIdp).toBe(true);

      act(() => {
        result.current.setIsEmptyIdp(false);
        result.current.setIsEmptyIdp(true);
      });

      expect(result.current.isEmptyIdp).toBe(true);
    });
  });

  describe('setSession', () => {
    it('sets session data', () => {
      const {result} = renderHook(() => useSettingsStore());

      const mockSession: GetSessionResponse = {
        username: 'testuser',
        groups: [
          {
            group: {
              id: '1',
              name: 'group1'
            },
            role: 'ADMIN',
            productRoles: []
          }
        ]
      };

      act(() => {
        result.current.setSession(mockSession);
      });

      expect(result.current.session).toEqual(mockSession);
    });

    it('updates session data when called multiple times', () => {
      const {result} = renderHook(() => useSettingsStore());

      const mockSession1: GetSessionResponse = {
        username: 'testuser1',
        groups: [
          {
            group: {
              id: '1',
              name: 'group1'
            },
            role: 'ADMIN',
            productRoles: []
          }
        ]
      };

      const mockSession2: GetSessionResponse = {
        username: 'testuser2',
        groups: [
          {
            group: {
              id: '2',
              name: 'group2'
            },
            role: 'VIEWER',
            productRoles: []
          }
        ]
      };

      act(() => {
        result.current.setSession(mockSession1);
      });

      expect(result.current.session).toEqual(mockSession1);

      act(() => {
        result.current.setSession(mockSession2);
      });

      expect(result.current.session).toEqual(mockSession2);
    });

    it('overwrites previous session completely', () => {
      const {result} = renderHook(() => useSettingsStore());

      const mockSession1: GetSessionResponse = {
        username: 'testuser1',
        groups: [
          {
            group: {
              id: '1',
              name: 'group1'
            },
            role: 'ADMIN',
            productRoles: ['admin']
          }
        ]
      };

      const mockSession2: GetSessionResponse = {
        username: 'testuser2',
        groups: [
          {
            group: {
              id: '2',
              name: 'group2'
            },
            role: 'VIEWER',
            productRoles: []
          }
        ]
      };

      act(() => {
        result.current.setSession(mockSession1);
        result.current.setSession(mockSession2);
      });

      expect(result.current.session).toEqual(mockSession2);
      expect(result.current.session?.groups[0].productRoles).toEqual([]);
    });
  });

  describe('store integration', () => {
    it('maintains state across multiple hook instances', () => {
      const {result: result1} = renderHook(() => useSettingsStore());
      const {result: result2} = renderHook(() => useSettingsStore());

      act(() => {
        result1.current.setIsAdmin(true);
        result1.current.setIsEmptyIdp(false);
      });

      expect(result2.current.isAdmin).toBe(true);
      expect(result2.current.isEmptyIdp).toBe(false);
    });

    it('updates all subscribers when state changes', () => {
      const {result: result1} = renderHook(() => useSettingsStore());
      const {result: result2} = renderHook(() => useSettingsStore());

      const mockSession: GetSessionResponse = {
        username: 'testuser',
        groups: [
          {
            group: {
              id: '1',
              name: 'group1'
            },
            role: 'ADMIN',
            productRoles: []
          }
        ]
      };

      act(() => {
        result1.current.setSession(mockSession);
      });

      expect(result1.current.session).toEqual(mockSession);
      expect(result2.current.session).toEqual(mockSession);
    });
  });

  describe('combined operations', () => {
    it('handles multiple state updates in sequence', () => {
      const {result} = renderHook(() => useSettingsStore());

      const mockSession: GetSessionResponse = {
        username: 'testuser',
        groups: [
          {
            group: {
              id: '1',
              name: 'group1'
            },
            role: 'ADMIN',
            productRoles: []
          }
        ]
      };

      act(() => {
        result.current.setIsAdmin(true);
        result.current.setIsEmptyIdp(false);
        result.current.setSession(mockSession);
      });

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isEmptyIdp).toBe(false);
      expect(result.current.session).toEqual(mockSession);
    });

    it('handles rapid state changes correctly', () => {
      const {result} = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setIsAdmin(true);
        result.current.setIsAdmin(false);
        result.current.setIsEmptyIdp(false);
        result.current.setIsEmptyIdp(true);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isEmptyIdp).toBe(true);
    });
  });
});
