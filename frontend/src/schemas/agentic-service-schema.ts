/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {AppType} from '@/types/api/app';
import {z} from 'zod';

export const AgenticServiceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.nativeEnum(AppType)
});

export type AgenticServiceFormValues = z.infer<typeof AgenticServiceSchema>;
