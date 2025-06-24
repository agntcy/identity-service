/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GetTenantsResponse {
  tenants: {
    id: string;
    name: string;
    createdAt: string;
    idp: string;
    extras: Record<string, unknown>;
    region: string;
    entitlements: string[];
    organization: string;
    organizationId: string;
  }[];
}
