/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TenantReponse {
  id: string;
  name: string;
  createdAt: string;
  idp: string;
  extras: Record<string, unknown>;
  region: string;
  entitlements: string[];
  organization: string;
  organizationId: string;
}

export interface GetTenantsResponse {
  tenants: TenantReponse[];
}

export interface GetSessionResponse {
  username: string;
  groups: {
    group: {
      id: string;
      name: string;
      managedId?: string;
    };
    role: 'ADMIN' | 'VIEWER';
    productRoles: string[];
  }[];
}

export interface UserResponse {
  name: string;
  role: string;
  productRoles: string[];
}

export interface GetUsersGroupsResponse {
  users: UserResponse[];
}

export interface GetGroupsResponse {
  id: string;
  name: string;
  managedId?: string;
}

export interface GetGroupsTenantResponse {
  groups: GetGroupsResponse[];
}

export interface InviteUserPayload {
  username: string;
  productRedirectUri?: string;
}
