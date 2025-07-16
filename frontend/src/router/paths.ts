/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

export const PATHS = {
  basePath: '/',
  welcome: '/welcome',
  onboardDevice: '/onboard-device',
  onboardDeviceId: '/onboard-device/:id',
  verifyIdentity: '/verify-identity',
  callBackLoading: '/login/callback',
  dashboard: '/dashboard',
  agenticServices: {
    base: '/agentic-services',
    add: '/agentic-services/add',
    info: '/agentic-services/:id',
    edit: '/agentic-services/:id/edit',
    verifyIdentity: '/agentic-services/verify-identity',
    reIssueBadge: '/agentic-services/:id/re-issue-badge'
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
