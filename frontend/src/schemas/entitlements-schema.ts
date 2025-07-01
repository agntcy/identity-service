/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';

export const EntitlementsSchema = z.enum(['TBAC']);
export type Entitlements = z.infer<typeof EntitlementsSchema>;

export const FeatureFlagsSchemas = z.object({
  isTbacEnable: z.boolean()
});
export type FeatureFlags = z.infer<typeof FeatureFlagsSchemas>;
