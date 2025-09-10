/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import {render, screen, act} from '@testing-library/react';
import {describe, it, vi, beforeEach, expect, afterEach} from 'vitest';
import '@testing-library/jest-dom';
import {FeatureFlagsProvider} from './feature-flags-provider';

// Mock the Loading component
vi.mock('@/components/ui/loading', () => ({
  Loading: () => <div data-testid="loading">Loading...</div>
}));

// Mock the useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/hooks', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock the useGetTenant query
const mockUseGetTenant = vi.fn();
vi.mock('@/queries', () => ({
  useGetTenant: (id: string) => mockUseGetTenant(id)
}));

// Mock the EntitlementsSchema
vi.mock('@/schemas/entitlements-schema', () => ({
  EntitlementsSchema: {
    Enum: {
      TBAC: 'TBAC'
    }
  }
}));

// Mock zustand shallow - fix the implementation
vi.mock('zustand/react/shallow', () => ({
  useShallow: (selector: any) => selector
}));

// Mock the feature flags store - fix the implementation
const mockSetFeatureFlags = vi.fn();
const mockClean = vi.fn();
vi.mock('@/store', () => ({
  useFeatureFlagsStore: (selector: any) =>
    selector({
      setFeatureFlags: mockSetFeatureFlags,
      clean: mockClean
    })
}));

describe('FeatureFlagsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      authInfo: {
        isAuthenticated: true,
        user: {
          tenant: {
            id: 'tenant-123'
          }
        }
      }
    });

    mockUseGetTenant.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children when ENABLE_FEATURE_FLAGS is false', () => {
    render(
      <FeatureFlagsProvider ENABLE_FEATURE_FLAGS={false}>
        <div data-testid="child">Child Content</div>
      </FeatureFlagsProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  it('renders children when ENABLE_FEATURE_FLAGS is undefined (defaults to false)', () => {
    render(
      <FeatureFlagsProvider>
        <div data-testid="child">Child Content</div>
      </FeatureFlagsProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  it('shows Loading when isLoading is true and ENABLE_FEATURE_FLAGS is true', () => {
    mockUseGetTenant.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false
    });

    render(
      <FeatureFlagsProvider ENABLE_FEATURE_FLAGS={true}>
        <div data-testid="child">Child Content</div>
      </FeatureFlagsProvider>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('shows Loading initially when ENABLE_FEATURE_FLAGS is true', () => {
    render(
      <FeatureFlagsProvider ENABLE_FEATURE_FLAGS={true}>
        <div data-testid="child">Child Content</div>
      </FeatureFlagsProvider>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('renders children when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      authInfo: {
        isAuthenticated: false,
        user: null
      }
    });

    render(
      <FeatureFlagsProvider ENABLE_FEATURE_FLAGS={true}>
        <div data-testid="child">Child Content</div>
      </FeatureFlagsProvider>
    );

    // Component should immediately set controller to false for unauthenticated users
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  it('renders children when authInfo is null', () => {
    mockUseAuth.mockReturnValue({
      authInfo: null
    });

    render(
      <FeatureFlagsProvider ENABLE_FEATURE_FLAGS={true}>
        <div data-testid="child">Child Content</div>
      </FeatureFlagsProvider>
    );

    // Component should immediately set controller to false for null authInfo
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  it('handles authenticated user with TBAC entitlement', () => {
    mockUseGetTenant.mockReturnValue({
      data: {
        entitlements: ['TBAC']
      },
      isLoading: false,
      isError: false
    });

    render(
      <FeatureFlagsProvider ENABLE_FEATURE_FLAGS={true}>
        <div data-testid="child">Child Content</div>
      </FeatureFlagsProvider>
    );

    // Should render children after processing entitlements
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(mockClean).toHaveBeenCalled();
    expect(mockSetFeatureFlags).toHaveBeenCalledWith({isTbacEnabled: true});
  });

  it('handles authenticated user with multiple entitlements including TBAC', () => {
    mockUseGetTenant.mockReturnValue({
      data: {
        entitlements: ['OTHER', 'TBAC', 'ANOTHER']
      },
      isLoading: false,
      isError: false
    });

    render(
      <FeatureFlagsProvider ENABLE_FEATURE_FLAGS={true}>
        <div data-testid="child">Child Content</div>
      </FeatureFlagsProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(mockClean).toHaveBeenCalled();
    expect(mockSetFeatureFlags).toHaveBeenCalledWith({isTbacEnabled: true});
  });

  it('handles authenticated user without TBAC entitlement', () => {
    mockUseGetTenant.mockReturnValue({
      data: {
        entitlements: ['OTHER_ENTITLEMENT']
      },
      isLoading: false,
      isError: false
    });

    render(
      <FeatureFlagsProvider ENABLE_FEATURE_FLAGS={true}>
        <div data-testid="child">Child Content</div>
      </FeatureFlagsProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(mockClean).toHaveBeenCalled();
    expect(mockSetFeatureFlags).not.toHaveBeenCalled();
  });

  it('handles authenticated user with empty entitlements', () => {
    mockUseGetTenant.mockReturnValue({
      data: {
        entitlements: []
      },
      isLoading: false,
      isError: false
    });

    render(
      <FeatureFlagsProvider ENABLE_FEATURE_FLAGS={true}>
        <div data-testid="child">Child Content</div>
      </FeatureFlagsProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(mockClean).not.toHaveBeenCalled();
    expect(mockSetFeatureFlags).not.toHaveBeenCalled();
  });

  it('handles authenticated user with no entitlements property', () => {
    mockUseGetTenant.mockReturnValue({
      data: {},
      isLoading: false,
      isError: false
    });

    render(
      <FeatureFlagsProvider ENABLE_FEATURE_FLAGS={true}>
        <div data-testid="child">Child Content</div>
      </FeatureFlagsProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(mockClean).not.toHaveBeenCalled();
    expect(mockSetFeatureFlags).not.toHaveBeenCalled();
  });

  it('handles API error', () => {
    mockUseGetTenant.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true
    });

    render(
      <FeatureFlagsProvider ENABLE_FEATURE_FLAGS={true}>
        <div data-testid="child">Child Content</div>
      </FeatureFlagsProvider>
    );

    // Should render children when there's an error
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  // ...existing code...

  it('handles timeout after 10 seconds', () => {
    // Set up a scenario where we're waiting for data (authenticated, no data, not loading, no error)
    mockUseAuth.mockReturnValue({
      authInfo: {
        isAuthenticated: true,
        user: {
          tenant: {
            id: 'tenant-123'
          }
        }
      }
    });

    mockUseGetTenant.mockReturnValue({
      data: null,
      isLoading: false, // Not loading, but no data - this triggers the timeout scenario
      isError: false
    });

    render(
      <FeatureFlagsProvider ENABLE_FEATURE_FLAGS={true}>
        <div data-testid="child">Child Content</div>
      </FeatureFlagsProvider>
    );

    // Initially shows loading because controller is true and we're waiting for data
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Fast forward 10 seconds to trigger timeout
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  // ...existing code...

  it('cleans up timer when component unmounts', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const {unmount} = render(
      <FeatureFlagsProvider ENABLE_FEATURE_FLAGS={true}>
        <div data-testid="child">Child Content</div>
      </FeatureFlagsProvider>
    );

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('does not set timer when ENABLE_FEATURE_FLAGS is false', () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    render(
      <FeatureFlagsProvider ENABLE_FEATURE_FLAGS={false}>
        <div data-testid="child">Child Content</div>
      </FeatureFlagsProvider>
    );

    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it('calls useGetTenant with correct tenant ID', () => {
    const tenantId = 'test-tenant-123';
    mockUseAuth.mockReturnValue({
      authInfo: {
        isAuthenticated: true,
        user: {
          tenant: {
            id: tenantId
          }
        }
      }
    });

    render(
      <FeatureFlagsProvider ENABLE_FEATURE_FLAGS={true}>
        <div data-testid="child">Child Content</div>
      </FeatureFlagsProvider>
    );

    expect(mockUseGetTenant).toHaveBeenCalledWith(tenantId);
  });

  it('calls useGetTenant with empty string when no tenant ID', () => {
    mockUseAuth.mockReturnValue({
      authInfo: {
        isAuthenticated: true,
        user: {
          tenant: null
        }
      }
    });

    render(
      <FeatureFlagsProvider ENABLE_FEATURE_FLAGS={true}>
        <div data-testid="child">Child Content</div>
      </FeatureFlagsProvider>
    );

    expect(mockUseGetTenant).toHaveBeenCalledWith('');
  });

  it('shows loading while waiting for data when authenticated', () => {
    mockUseAuth.mockReturnValue({
      authInfo: {
        isAuthenticated: true,
        user: {
          tenant: {
            id: 'tenant-123'
          }
        }
      }
    });

    mockUseGetTenant.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false
    });

    render(
      <FeatureFlagsProvider ENABLE_FEATURE_FLAGS={true}>
        <div data-testid="child">Child Content</div>
      </FeatureFlagsProvider>
    );

    // Should show loading when authenticated but no data yet
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });
});
