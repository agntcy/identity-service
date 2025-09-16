/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, expect} from 'vitest';
import {InviteUserFormValues, InviteUserSchema} from '../invite-user-schema';

describe('InviteUserSchema', () => {
  describe('valid inputs', () => {
    it('accepts valid email address', () => {
      const validData = {
        email: 'user@example.com'
      };

      const result = InviteUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('accepts email with subdomain', () => {
      const validData = {
        email: 'user@mail.example.com'
      };

      const result = InviteUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts email with plus sign', () => {
      const validData = {
        email: 'user+tag@example.com'
      };

      const result = InviteUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts email with dots in local part', () => {
      const validData = {
        email: 'first.last@example.com'
      };

      const result = InviteUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts email with numbers', () => {
      const validData = {
        email: 'user123@example123.com'
      };

      const result = InviteUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts email with hyphens in domain', () => {
      const validData = {
        email: 'user@test-domain.com'
      };

      const result = InviteUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts long email address', () => {
      const validData = {
        email: 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com'
      };

      const result = InviteUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects empty email', () => {
      const invalidData = {
        email: ''
      };

      const result = InviteUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Email validation runs before min validation, so empty string fails email format first
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('rejects missing email field', () => {
      const invalidData = {};

      const result = InviteUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects invalid email format - missing @', () => {
      const invalidData = {
        email: 'userexample.com'
      };

      const result = InviteUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('rejects invalid email format - missing domain', () => {
      const invalidData = {
        email: 'user@'
      };

      const result = InviteUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('rejects invalid email format - missing local part', () => {
      const invalidData = {
        email: '@example.com'
      };

      const result = InviteUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('rejects invalid email format - multiple @', () => {
      const invalidData = {
        email: 'user@@example.com'
      };

      const result = InviteUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('rejects invalid email format - spaces', () => {
      const invalidData = {
        email: 'user @example.com'
      };

      const result = InviteUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('rejects non-string email', () => {
      const invalidData = {
        email: 123
      };

      const result = InviteUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects null email', () => {
      const invalidData = {
        email: null
      };

      const result = InviteUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects undefined email', () => {
      const invalidData = {
        email: undefined
      };

      const result = InviteUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects array as email', () => {
      const invalidData = {
        email: ['user@example.com']
      };

      const result = InviteUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects object as email', () => {
      const invalidData = {
        email: {value: 'user@example.com'}
      };

      const result = InviteUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects whitespace-only email', () => {
      const invalidData = {
        email: '   '
      };

      const result = InviteUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Whitespace passes min(1) but fails email format validation
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });
  });

  describe('type inference', () => {
    it('correctly infers the TypeScript type', () => {
      const data: InviteUserFormValues = {
        email: 'user@example.com'
      };

      expect(data).toBeDefined();
    });
  });
});
