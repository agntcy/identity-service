/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';
import {TaskSchema} from './task-schema';

export const RuleSchema = z.object({
  ruleId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  needsApproval: z.boolean(),
  tasks: TaskSchema
});

export type RuleFormValues = z.infer<typeof RuleSchema>;
