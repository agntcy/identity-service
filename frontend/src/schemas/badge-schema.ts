/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AppType} from '@/types/api/app';
import {z} from 'zod';

export const BadgeSchema = z
  .object({
    type: z.nativeEnum(AppType),
    oasfSpecs: z
      .union([
        z
          .instanceof(File, {message: 'File is required'})
          .refine((file) => !file || file.size !== 0 || file.size <= 3000000, {
            message: 'Max size exceeded'
          }),
        z.string().optional()
      ])
      .refine((value) => value instanceof File || typeof value === 'string', {
        message: 'File is required'
      })
      .optional(),
    mcpServer: z.string().optional(),
    oasfSpecsContent: z.string().optional(),
    wellKnownServer: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.type === AppType.APP_TYPE_AGENT_OASF) {
      if (data.oasfSpecs === null || !data.oasfSpecs) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'OASF Specs are required for OASF Agentic Service'
        });
      }
    } else if (data.type === AppType.APP_TYPE_MCP_SERVER) {
      if (!data.mcpServer) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'MCP Server is required for MCP Agentic Service'
        });
      }
    } else if (data.type === AppType.APP_TYPE_AGENT_A2A) {
      if (!data.wellKnownServer) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Well-Known Server is required for A2A Agentic Service'
        });
      }
    }
  });

export type BadgeFormValues = z.infer<typeof BadgeSchema>;
