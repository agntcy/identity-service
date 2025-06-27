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
    verifyIdentity: '/agentic-services/verify-identity'
  },
  accessPolicies: {
    base: '/access-policies',
    create: '/access-policies/create',
    info: '/access-policies/:id'
  },
  settings: {
    base: '/settings',
    identityProvider: '/settings/identity-provider',
    apiKey: '/settings/api-key',
    organizations: {
      base: '/settings/organizations',
      create: '/settings/organizations/create',
      info: '/settings/organizations/:id'
    }
  },
  termsAndConditions: '/terms-and-conditions'
};
