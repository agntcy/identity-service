/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, expect} from 'vitest';
import {IdentityProvidersFormValues, IdentityProvidersSchema} from '../identity-provider-schema';
import {IdpType} from '@/types/api/settings';

describe('IdentityProvidersSchema', () => {
  describe('valid inputs', () => {
    it('accepts valid Duo provider configuration', () => {
      const validData = {
        provider: IdpType.IDP_TYPE_DUO,
        integrationKey: 'duo-integration-key',
        secretKey: 'duo-secret-key',
        hostname: 'api-hostname.duosecurity.com'
      };

      const result = IdentityProvidersSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('accepts valid Okta provider configuration', () => {
      const validData = {
        provider: IdpType.IDP_TYPE_OKTA,
        orgUrl: 'https://dev-123.okta.com',
        clientId: 'okta-client-id',
        privateKey: 'okta-private-key'
      };

      const result = IdentityProvidersSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts valid Ory provider configuration', () => {
      const validData = {
        provider: IdpType.IDP_TYPE_ORY,
        apiKey: 'ory-api-key',
        projectSlug: 'my-project-slug'
      };

      const result = IdentityProvidersSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts configuration with all optional fields for Duo', () => {
      const validData = {
        provider: IdpType.IDP_TYPE_DUO,
        integrationKey: 'duo-integration-key',
        secretKey: 'duo-secret-key',
        hostname: 'api-hostname.duosecurity.com',
        orgUrl: 'unused-but-allowed',
        clientId: 'unused-but-allowed',
        privateKey: 'unused-but-allowed',
        projectSlug: 'unused-but-allowed',
        apiKey: 'unused-but-allowed'
      };

      const result = IdentityProvidersSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects missing provider', () => {
      const invalidData = {
        integrationKey: 'duo-integration-key',
        secretKey: 'duo-secret-key',
        hostname: 'api-hostname.duosecurity.com'
      };

      const result = IdentityProvidersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects invalid provider enum value', () => {
      const invalidData = {
        provider: 'INVALID_PROVIDER',
        integrationKey: 'duo-integration-key',
        secretKey: 'duo-secret-key',
        hostname: 'api-hostname.duosecurity.com'
      };

      const result = IdentityProvidersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects non-string optional fields', () => {
      const invalidData = {
        provider: IdpType.IDP_TYPE_DUO,
        integrationKey: 123,
        secretKey: 'duo-secret-key',
        hostname: 'api-hostname.duosecurity.com'
      };

      const result = IdentityProvidersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Duo provider validation', () => {
    it('rejects Duo provider without integrationKey', () => {
      const invalidData = {
        provider: IdpType.IDP_TYPE_DUO,
        secretKey: 'duo-secret-key',
        hostname: 'api-hostname.duosecurity.com'
      };

      const result = IdentityProvidersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message === 'Integration Key is required for Duo')).toBe(true);
      }
    });

    it('rejects Duo provider without secretKey', () => {
      const invalidData = {
        provider: IdpType.IDP_TYPE_DUO,
        integrationKey: 'duo-integration-key',
        hostname: 'api-hostname.duosecurity.com'
      };

      const result = IdentityProvidersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message === 'Secret Key is required for Duo')).toBe(true);
      }
    });

    it('rejects Duo provider without hostname', () => {
      const invalidData = {
        provider: IdpType.IDP_TYPE_DUO,
        integrationKey: 'duo-integration-key',
        secretKey: 'duo-secret-key'
      };

      const result = IdentityProvidersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message === 'Hostname is required for Duo')).toBe(true);
      }
    });

    it('rejects Duo provider with empty required fields', () => {
      const invalidData = {
        provider: IdpType.IDP_TYPE_DUO,
        integrationKey: '',
        secretKey: '',
        hostname: ''
      };

      const result = IdentityProvidersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message === 'Integration Key is required for Duo')).toBe(true);
        expect(result.error.issues.some((issue) => issue.message === 'Secret Key is required for Duo')).toBe(true);
        expect(result.error.issues.some((issue) => issue.message === 'Hostname is required for Duo')).toBe(true);
      }
    });
  });

  describe('Okta provider validation', () => {
    it('rejects Okta provider without orgUrl', () => {
      const invalidData = {
        provider: IdpType.IDP_TYPE_OKTA,
        clientId: 'okta-client-id',
        privateKey: 'okta-private-key'
      };

      const result = IdentityProvidersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message === 'Org URL is required for Okta')).toBe(true);
      }
    });

    it('rejects Okta provider without clientId', () => {
      const invalidData = {
        provider: IdpType.IDP_TYPE_OKTA,
        orgUrl: 'https://dev-123.okta.com',
        privateKey: 'okta-private-key'
      };

      const result = IdentityProvidersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message === 'Client ID is required for Okta')).toBe(true);
      }
    });

    it('rejects Okta provider without privateKey', () => {
      const invalidData = {
        provider: IdpType.IDP_TYPE_OKTA,
        orgUrl: 'https://dev-123.okta.com',
        clientId: 'okta-client-id'
      };

      const result = IdentityProvidersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message === 'Private Key is required for Okta')).toBe(true);
      }
    });

    it('rejects Okta provider with empty required fields', () => {
      const invalidData = {
        provider: IdpType.IDP_TYPE_OKTA,
        orgUrl: '',
        clientId: '',
        privateKey: ''
      };

      const result = IdentityProvidersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message === 'Org URL is required for Okta')).toBe(true);
        expect(result.error.issues.some((issue) => issue.message === 'Client ID is required for Okta')).toBe(true);
        expect(result.error.issues.some((issue) => issue.message === 'Private Key is required for Okta')).toBe(true);
      }
    });
  });

  describe('Ory provider validation', () => {
    it('rejects Ory provider without apiKey', () => {
      const invalidData = {
        provider: IdpType.IDP_TYPE_ORY,
        projectSlug: 'my-project-slug'
      };

      const result = IdentityProvidersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message === 'API Key is required for Ory')).toBe(true);
      }
    });

    it('rejects Ory provider without projectSlug', () => {
      const invalidData = {
        provider: IdpType.IDP_TYPE_ORY,
        apiKey: 'ory-api-key'
      };

      const result = IdentityProvidersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message === 'Project Slug is required for Ory')).toBe(true);
      }
    });

    it('rejects Ory provider with empty required fields', () => {
      const invalidData = {
        provider: IdpType.IDP_TYPE_ORY,
        apiKey: '',
        projectSlug: ''
      };

      const result = IdentityProvidersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message === 'API Key is required for Ory')).toBe(true);
        expect(result.error.issues.some((issue) => issue.message === 'Project Slug is required for Ory')).toBe(true);
      }
    });
  });

  describe('type inference', () => {
    it('correctly infers the TypeScript type', () => {
      const data: IdentityProvidersFormValues = {
        provider: IdpType.IDP_TYPE_DUO,
        orgUrl: 'https://example.com',
        clientId: 'client-id',
        privateKey: 'private-key',
        hostname: 'hostname.com',
        integrationKey: 'integration-key',
        secretKey: 'secret-key',
        projectSlug: 'project-slug',
        apiKey: 'api-key'
      };

      expect(data).toBeDefined();
    });
  });
});
