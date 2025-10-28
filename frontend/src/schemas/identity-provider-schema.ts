/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {IdpType} from '@/types/api/settings';
import {z} from 'zod';

export const IdentityProvidersSchema = z
  .object({
    provider: z.nativeEnum(IdpType),
    orgUrl: z.string().optional(),
    clientId: z.string().optional(),
    privateKey: z.string().optional(),
    hostname: z.string().optional(),
    integrationKey: z.string().optional(),
    secretKey: z.string().optional(),
    projectSlug: z.string().optional(),
    apiKey: z.string().optional(),
    baseUrl: z.string().optional(),
    realm: z.string().optional(),
    client: z.string().optional(),
    clientSecret: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.provider === IdpType.IDP_TYPE_DUO) {
      if (!data.integrationKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Integration Key is required for Duo'
        });
      }
      if (!data.secretKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Secret Key is required for Duo'
        });
      }
      if (!data.hostname) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Hostname is required for Duo'
        });
      }
    } else if (data.provider === IdpType.IDP_TYPE_OKTA) {
      if (!data.orgUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Org URL is required for Okta'
        });
      }
      if (!data.clientId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Client ID is required for Okta'
        });
      }
      if (!data.privateKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Private Key is required for Okta'
        });
      }
    } else if (data.provider === IdpType.IDP_TYPE_ORY) {
      if (!data.apiKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'API Key is required for Ory'
        });
      }
      if (!data.projectSlug) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Project Slug is required for Ory'
        });
      }
    } else if (data.provider === IdpType.IDP_TYPE_KEYCLOAK) {
      if (!data.baseUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Base URL is required for Keycloak'
        });
      }
      if (!data.realm) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Realm is required for Keycloak'
        });
      }
      if (!data.client) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Client ID is required for Keycloak'
        });
      }
      if (!data.clientSecret) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Client Secret is required for Keycloak'
        });
      }
    }
  });

export type IdentityProvidersFormValues = z.infer<typeof IdentityProvidersSchema>;
