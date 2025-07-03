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
    create: '/agentic-services/create',
    info: '/agentic-services/:id',
    update: '/agentic-services/:id/update',
    verifyIdentity: '/agentic-services/verify-identity'
  },
  policies: {
    base: '/policies',
    create: '/policies/add',
    info: '/policies/:id'
  },
  settings: {
    base: '/settings',
    identityProvider: {
      base: '/settings/identity-provider',
      create: '/settings/identity-provider/create'
    },
    apiKey: '/settings/api-key',
    organizationsAndUsers: {
      base: '/settings/organizations-users',
      update: '/settings/organizations-users/:id/update',
      info: '/settings/organizations-users/:id'
    }
  }
};
