/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';

export const RuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  task: z.string(),
  action: z.string(),
  needsApproval: z.enum(['yes', 'no'], {
    required_error: 'Needs approval is required',
    invalid_type_error: 'Needs approval must be "yes" or "no"'
  })
});

export type RuleFormValues = z.infer<typeof RuleSchema>;
