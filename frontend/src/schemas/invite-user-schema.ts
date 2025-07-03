/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';

export const InviteUserSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required')
});

export type InviteUserFormValues = z.infer<typeof InviteUserSchema>;
