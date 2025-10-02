/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {expect, afterEach, beforeAll, vi} from 'vitest';
import {cleanup} from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Mock the getAuthConfig function to provide test defaults
beforeAll(() => {
  // Mock the getAuthConfig utility function
  vi.mock('@/utils/get-auth-config', () => ({
    getAuthConfig: vi.fn(() => ({
      iamUI: 'http://localhost:3000',
      iamApi: 'http://localhost:8080',
      productId: 'test-product-id',
      oktaIssuer: 'http://localhost:8080/oauth2/default',
      oktaClient: 'test-client-id'
    })),
    isMultiTenant: vi.fn(() => true)
  }));

  // Mock import.meta.env with test defaults
  vi.stubGlobal('import.meta', {
    env: {
      MODE: 'test',
      VITE_AUTH_TYPE: 'iam',
      VITE_IAM_API: 'http://localhost:8080',
      VITE_IAM_UI: 'http://localhost:3000',
      VITE_IAM_PRODUCT_ID: 'test-product-id',
      VITE_IAM_OIDC_CLIENT_ID: 'test-client-id',
      VITE_IAM_OIDC_ISSUER: 'http://localhost:8080/oauth2/default',
      VITE_IAM_MULTI_TENANT: 'true',
      VITE_API_URL: 'http://localhost:8080',
      VITE_APP_CLIENT_PORT: '5500',
      VITE_APP_LOG_LEVEL: 'info'
    }
  });
});

afterEach(() => {
  cleanup();
});
