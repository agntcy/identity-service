/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, expect} from 'vitest';
import {OrganizationFormValues, OrganizationSchema} from '../organization-schema';

describe('OrganizationSchema', () => {
  describe('valid inputs', () => {
    it('accepts valid data with name', () => {
      const validData = {
        name: 'Test Organization'
      };

      const result = OrganizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('accepts name with special characters', () => {
      const validData = {
        name: 'Acme Corp. & Co. - Tech Division'
      };

      const result = OrganizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts name with numbers', () => {
      const validData = {
        name: 'Organization 123'
      };

      const result = OrganizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts long organization name', () => {
      const validData = {
        name: 'A'.repeat(200)
      };

      const result = OrganizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts single character name', () => {
      const validData = {
        name: 'A'
      };

      const result = OrganizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts name with unicode characters', () => {
      const validData = {
        name: 'Organización Española 企业'
      };

      const result = OrganizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    // Whitespace-only strings are actually valid according to current schema
    it('accepts whitespace-only name (current schema behavior)', () => {
      const validData = {
        name: '   '
      };

      const result = OrganizationSchema.safeParse(validData);
      expect(result.success).toBe(true); // min(1) only checks length, not content
    });
  });

  describe('invalid inputs', () => {
    it('rejects empty name', () => {
      const invalidData = {
        name: ''
      };

      const result = OrganizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name is required');
      }
    });

    it('rejects missing name field', () => {
      const invalidData = {};

      const result = OrganizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects non-string name', () => {
      const invalidData = {
        name: 123
      };

      const result = OrganizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects null name', () => {
      const invalidData = {
        name: null
      };

      const result = OrganizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects undefined name', () => {
      const invalidData = {
        name: undefined
      };

      const result = OrganizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects array as name', () => {
      const invalidData = {
        name: ['Organization', 'Name']
      };

      const result = OrganizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects object as name', () => {
      const invalidData = {
        name: {value: 'Organization'}
      };

      const result = OrganizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('type inference', () => {
    it('correctly infers the TypeScript type', () => {
      const data: OrganizationFormValues = {
        name: 'Test Organization'
      };

      expect(data).toBeDefined();
    });
  });
});
