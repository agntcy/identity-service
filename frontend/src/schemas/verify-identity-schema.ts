/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';

export const VerifyIdentitySchema = z.object({
  badge: z.string().optional(),
  proofValue: z.string().optional(),
  badgeFile: z
    .union([
      z.instanceof(File, {message: 'File is required'}).refine((file) => !file || file.size !== 0 || file.size <= 3000000, {
        message: 'Max size exceeded'
      }),
      z.string().optional()
    ])
    .refine((value) => value instanceof File || typeof value === 'string', {
      message: 'File is required'
    })
    .optional(),
  badgeContent: z.string().optional()
});

export type VerifyIdentityFormValues = z.infer<typeof VerifyIdentitySchema>;
