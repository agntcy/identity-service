/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, expect} from 'vitest';
import {AgenticServiceFormValues, AgenticServiceSchema} from '../agentic-service-schema';
import {AppType} from '@/types/api/app';

describe('AgenticServiceSchema', () => {
  describe('valid inputs', () => {
    it('accepts valid data with all fields', () => {
      const validData = {
        name: 'Test Agentic Service',
        description: 'Test service description',
        type: AppType.APP_TYPE_AGENT_OASF
      };

      const result = AgenticServiceSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('accepts valid data without optional description', () => {
      const validData = {
        name: 'Test Service',
        type: AppType.APP_TYPE_MCP_SERVER
      };

      const result = AgenticServiceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts valid data with empty description', () => {
      const validData = {
        name: 'Test Service',
        description: '',
        type: AppType.APP_TYPE_AGENT_A2A
      };

      const result = AgenticServiceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts all valid AppType enum values', () => {
      const appTypes = [AppType.APP_TYPE_AGENT_OASF, AppType.APP_TYPE_MCP_SERVER, AppType.APP_TYPE_AGENT_A2A];

      appTypes.forEach((appType) => {
        const validData = {
          name: `Service ${appType}`,
          type: appType
        };

        const result = AgenticServiceSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    it('accepts name with special characters', () => {
      const validData = {
        name: 'Service-Name_123 & Co.',
        type: AppType.APP_TYPE_AGENT_OASF
      };

      const result = AgenticServiceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts long name and description', () => {
      const validData = {
        name: 'A'.repeat(200),
        description: 'B'.repeat(500),
        type: AppType.APP_TYPE_AGENT_OASF
      };

      const result = AgenticServiceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts single character name', () => {
      const validData = {
        name: 'A',
        type: AppType.APP_TYPE_AGENT_OASF
      };

      const result = AgenticServiceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts name with unicode characters', () => {
      const validData = {
        name: 'Servicio Español 服务',
        description: 'Descripción en español 中文描述',
        type: AppType.APP_TYPE_AGENT_OASF
      };

      const result = AgenticServiceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    // Current schema behavior - whitespace-only name passes min(1)
    it('accepts whitespace-only name (current schema behavior)', () => {
      const validData = {
        name: '   ',
        type: AppType.APP_TYPE_AGENT_OASF
      };

      const result = AgenticServiceSchema.safeParse(validData);
      expect(result.success).toBe(true); // min(1) only checks length, not content
    });
  });

  describe('invalid inputs', () => {
    it('rejects empty name', () => {
      const invalidData = {
        name: '',
        type: AppType.APP_TYPE_AGENT_OASF
      };

      const result = AgenticServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name is required');
      }
    });

    it('rejects missing name field', () => {
      const invalidData = {
        type: AppType.APP_TYPE_AGENT_OASF
      };

      const result = AgenticServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects non-string name', () => {
      const invalidData = {
        name: 123,
        type: AppType.APP_TYPE_AGENT_OASF
      };

      const result = AgenticServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects null name', () => {
      const invalidData = {
        name: null,
        type: AppType.APP_TYPE_AGENT_OASF
      };

      const result = AgenticServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects undefined name', () => {
      const invalidData = {
        name: undefined,
        type: AppType.APP_TYPE_AGENT_OASF
      };

      const result = AgenticServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects array as name', () => {
      const invalidData = {
        name: ['Service', 'Name'],
        type: AppType.APP_TYPE_AGENT_OASF
      };

      const result = AgenticServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects object as name', () => {
      const invalidData = {
        name: {value: 'Service'},
        type: AppType.APP_TYPE_AGENT_OASF
      };

      const result = AgenticServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects non-string description', () => {
      const invalidData = {
        name: 'Test Service',
        description: 123,
        type: AppType.APP_TYPE_AGENT_OASF
      };

      const result = AgenticServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects missing type field', () => {
      const invalidData = {
        name: 'Test Service',
        description: 'Test description'
      };

      const result = AgenticServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects invalid type enum value', () => {
      const invalidData = {
        name: 'Test Service',
        type: 'INVALID_APP_TYPE'
      };

      const result = AgenticServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects non-enum type', () => {
      const invalidData = {
        name: 'Test Service',
        type: 123
      };

      const result = AgenticServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects null type', () => {
      const invalidData = {
        name: 'Test Service',
        type: null
      };

      const result = AgenticServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects undefined type', () => {
      const invalidData = {
        name: 'Test Service',
        type: undefined
      };

      const result = AgenticServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('type inference', () => {
    it('correctly infers the TypeScript type', () => {
      const data: AgenticServiceFormValues = {
        name: 'Test Service',
        description: 'Test description',
        type: AppType.APP_TYPE_AGENT_OASF
      };

      expect(data).toBeDefined();
    });

    it('correctly handles optional description in type', () => {
      const data: AgenticServiceFormValues = {
        name: 'Test Service',
        type: AppType.APP_TYPE_AGENT_OASF
        // description is optional
      };

      expect(data).toBeDefined();
    });
  });
});
