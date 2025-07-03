/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';

export const RuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  task: z.string().min(1, 'Task is required'),
  action: z.string().min(1, 'Action is required'),
  needsApproval: z.enum(['yes', 'no']).optional().default('no')
});

export type RuleFormValues = z.infer<typeof RuleSchema>;
