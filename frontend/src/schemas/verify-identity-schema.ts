/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';

export const VerifyIdentitySchema = z.object({
  badgeId: z.string().optional(),
  file: z
    .union([
      z
        .instanceof(File, {message: 'File is required'})
        .refine((file) => !file || file.size !== 0 || file.size <= 3000000, {message: 'Max size exceeded'}),
      z.string().optional()
    ])
    .refine((value) => value instanceof File || typeof value === 'string', {
      message: 'File is required'
    })
    .optional(),
  buffer: z
    .instanceof(ArrayBuffer, {message: 'Buffer is required'})
    .refine((buffer) => buffer.byteLength > 0 && buffer.byteLength <= 3000000, {
      message: 'Max size exceeded'
    })
    .optional()
});

export type VerifyIdentityFormValues = z.infer<typeof VerifyIdentitySchema>;
