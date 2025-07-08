/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

export const PATHS = {
  basePath: '/',
  welcome: '/welcome',
  verifyIdentity: '/verify-identity',
  callBackLoading: '/login/callback',
  dashboard: '/dashboard',
  agenticServices: {
    base: '/agentic-services',
    add: '/agentic-services/add',
    info: '/agentic-services/:id',
    update: '/agentic-services/:id/update',
    verifyIdentity: '/agentic-services/verify-identity',
    reIssueBadge: '/agentic-services/:id/re-issue-badge'
  },
  policies: {
    base: '/policies',
    create: '/policies/add',
    info: '/policies/:id',
    update: '/policies/:id/update'
  },
  settings: {
    base: '/settings',
    identityProvider: {
      base: '/settings/identity-provider',
      connection: '/settings/identity-provider/connection'
    },
    apiKey: '/settings/api-key',
    organizationsAndUsers: {
      base: '/settings/organizations-users',
      edit: '/settings/organizations-users/:id/edit',
      info: '/settings/organizations-users/:id'
    }
  }
};
