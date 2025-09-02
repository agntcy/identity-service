/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, expect} from 'vitest';
import {PolicyLogicyFormValues, PolicyLogicySchema} from '../policy-logic-schema';
import {RuleAction} from '@/types/api/policy';

describe('PolicyLogicySchema', () => {
  const validRule = {
    name: 'Test Rule',
    needsApproval: true,
    tasks: ['task1'],
    action: RuleAction.RULE_ACTION_ALLOW
  };

  const validRule2 = {
    ruleId: 'rule-123',
    name: 'Second Rule',
    description: 'Test description',
    needsApproval: false,
    tasks: ['task2', 'task3'],
    action: RuleAction.RULE_ACTION_DENY
  };

  describe('valid inputs', () => {
    it('accepts valid data with single rule', () => {
      const validData = {
        rules: [validRule]
      };

      const result = PolicyLogicySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('accepts valid data with multiple rules', () => {
      const validData = {
        rules: [validRule, validRule2]
      };

      const result = PolicyLogicySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts rules with all optional fields', () => {
      const ruleWithOptionals = {
        ruleId: 'optional-rule',
        name: 'Rule with optionals',
        description: 'Optional description',
        needsApproval: true,
        tasks: ['task1', 'task2'],
        action: RuleAction.RULE_ACTION_ALLOW
      };

      const validData = {
        rules: [ruleWithOptionals]
      };

      const result = PolicyLogicySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts large array of rules', () => {
      const manyRules = Array.from({length: 10}, (_, i) => ({
        ...validRule,
        name: `Rule ${i + 1}`
      }));

      const validData = {
        rules: manyRules
      };

      const result = PolicyLogicySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects empty rules array', () => {
      const invalidData = {
        rules: []
      };

      const result = PolicyLogicySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one rule is required');
      }
    });

    it('rejects missing rules field', () => {
      const invalidData = {};

      const result = PolicyLogicySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects non-array rules', () => {
      const invalidData = {
        rules: 'not-an-array'
      };

      const result = PolicyLogicySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects array with invalid rule objects', () => {
      const invalidData = {
        rules: [
          {
            name: '', // Invalid: empty name
            needsApproval: true,
            tasks: ['task1'],
            action: RuleAction.RULE_ACTION_ALLOW
          }
        ]
      };

      const result = PolicyLogicySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects array with missing required rule fields', () => {
      const invalidData = {
        rules: [
          {
            name: 'Test Rule'
            // Missing needsApproval, tasks, action
          }
        ]
      };

      const result = PolicyLogicySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects array with invalid action in rule', () => {
      const invalidData = {
        rules: [
          {
            name: 'Test Rule',
            needsApproval: true,
            tasks: [],
            action: RuleAction.RULE_ACTION_UNSPECIFIED // Invalid due to superRefine
          }
        ]
      };

      const result = PolicyLogicySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects array with empty tasks in rule', () => {
      const invalidData = {
        rules: [
          {
            name: 'Test Rule',
            needsApproval: true,
            tasks: [], // Invalid due to superRefine
            action: RuleAction.RULE_ACTION_ALLOW
          }
        ]
      };

      const result = PolicyLogicySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects mixed valid and invalid rules', () => {
      const invalidData = {
        rules: [
          validRule, // Valid rule
          {
            name: '', // Invalid rule
            needsApproval: true,
            tasks: ['task1'],
            action: RuleAction.RULE_ACTION_ALLOW
          }
        ]
      };

      const result = PolicyLogicySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('type inference', () => {
    it('correctly infers the TypeScript type', () => {
      const data: PolicyLogicyFormValues = {
        rules: [
          {
            ruleId: 'test-id',
            name: 'Test Rule',
            description: 'Test description',
            needsApproval: true,
            tasks: ['task1', 'task2'],
            action: RuleAction.RULE_ACTION_ALLOW
          }
        ]
      };

      expect(data).toBeDefined();
    });
  });
});
