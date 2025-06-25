/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AppType} from '@/types/api/app';
import {z} from 'zod';

export const AgenticServiceSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    type: z.nativeEnum(AppType),
    oasfSpecs: z.string().optional(),
    mcpServcer: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.type === AppType.APP_TYPE_AGENT_OASF) {
      if (!data.oasfSpecs) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'OASF Specs are required for OASF Agentic Service'
        });
      }
    }
  });

export type AgenticServiceFormValues = z.infer<typeof AgenticServiceSchema>;
