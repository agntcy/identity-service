/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';

export const EntitlementsSchema = z.enum(['TBAC']);
export type Entitlements = z.infer<typeof EntitlementsSchema>;

export const FeatureFlagsSchemas = z.object({
  isTbacEnabled: z.boolean()
});
export type FeatureFlags = z.infer<typeof FeatureFlagsSchemas>;
