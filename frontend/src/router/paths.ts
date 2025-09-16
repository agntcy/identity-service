/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

export const PATHS = {
  basePath: '/',
  welcome: '/welcome',
  onboardDevice: {
    base: '/onboard-device'
  },
  callBackLoading: '/login/callback',
  dashboard: '/dashboard',
  verifyIdentity: {
    base: '/verify-identity',
    info: '/verify-identity/:id'
  },
  agenticServices: {
    base: '/agentic-services',
    add: '/agentic-services/add',
    info: {
      base: '/agentic-services/:id',
      policiesAssignedTo: '/agentic-services/:id/policies-assigned-to',
      policiesUsedBy: '/agentic-services/:id/policies-used-by'
    },
    edit: '/agentic-services/:id/edit'
  },
  policies: {
    base: '/policies',
    create: '/policies/add',
    info: '/policies/:id',
    edit: '/policies/:id/edit'
  },
  settings: {
    base: '/settings',
    identityProvider: {
      base: '/settings/identity-provider',
      connection: '/settings/identity-provider/connection'
    },
    devices: {
      base: '/settings/devices',
      add: '/settings/devices/add'
    },
    apiKey: '/settings/api-key',
    organizationsAndUsers: {
      base: '/settings/organizations-users',
      edit: '/settings/organizations-users/:id/edit',
      info: '/settings/organizations-users/:id'
    }
  }
};
