/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';

export const OrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required')
});

export type OrganizationFormValues = z.infer<typeof OrganizationSchema>;
