/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, expect} from 'vitest';
import {RuleFormValues, RuleSchema} from '../rule-schema';
import {RuleAction} from '@/types/api/policy';

describe('RuleSchema', () => {
  describe('valid inputs', () => {
    it('accepts valid data with all fields', () => {
      const validData = {
        ruleId: 'rule-123',
        name: 'Test Rule',
        description: 'Test description',
        needsApproval: true,
        tasks: ['task1', 'task2'],
        action: RuleAction.RULE_ACTION_ALLOW
      };

      const result = RuleSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('accepts valid data without optional fields', () => {
      const validData = {
        name: 'Test Rule',
        needsApproval: false,
        tasks: ['task1'],
        action: RuleAction.RULE_ACTION_DENY
      };

      const result = RuleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts valid data with multiple tasks', () => {
      const validData = {
        name: 'Multi Task Rule',
        needsApproval: true,
        tasks: ['task1', 'task2', 'task3'],
        action: RuleAction.RULE_ACTION_ALLOW
      };

      const result = RuleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects empty name', () => {
      const invalidData = {
        name: '',
        needsApproval: true,
        tasks: ['task1'],
        action: RuleAction.RULE_ACTION_ALLOW
      };

      const result = RuleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name is required');
      }
    });

    it('rejects missing name', () => {
      const invalidData = {
        needsApproval: true,
        tasks: ['task1'],
        action: RuleAction.RULE_ACTION_ALLOW
      };

      const result = RuleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects non-boolean needsApproval', () => {
      const invalidData = {
        name: 'Test Rule',
        needsApproval: 'true',
        tasks: ['task1'],
        action: RuleAction.RULE_ACTION_ALLOW
      };

      const result = RuleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects non-array tasks', () => {
      const invalidData = {
        name: 'Test Rule',
        needsApproval: true,
        tasks: 'task1',
        action: RuleAction.RULE_ACTION_ALLOW
      };

      const result = RuleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects non-string elements in tasks array', () => {
      const invalidData = {
        name: 'Test Rule',
        needsApproval: true,
        tasks: ['task1', 123, 'task3'],
        action: RuleAction.RULE_ACTION_ALLOW
      };

      const result = RuleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects invalid action enum value', () => {
      const invalidData = {
        name: 'Test Rule',
        needsApproval: true,
        tasks: ['task1'],
        action: 'INVALID_ACTION'
      };

      const result = RuleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('superRefine validation', () => {
    it('rejects RULE_ACTION_UNSPECIFIED action', () => {
      const invalidData = {
        name: 'Test Rule',
        needsApproval: true,
        tasks: ['task1'],
        action: RuleAction.RULE_ACTION_UNSPECIFIED
      };

      const result = RuleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message === 'Action is required')).toBe(true);
      }
    });

    it('rejects empty tasks array', () => {
      const invalidData = {
        name: 'Test Rule',
        needsApproval: true,
        tasks: [],
        action: RuleAction.RULE_ACTION_ALLOW
      };

      const result = RuleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message === 'At least one task is required')).toBe(true);
      }
    });

    it('rejects both unspecified action and empty tasks', () => {
      const invalidData = {
        name: 'Test Rule',
        needsApproval: true,
        tasks: [],
        action: RuleAction.RULE_ACTION_UNSPECIFIED
      };

      const result = RuleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message === 'Action is required')).toBe(true);
        expect(result.error.issues.some((issue) => issue.message === 'At least one task is required')).toBe(true);
      }
    });
  });

  describe('type inference', () => {
    it('correctly infers the TypeScript type', () => {
      const data: RuleFormValues = {
        ruleId: 'test-id',
        name: 'Test Rule',
        description: 'Test description',
        needsApproval: true,
        tasks: ['task1', 'task2'],
        action: RuleAction.RULE_ACTION_ALLOW
      };

      expect(data).toBeDefined();
    });
  });
});
