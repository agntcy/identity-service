/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, expect} from 'vitest';
import {EntitlementsSchema, Entitlements, FeatureFlagsSchemas, FeatureFlags} from '../entitlements-schema';

describe('EntitlementsSchema', () => {
  describe('valid inputs', () => {
    it('accepts TBAC entitlement', () => {
      const validData = 'TBAC';

      const result = EntitlementsSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('TBAC');
      }
    });

    it('accepts TBAC with correct typing', () => {
      const validData: Entitlements = 'TBAC';

      const result = EntitlementsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects invalid entitlement string', () => {
      const invalidData = 'INVALID_ENTITLEMENT';

      const result = EntitlementsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects empty string', () => {
      const invalidData = '';

      const result = EntitlementsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects lowercase tbac', () => {
      const invalidData = 'tbac';

      const result = EntitlementsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects mixed case', () => {
      const invalidData = 'Tbac';

      const result = EntitlementsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects non-string values', () => {
      const invalidData = 123;

      const result = EntitlementsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects null', () => {
      const invalidData = null;

      const result = EntitlementsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects undefined', () => {
      const invalidData = undefined;

      const result = EntitlementsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects array', () => {
      const invalidData = ['TBAC'];

      const result = EntitlementsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects object', () => {
      const invalidData = {entitlement: 'TBAC'};

      const result = EntitlementsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('type inference', () => {
    it('correctly infers the TypeScript type', () => {
      const data: Entitlements = 'TBAC';
      expect(data).toBeDefined();
    });
  });
});

describe('FeatureFlagsSchemas', () => {
  describe('valid inputs', () => {
    it('accepts valid feature flags with true', () => {
      const validData = {
        isTbacEnabled: true
      };

      const result = FeatureFlagsSchemas.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('accepts valid feature flags with false', () => {
      const validData = {
        isTbacEnabled: false
      };

      const result = FeatureFlagsSchemas.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts with correct typing', () => {
      const validData: FeatureFlags = {
        isTbacEnabled: true
      };

      const result = FeatureFlagsSchemas.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects missing isTbacEnabled field', () => {
      const invalidData = {};

      const result = FeatureFlagsSchemas.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects non-boolean isTbacEnabled', () => {
      const invalidData = {
        isTbacEnabled: 'true'
      };

      const result = FeatureFlagsSchemas.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects null isTbacEnabled', () => {
      const invalidData = {
        isTbacEnabled: null
      };

      const result = FeatureFlagsSchemas.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects undefined isTbacEnabled', () => {
      const invalidData = {
        isTbacEnabled: undefined
      };

      const result = FeatureFlagsSchemas.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects number as isTbacEnabled', () => {
      const invalidData = {
        isTbacEnabled: 1
      };

      const result = FeatureFlagsSchemas.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects array as isTbacEnabled', () => {
      const invalidData = {
        isTbacEnabled: [true]
      };

      const result = FeatureFlagsSchemas.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects object as isTbacEnabled', () => {
      const invalidData = {
        isTbacEnabled: {value: true}
      };

      const result = FeatureFlagsSchemas.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects non-object input', () => {
      const invalidData = 'not an object';

      const result = FeatureFlagsSchemas.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects array input', () => {
      const invalidData = [true];

      const result = FeatureFlagsSchemas.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('type inference', () => {
    it('correctly infers the TypeScript type', () => {
      const data: FeatureFlags = {
        isTbacEnabled: true
      };

      expect(data).toBeDefined();
    });
  });
});
