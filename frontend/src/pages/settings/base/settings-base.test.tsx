/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import {render} from '@testing-library/react';
import {describe, it, vi, expect, beforeEach} from 'vitest';
import '@testing-library/jest-dom';
import SettingsBase from './settings-base';

vi.mock('@/config', () => ({
  default: {
    IAM_MULTI_TENANT: true
  }
}));

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

vi.mock('@/store', () => ({
  useFeatureFlagsStore: vi.fn()
}));

vi.mock('react-router-dom', () => ({
  Outlet: vi.fn(({context}) => <div data-testid="outlet" data-context={JSON.stringify(context)} />)
}));

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: (arg: any) => any) => fn
}));

const mockUseFeatureFlagsStore = vi.mocked(await import('@/store')).useFeatureFlagsStore;

describe('SettingsBase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Outlet with correct subNav when TBAC is enabled', () => {
    // Mock TBAC enabled
    mockUseFeatureFlagsStore.mockImplementation((selector) =>
      selector({
        featureFlags: {isTbacEnabled: true},
        setFeatureFlags: vi.fn(),
        clean: vi.fn()
      })
    );

    const {getByTestId} = render(<SettingsBase />);
    const outlet = getByTestId('outlet');
    const contextData = JSON.parse(outlet.getAttribute('data-context') || '{}');

    // Validate subNav items
    expect(contextData.subNav).toHaveLength(4);
    expect(contextData.subNav[0].label).toBe('Identity Provider');
    expect(contextData.subNav[0].href).toBe('/settings/identity-provider');
    expect(contextData.subNav[1].label).toBe('API Key');
    expect(contextData.subNav[1].href).toBe('/settings/api-key');
    expect(contextData.subNav[2].label).toBe('Devices');
    expect(contextData.subNav[2].href).toBe('/settings/devices');
    mockUseFeatureFlagsStore.mockImplementation((selector) =>
      selector({
        featureFlags: {isTbacEnabled: false},
        setFeatureFlags: vi.fn(),
        clean: vi.fn()
      })
    );
    expect(contextData.subNav[3].href).toBe('/settings/organizations-and-users');
  });

  it('renders Outlet with correct subNav when TBAC is disabled', () => {
    // Mock TBAC disabled
    mockUseFeatureFlagsStore.mockImplementation((selector) =>
      selector({
        featureFlags: {isTbacEnabled: false},
        setFeatureFlags: vi.fn(),
        clean: vi.fn()
      })
    );

    const {getByTestId} = render(<SettingsBase />);
    const outlet = getByTestId('outlet');
    const contextData = JSON.parse(outlet.getAttribute('data-context') || '{}');

    // Validate subNav items - should not include Devices
    expect(contextData.subNav).toHaveLength(3);
    expect(contextData.subNav[0].label).toBe('Identity Provider');
    expect(contextData.subNav[0].href).toBe('/settings/identity-provider');
    expect(contextData.subNav[1].label).toBe('API Key');
    expect(contextData.subNav[1].href).toBe('/settings/api-key');
    expect(contextData.subNav[2].label).toBe('Organizations & Users');
    expect(contextData.subNav[2].href).toBe('/settings/organizations-and-users');

    // Ensure Devices is not present
    const deviceItem = contextData.subNav.find((item: {label: string}) => item.label === 'Devices');
    expect(deviceItem).toBeUndefined();
  });

  it('only re-calculates subNav when isTbacEnabled changes', () => {
    // Initial render with TBAC enabled
    mockUseFeatureFlagsStore.mockImplementation((selector) =>
      selector({
        featureFlags: {isTbacEnabled: true},
        setFeatureFlags: vi.fn(),
        clean: vi.fn()
      })
    );

    const {rerender, getByTestId} = render(<SettingsBase />);

    // Re-render with the same TBAC value
    rerender(<SettingsBase />);

    // Re-render with different TBAC value
    mockUseFeatureFlagsStore.mockImplementation((selector) =>
      selector({
        featureFlags: {isTbacEnabled: false},
        setFeatureFlags: vi.fn(),
        clean: vi.fn()
      })
    );

    rerender(<SettingsBase />);

    const outlet = getByTestId('outlet');
    const contextData = JSON.parse(outlet.getAttribute('data-context') || '{}');

    // After TBAC is disabled, should have 3 items
    expect(contextData.subNav).toHaveLength(3);
  });
});
