/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';
import {RuleAction} from '@/types/api/policy';

export const RuleSchema = z
  .object({
    ruleId: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    needsApproval: z.boolean(),
    tasks: z.array(z.string()),
    action: z.nativeEnum(RuleAction)
  })
  .superRefine((data, ctx) => {
    if (data.action === RuleAction.RULE_ACTION_UNSPECIFIED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Action is required'
      });
    }
    if (data.tasks.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one task is required'
      });
    }
  });

export type RuleFormValues = z.infer<typeof RuleSchema>;
