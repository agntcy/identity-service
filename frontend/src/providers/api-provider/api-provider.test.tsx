/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {render, screen} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach} from 'vitest';

// Use vi.hoisted to declare mocks that will be available to vi.mock calls
const {
  mockUseAuth,
  mockUseAnalyticsContext,
  mockLoading,
  mockIamAPI,
  mockSettingsAPI,
  mockAgenticServicesAPI,
  mockBadgeAPI,
  mockPolicyAPI,
  mockDevicesAPI
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseAnalyticsContext: vi.fn(),
  mockLoading: vi.fn(),
  mockIamAPI: {
    setTokenExpiredHandlers: vi.fn(),
    setAnalytics: vi.fn(),
    setAuthInfo: vi.fn()
  },
  mockSettingsAPI: {
    setTokenExpiredHandlers: vi.fn(),
    setAnalytics: vi.fn(),
    setAuthInfo: vi.fn()
  },
  mockAgenticServicesAPI: {
    setTokenExpiredHandlers: vi.fn(),
    setAnalytics: vi.fn(),
    setAuthInfo: vi.fn()
  },
  mockBadgeAPI: {
    setTokenExpiredHandlers: vi.fn(),
    setAnalytics: vi.fn(),
    setAuthInfo: vi.fn()
  },
  mockPolicyAPI: {
    setTokenExpiredHandlers: vi.fn(),
    setAnalytics: vi.fn(),
    setAuthInfo: vi.fn()
  },
  mockDevicesAPI: {
    setTokenExpiredHandlers: vi.fn(),
    setAnalytics: vi.fn(),
    setAuthInfo: vi.fn()
  }
}));

// Now the vi.mock calls
vi.mock('@/hooks', () => ({
  useAuth: mockUseAuth
}));

vi.mock('@/components/ui/loading', () => ({
  Loading: mockLoading
}));

vi.mock('@/api/services', () => ({
  AgenticServicesAPI: mockAgenticServicesAPI,
  DevicesAPI: mockDevicesAPI,
  IamAPI: mockIamAPI,
  PolicyAPI: mockPolicyAPI,
  SettingsAPI: mockSettingsAPI
}));

vi.mock('@/api/services/badge-api', () => ({
  BadgeAPI: mockBadgeAPI
}));

vi.mock('../analytics-provider/analytics-provider', () => ({
  useAnalyticsContext: mockUseAnalyticsContext
}));

import {ApiProvider} from './api-provider';

describe('ApiProvider', () => {
  const mockTokenExpiredHttpHandler = vi.fn();
  const mockLogout = vi.fn();
  const mockAnalytics = {track: vi.fn()};

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoading.mockReturnValue(<div data-testid="loading">Loading...</div>);
    mockUseAnalyticsContext.mockReturnValue({analytics: mockAnalytics});
  });

  it('renders children when authInfo is undefined', async () => {
    mockUseAuth.mockReturnValue({
      authInfo: undefined,
      tokenExpiredHttpHandler: mockTokenExpiredHttpHandler,
      logout: mockLogout
    });

    render(<ApiProvider>Test Children</ApiProvider>);

    // The useEffect runs and sets isSet to true immediately, so children are rendered
    expect(await screen.findByText('Test Children')).toBeInTheDocument();
  });

  it('renders children when authInfo is null (not authenticated)', async () => {
    mockUseAuth.mockReturnValue({
      authInfo: null,
      tokenExpiredHttpHandler: mockTokenExpiredHttpHandler,
      logout: mockLogout
    });

    render(<ApiProvider>Test Children</ApiProvider>);

    expect(await screen.findByText('Test Children')).toBeInTheDocument();
  });

  it('renders children when authInfo is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      authInfo: {isAuthenticated: false},
      tokenExpiredHttpHandler: mockTokenExpiredHttpHandler,
      logout: mockLogout
    });

    render(<ApiProvider>Test Children</ApiProvider>);

    expect(await screen.findByText('Test Children')).toBeInTheDocument();
  });

  it('renders children when authInfo is authenticated', async () => {
    mockUseAuth.mockReturnValue({
      authInfo: {isAuthenticated: true, token: 'test-token'},
      tokenExpiredHttpHandler: mockTokenExpiredHttpHandler,
      logout: mockLogout
    });

    render(<ApiProvider>Test Children</ApiProvider>);

    expect(await screen.findByText('Test Children')).toBeInTheDocument();
  });

  it('sets token expired handlers for all APIs', () => {
    mockUseAuth.mockReturnValue({
      authInfo: {isAuthenticated: true},
      tokenExpiredHttpHandler: mockTokenExpiredHttpHandler,
      logout: mockLogout
    });

    render(<ApiProvider>Test Children</ApiProvider>);

    const expectedHandlers = {tokenExpiredHttpHandler: mockTokenExpiredHttpHandler, logout: mockLogout};

    expect(mockIamAPI.setTokenExpiredHandlers).toHaveBeenCalledWith(expectedHandlers);
    expect(mockSettingsAPI.setTokenExpiredHandlers).toHaveBeenCalledWith(expectedHandlers);
    expect(mockAgenticServicesAPI.setTokenExpiredHandlers).toHaveBeenCalledWith(expectedHandlers);
    expect(mockBadgeAPI.setTokenExpiredHandlers).toHaveBeenCalledWith(expectedHandlers);
    expect(mockPolicyAPI.setTokenExpiredHandlers).toHaveBeenCalledWith(expectedHandlers);
    expect(mockDevicesAPI.setTokenExpiredHandlers).toHaveBeenCalledWith(expectedHandlers);
  });

  it('sets analytics for all APIs', () => {
    mockUseAuth.mockReturnValue({
      authInfo: {isAuthenticated: true},
      tokenExpiredHttpHandler: mockTokenExpiredHttpHandler,
      logout: mockLogout
    });

    render(<ApiProvider>Test Children</ApiProvider>);

    expect(mockIamAPI.setAnalytics).toHaveBeenCalledWith(mockAnalytics);
    expect(mockSettingsAPI.setAnalytics).toHaveBeenCalledWith(mockAnalytics);
    expect(mockAgenticServicesAPI.setAnalytics).toHaveBeenCalledWith(mockAnalytics);
    expect(mockBadgeAPI.setAnalytics).toHaveBeenCalledWith(mockAnalytics);
    expect(mockPolicyAPI.setAnalytics).toHaveBeenCalledWith(mockAnalytics);
    expect(mockDevicesAPI.setAnalytics).toHaveBeenCalledWith(mockAnalytics);
  });

  it('sets authInfo for all APIs when authenticated', () => {
    const authInfo = {isAuthenticated: true, token: 'test-token'};

    mockUseAuth.mockReturnValue({
      authInfo,
      tokenExpiredHttpHandler: mockTokenExpiredHttpHandler,
      logout: mockLogout
    });

    render(<ApiProvider>Test Children</ApiProvider>);

    expect(mockIamAPI.setAuthInfo).toHaveBeenCalledWith(authInfo);
    expect(mockSettingsAPI.setAuthInfo).toHaveBeenCalledWith(authInfo);
    expect(mockAgenticServicesAPI.setAuthInfo).toHaveBeenCalledWith(authInfo);
    expect(mockBadgeAPI.setAuthInfo).toHaveBeenCalledWith(authInfo);
    expect(mockPolicyAPI.setAuthInfo).toHaveBeenCalledWith(authInfo);
    expect(mockDevicesAPI.setAuthInfo).toHaveBeenCalledWith(authInfo);
  });

  it('does not set authInfo for APIs when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      authInfo: {isAuthenticated: false},
      tokenExpiredHttpHandler: mockTokenExpiredHttpHandler,
      logout: mockLogout
    });

    render(<ApiProvider>Test Children</ApiProvider>);

    expect(mockIamAPI.setAuthInfo).not.toHaveBeenCalled();
    expect(mockSettingsAPI.setAuthInfo).not.toHaveBeenCalled();
    expect(mockAgenticServicesAPI.setAuthInfo).not.toHaveBeenCalled();
    expect(mockBadgeAPI.setAuthInfo).not.toHaveBeenCalled();
    expect(mockPolicyAPI.setAuthInfo).not.toHaveBeenCalled();
    expect(mockDevicesAPI.setAuthInfo).not.toHaveBeenCalled();
  });

  it('does not set authInfo for APIs when authInfo is null', () => {
    mockUseAuth.mockReturnValue({
      authInfo: null,
      tokenExpiredHttpHandler: mockTokenExpiredHttpHandler,
      logout: mockLogout
    });

    render(<ApiProvider>Test Children</ApiProvider>);

    expect(mockIamAPI.setAuthInfo).not.toHaveBeenCalled();
    expect(mockSettingsAPI.setAuthInfo).not.toHaveBeenCalled();
    expect(mockAgenticServicesAPI.setAuthInfo).not.toHaveBeenCalled();
    expect(mockBadgeAPI.setAuthInfo).not.toHaveBeenCalled();
    expect(mockPolicyAPI.setAuthInfo).not.toHaveBeenCalled();
    expect(mockDevicesAPI.setAuthInfo).not.toHaveBeenCalled();
  });
});
