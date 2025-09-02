/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, expect} from 'vitest';
import {PolicyFormValues, PolicySchema} from '../policy-schema';

describe('PolicySchema', () => {
  describe('valid inputs', () => {
    it('accepts valid data with all fields', () => {
      const validData = {
        name: 'Test Policy',
        assignedTo: 'user@example.com',
        description: 'Test policy description'
      };

      const result = PolicySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('accepts valid data without optional description', () => {
      const validData = {
        name: 'Test Policy',
        assignedTo: 'admin-group'
      };

      const result = PolicySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts valid data with empty description', () => {
      const validData = {
        name: 'Test Policy',
        assignedTo: 'user@example.com',
        description: ''
      };

      const result = PolicySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts data with long strings', () => {
      const validData = {
        name: 'A'.repeat(100),
        assignedTo: 'B'.repeat(50),
        description: 'C'.repeat(500)
      };

      const result = PolicySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects empty name', () => {
      const invalidData = {
        name: '',
        assignedTo: 'user@example.com',
        description: 'Test description'
      };

      const result = PolicySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name is required');
      }
    });

    it('rejects missing name', () => {
      const invalidData = {
        assignedTo: 'user@example.com',
        description: 'Test description'
      };

      const result = PolicySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects non-string name', () => {
      const invalidData = {
        name: 123,
        assignedTo: 'user@example.com',
        description: 'Test description'
      };

      const result = PolicySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects empty assignedTo', () => {
      const invalidData = {
        name: 'Test Policy',
        assignedTo: '',
        description: 'Test description'
      };

      const result = PolicySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Assigned To is required');
      }
    });

    it('rejects missing assignedTo', () => {
      const invalidData = {
        name: 'Test Policy',
        description: 'Test description'
      };

      const result = PolicySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects non-string assignedTo', () => {
      const invalidData = {
        name: 'Test Policy',
        assignedTo: 123,
        description: 'Test description'
      };

      const result = PolicySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects non-string description', () => {
      const invalidData = {
        name: 'Test Policy',
        assignedTo: 'user@example.com',
        description: 123
      };

      const result = PolicySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects null values', () => {
      const invalidData = {
        name: null,
        assignedTo: null,
        description: null
      };

      const result = PolicySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('type inference', () => {
    it('correctly infers the TypeScript type', () => {
      const data: PolicyFormValues = {
        name: 'Test Policy',
        assignedTo: 'user@example.com',
        description: 'Test description'
      };

      expect(data).toBeDefined();
    });

    it('correctly handles optional description in type', () => {
      const data: PolicyFormValues = {
        name: 'Test Policy',
        assignedTo: 'user@example.com'
        // description is optional
      };

      expect(data).toBeDefined();
    });
  });
});
