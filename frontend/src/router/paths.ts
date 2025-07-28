/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
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
    base: '/agentic-platforms',
    add: '/agentic-platforms/add',
    info: {
      base: '/agentic-platforms/:id',
      policiesAssignedTo: '/agentic-platforms/:id/policies-assigned-to',
      policiesUsedBy: '/agentic-platforms/:id/policies-used-by'
    },
    edit: '/agentic-platforms/:id/edit'
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
