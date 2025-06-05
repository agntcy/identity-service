/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';
import {IdentityProviders, PasswordManagmentProviders} from '@/types/providers';

export const IdentityProvidersSchema = z.object({
  provider: z.nativeEnum(IdentityProviders),
  issuer: z.string().min(1, 'Issuer URL is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
  clientId: z.string().min(1, 'Client ID is required')
});
export type IdentityProvidersFormValues = z.infer<typeof IdentityProvidersSchema>;

export const PasswordManagmentProviderSchema = z.object({
  manager: z.nativeEnum(PasswordManagmentProviders)
});
export type PasswordManagmentProviderFormValues = z.infer<typeof PasswordManagmentProviderSchema>;
