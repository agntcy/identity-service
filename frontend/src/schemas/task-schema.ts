/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';

export const TaskSchema = z.object({
  task: z.string().min(1, 'Task is required'),
  action: z.string().min(1, 'Action is required')
});

export type TaskFormValues = z.infer<typeof TaskSchema>;
