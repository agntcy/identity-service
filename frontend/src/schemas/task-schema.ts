/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {RuleAction} from '@/types/api/policy';
import {z} from 'zod';

export const TaskSchema = z
  .object({
    task: z.string().min(1, 'Task is required'),
    action: z.nativeEnum(RuleAction)
  })
  .superRefine((data, ctx) => {
    if (data.action === RuleAction.RULE_ACTION_UNSPECIFIED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Action is required'
      });
    }
  });

export type TaskFormValues = z.infer<typeof TaskSchema>;
