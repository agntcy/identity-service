/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';
import {TaskSchema} from './task-schema';

export const RuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  needsApproval: z.enum(['yes', 'no']).optional().default('no'),
  tasks: z
    .array(TaskSchema)
    .nonempty('At least one task is required')
    .refine((tasks) => tasks.length > 0, {
      message: 'At least one task is required'
    })
});

export type RuleFormValues = z.infer<typeof RuleSchema>;
