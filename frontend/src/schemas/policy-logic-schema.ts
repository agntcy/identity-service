/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';
import {RuleSchema} from './rule-schema';

export const PolicyLogicySchema = z.object({
  rules: z
    .array(RuleSchema)
    .nonempty('At least one rule is required')
    .refine((rules) => rules.length > 0, {
      message: 'At least one rule is required'
    })
});

export type PolicyLogicyFormValues = z.infer<typeof PolicyLogicySchema>;
