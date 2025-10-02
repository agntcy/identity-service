/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {render} from '@testing-library/react';
import {describe, it, vi, expect, beforeEach} from 'vitest';
import '@testing-library/jest-dom';
import SettingsBase from './settings-base';

// Update the mock to use MULTI_TENANT instead of IAM_MULTI_TENANT
vi.mock('@/config', () => ({
  default: {
    IAM_MULTI_TENANT: true,
    IAM_UI: 'https://iam.example.com',
    IAM_OIDC_ISSUER: 'https://issuer.example.com',
    IAM_OIDC_CLIENT_ID: 'client-id'
  }
}));

// Mock the isMultiTenant function to return true by default
vi.mock('@/utils/auth', () => ({
  isMultiTenant: vi.fn(() => true)
}));

import {isMultiTenant} from '@/utils/auth';

// Mock dependencies
vi.mock('@/router/paths', () => ({
  PATHS: {
    settings: {
      identityProvider: {
        base: '/settings/identity-provider'
      },
      apiKey: '/settings/api-key',
      devices: {
        base: '/settings/devices'
      },
      organizationsAndUsers: {
        base: '/settings/organizations-and-users'
      }
    }
  }
}));

vi.mock('react-router-dom', () => ({
  Outlet: vi.fn(({context}) => <div data-testid="outlet" data-context={JSON.stringify(context)} />)
}));

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: (arg: any) => any) => fn
}));

describe('SettingsBase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the isMultiTenant mock to return true by default
    vi.mocked(isMultiTenant).mockReturnValue(true);
  });

  it('renders Outlet with current subNav items in multi-tenant mode', () => {
    const {getByTestId} = render(<SettingsBase />);
    const outlet = getByTestId('outlet');
    const contextData = JSON.parse(outlet.getAttribute('data-context') || '{}');

    // Check that subNav exists and has items
    expect(contextData.subNav).toBeDefined();
    expect(contextData.subNav.length).toBeGreaterThan(0);

    // Validate the expected items are present
    const labels = contextData.subNav.map((item: {label: string}) => item.label);
    expect(labels).toContain('Identity Provider');
    expect(labels).toContain('API Key');
    expect(labels).toContain('Organizations & Users');

    // Check specific item structure
    const identityProviderItem = contextData.subNav.find((item: {label: string}) => item.label === 'Identity Provider');
    expect(identityProviderItem).toEqual({
      label: 'Identity Provider',
      href: '/settings/identity-provider'
    });

    const apiKeyItem = contextData.subNav.find((item: {label: string}) => item.label === 'API Key');
    expect(apiKeyItem).toEqual({
      label: 'API Key',
      href: '/settings/api-key'
    });

    const orgUsersItem = contextData.subNav.find((item: {label: string}) => item.label === 'Organizations & Users');
    expect(orgUsersItem).toEqual({
      label: 'Organizations & Users',
      href: '/settings/organizations-and-users'
    });
  });

  it('renders consistent subNav on re-render', () => {
    const {rerender, getByTestId} = render(<SettingsBase />);

    // Get initial subNav
    const outlet1 = getByTestId('outlet');
    const contextData1 = JSON.parse(outlet1.getAttribute('data-context') || '{}');
    const initialLength = contextData1.subNav.length;

    // Re-render multiple times
    rerender(<SettingsBase />);
    rerender(<SettingsBase />);

    const outlet2 = getByTestId('outlet');
    const contextData2 = JSON.parse(outlet2.getAttribute('data-context') || '{}');

    // Should consistently have the same number of items
    expect(contextData2.subNav).toHaveLength(initialLength);

    // Should consistently have the same items
    expect(contextData2.subNav).toEqual(contextData1.subNav);
  });

  it('includes all expected navigation items in multi-tenant mode', () => {
    const {getByTestId} = render(<SettingsBase />);
    const outlet = getByTestId('outlet');
    const contextData = JSON.parse(outlet.getAttribute('data-context') || '{}');

    // Get all labels
    const labels = contextData.subNav.map((item: {label: string}) => item.label);

    // Core settings that should always be present in multi-tenant mode
    expect(labels).toContain('Identity Provider');
    expect(labels).toContain('API Key');
    expect(labels).toContain('Organizations & Users');

    // Check that each item has required properties
    contextData.subNav.forEach((item: {label: string; href: string}) => {
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('href');
      expect(typeof item.label).toBe('string');
      expect(typeof item.href).toBe('string');
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.href.length).toBeGreaterThan(0);
    });
  });

  it('excludes Organizations & Users in OIDC mode', () => {
    // Mock OIDC mode (single-tenant)
    vi.mocked(isMultiTenant).mockReturnValue(false);

    const {getByTestId} = render(<SettingsBase />);
    const outlet = getByTestId('outlet');
    const contextData = JSON.parse(outlet.getAttribute('data-context') || '{}');

    // Get all labels
    const labels = contextData.subNav.map((item: {label: string}) => item.label);

    // In OIDC mode, Organizations & Users should not be available
    expect(labels).toContain('Identity Provider');
    expect(labels).toContain('API Key');
    expect(labels).not.toContain('Organizations & Users');
  });
});
