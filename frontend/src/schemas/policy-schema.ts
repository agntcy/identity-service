/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';

export const PolicySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  assignedTo: z.string().min(1, 'Assigned To is required'),
  description: z.string().optional()
});

export type PolicyFormValues = z.infer<typeof PolicySchema>;
