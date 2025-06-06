/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApplicationTypes, SourceTypes} from '@/types/applications';
import {z} from 'zod';

export const ApplicationTypeSchema = z.object({
  type: z.nativeEnum(ApplicationTypes)
});
export type ApplicationTypeFormValues = z.infer<typeof ApplicationTypeSchema>;

export const SourceInformationSchema = z.object({
  type: z.nativeEnum(SourceTypes).optional(),
  text: z.string().min(1, 'Source text is required')
});
export type SourceInformationFormValues = z.infer<typeof SourceInformationSchema>;
