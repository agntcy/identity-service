/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import {render, screen, act, fireEvent} from '@testing-library/react';
import {describe, it, vi, beforeEach, expect, afterEach} from 'vitest';
import '@testing-library/jest-dom';
import {AnalyticsProvider, useAnalyticsContext} from './analytics-provider';

// Mock dependencies using factory functions to avoid hoisting issues
vi.mock('@segment/analytics-next', () => ({
  AnalyticsBrowser: {
    load: vi.fn()
  }
}));

const mockConfig = vi.hoisted(() => ({
  SEGMENT_ID: 'test-segment-id'
}));

vi.mock('@/config', () => ({
  default: mockConfig
}));

vi.mock('@/hooks', () => ({
  useAuth: vi.fn()
}));

vi.mock('vanilla-cookieconsent', () => ({
  getUserPreferences: vi.fn()
}));

// Mock the analytics implementations
vi.mock('./implementations/segment-analytics', () => ({
  SegmentAnalytics: vi.fn()
}));

vi.mock('./implementations/noop-analytics', () => ({
  NoOpAnalytics: vi.fn()
}));

// Test component to test the hook
const TestComponent = () => {
  const {analytics, isConsentGiven} = useAnalyticsContext();

  // Check if analytics is SegmentAnalytics (real analytics) vs NoOpAnalytics (noop)
  const isRealAnalytics = analytics && analytics.constructor.name === 'SegmentAnalytics';

  return (
    <div>
      <div data-testid="consent-status">{isConsentGiven ? 'granted' : 'denied'}</div>
      <div data-testid="analytics-status">{isRealAnalytics ? 'initialized' : 'not-initialized'}</div>
    </div>
  );
};

describe('AnalyticsProvider', () => {
  let mockUseAuth: any;
  let mockGetUserPreferences: any;
  let mockSegmentAnalytics: any;
  let mockNoOpAnalytics: any;
  let mockAnalyticsInstance: any;
  let mockNoOpInstance: any;

  beforeEach(async () => {
    // Reset config to default
    mockConfig.SEGMENT_ID = 'test-segment-id';

    // Import the mocked modules and get their mock functions
    const {useAuth} = await import('@/hooks');
    const {getUserPreferences} = await import('vanilla-cookieconsent');
    const {SegmentAnalytics} = await import('./implementations/segment-analytics');
    const {NoOpAnalytics} = await import('./implementations/noop-analytics');

    mockUseAuth = useAuth as any;
    mockGetUserPreferences = getUserPreferences as any;
    mockSegmentAnalytics = SegmentAnalytics as any;
    mockNoOpAnalytics = NoOpAnalytics as any;

    vi.clearAllMocks();

    // Create mock analytics instances
    mockAnalyticsInstance = {
      identify: vi.fn(),
      track: vi.fn()
    };

    mockNoOpInstance = {
      identify: vi.fn(),
      track: vi.fn()
    };

    // Mock constructors
    mockSegmentAnalytics.mockImplementation(() => mockAnalyticsInstance);
    mockNoOpAnalytics.mockImplementation(() => mockNoOpInstance);

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      authInfo: {
        isAuthenticated: false,
        user: null
      }
    });

    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: []
    });

    // Mock window.addEventListener and removeEventListener
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <AnalyticsProvider>
        <div data-testid="child">Test Child</div>
      </AnalyticsProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('provides context with initial state', () => {
    render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(screen.getByTestId('consent-status')).toHaveTextContent('denied');
    expect(screen.getByTestId('analytics-status')).toHaveTextContent('not-initialized');
  });

  it('initializes analytics when consent is given and segment ID exists', () => {
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: ['analytics']
    });

    render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(screen.getByTestId('consent-status')).toHaveTextContent('granted');
    expect(screen.getByTestId('analytics-status')).toHaveTextContent('initialized');
    expect(mockSegmentAnalytics).toHaveBeenCalledTimes(1);
    expect(mockNoOpAnalytics).not.toHaveBeenCalled();
  });

  it('does not initialize analytics when consent is not given', () => {
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: ['functional']
    });

    render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(screen.getByTestId('consent-status')).toHaveTextContent('denied');
    expect(screen.getByTestId('analytics-status')).toHaveTextContent('not-initialized');
    expect(mockSegmentAnalytics).not.toHaveBeenCalled();
    expect(mockNoOpAnalytics).not.toHaveBeenCalled();
  });

  it('sets up cookie consent event listeners', () => {
    render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(window.addEventListener).toHaveBeenCalledWith('cc:onChange', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('cc:onConsent', expect.any(Function));
  });

  it('updates consent state when cookie consent changes', () => {
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: []
    });

    render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(screen.getByTestId('consent-status')).toHaveTextContent('denied');

    // Simulate consent change
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: ['analytics']
    });

    act(() => {
      fireEvent(window, new CustomEvent('cc:onChange'));
    });

    expect(screen.getByTestId('consent-status')).toHaveTextContent('granted');
  });

  it('calls analytics identify and track when user is authenticated', () => {
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: ['analytics']
    });

    mockUseAuth.mockReturnValue({
      authInfo: {
        isAuthenticated: true,
        user: {
          username: 'test@example.com',
          name: 'Test User',
          tenant: {
            id: 'tenant-123',
            name: 'Test Org'
          }
        }
      }
    });

    render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(mockAnalyticsInstance.identify).toHaveBeenCalledWith('test@example.com', {
      userId: 'test@example.com',
      name: 'Test User',
      email: 'test@example.com',
      orgId: 'tenant-123',
      orgName: 'Test Org'
    });

    expect(mockAnalyticsInstance.track).toHaveBeenCalledWith('USER_LOGGED_IN', {
      userId: 'test@example.com',
      name: 'Test User',
      email: 'test@example.com',
      orgId: 'tenant-123',
      orgName: 'Test Org'
    });
  });

  it('does not call analytics methods when user is null but isAuthenticated is true', () => {
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: ['analytics']
    });

    mockUseAuth.mockReturnValue({
      authInfo: {
        isAuthenticated: true,
        user: null
      }
    });

    render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(mockAnalyticsInstance.identify).not.toHaveBeenCalled();
    expect(mockAnalyticsInstance.track).not.toHaveBeenCalled();
  });

  it('does not call analytics methods when consent is not given', () => {
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: []
    });

    mockUseAuth.mockReturnValue({
      authInfo: {
        isAuthenticated: true,
        user: {
          username: 'test@example.com',
          name: 'Test User'
        }
      }
    });

    render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(mockAnalyticsInstance.identify).not.toHaveBeenCalled();
    expect(mockAnalyticsInstance.track).not.toHaveBeenCalled();
  });

  it('handles authentication changes after consent is given', () => {
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: ['analytics']
    });

    const {rerender} = render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(mockAnalyticsInstance.identify).not.toHaveBeenCalled();

    // User becomes authenticated
    mockUseAuth.mockReturnValue({
      authInfo: {
        isAuthenticated: true,
        user: {
          username: 'test@example.com',
          name: 'Test User',
          tenant: {
            id: 'tenant-123',
            name: 'Test Org'
          }
        }
      }
    });

    rerender(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(mockAnalyticsInstance.identify).toHaveBeenCalled();
    expect(mockAnalyticsInstance.track).toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {
    const {unmount} = render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('cc:onChange', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('cc:onConsent', expect.any(Function));
  });

  it('throws error when useAnalyticsContext is used outside provider', () => {
    const TestComponentOutsideProvider = () => {
      useAnalyticsContext();
      return <div>Test</div>;
    };

    expect(() => {
      render(<TestComponentOutsideProvider />);
    }).toThrow('useAnalyticsContext must be used within a AnalyticsProvider');
  });

  it('does not initialize analytics when segment ID is missing', () => {
    // Set SEGMENT_ID to undefined to simulate missing config
    // @ts-expect-error error
    mockConfig.SEGMENT_ID = undefined;

    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: ['analytics']
    });

    render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(screen.getByTestId('consent-status')).toHaveTextContent('granted');
    expect(screen.getByTestId('analytics-status')).toHaveTextContent('not-initialized');
    expect(mockSegmentAnalytics).not.toHaveBeenCalled();
    expect(mockNoOpAnalytics).toHaveBeenCalledTimes(1);
  });

  it('handles user with missing tenant information', () => {
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: ['analytics']
    });

    mockUseAuth.mockReturnValue({
      authInfo: {
        isAuthenticated: true,
        user: {
          username: 'test@example.com',
          name: 'Test User',
          tenant: null
        }
      }
    });

    render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(mockAnalyticsInstance.identify).toHaveBeenCalledWith('test@example.com', {
      userId: 'test@example.com',
      name: 'Test User',
      email: 'test@example.com',
      orgId: undefined,
      orgName: undefined
    });
  });

  it('handles partial user information', () => {
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: ['analytics']
    });

    mockUseAuth.mockReturnValue({
      authInfo: {
        isAuthenticated: true,
        user: {
          username: 'test@example.com'
          // name and tenant are missing
        }
      }
    });

    render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(mockAnalyticsInstance.identify).toHaveBeenCalledWith('test@example.com', {
      userId: 'test@example.com',
      name: undefined,
      email: 'test@example.com',
      orgId: undefined,
      orgName: undefined
    });
  });

  it('responds to cc:onConsent event', () => {
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: []
    });

    render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(screen.getByTestId('consent-status')).toHaveTextContent('denied');

    // Simulate consent given
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: ['analytics']
    });

    act(() => {
      fireEvent(window, new CustomEvent('cc:onConsent'));
    });

    expect(screen.getByTestId('consent-status')).toHaveTextContent('granted');
  });

  it('does not reinitialize analytics if already initialized when consent changes', () => {
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: ['analytics']
    });

    const {rerender} = render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(mockSegmentAnalytics).toHaveBeenCalledTimes(1);

    // Trigger consent change but consent remains granted
    act(() => {
      fireEvent(window, new CustomEvent('cc:onChange'));
    });

    rerender(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    // Should not create a new instance since analytics is already initialized
    expect(mockSegmentAnalytics).toHaveBeenCalledTimes(1);
  });

  it('initializes analytics when consent changes from denied to granted', () => {
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: []
    });

    render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(screen.getByTestId('analytics-status')).toHaveTextContent('not-initialized');
    expect(mockSegmentAnalytics).not.toHaveBeenCalled();

    // Grant consent
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: ['analytics']
    });

    act(() => {
      fireEvent(window, new CustomEvent('cc:onChange'));
    });

    expect(screen.getByTestId('consent-status')).toHaveTextContent('granted');
    expect(screen.getByTestId('analytics-status')).toHaveTextContent('initialized');
    expect(mockSegmentAnalytics).toHaveBeenCalledTimes(1);
  });

  it('tracks user login after analytics initialization when user becomes authenticated', () => {
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: []
    });

    mockUseAuth.mockReturnValue({
      authInfo: {
        isAuthenticated: false,
        user: null
      }
    });

    const {rerender} = render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    // Grant consent first
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: ['analytics']
    });

    act(() => {
      fireEvent(window, new CustomEvent('cc:onChange'));
    });

    expect(mockAnalyticsInstance.identify).not.toHaveBeenCalled();
    expect(mockAnalyticsInstance.track).not.toHaveBeenCalled();

    // Then user becomes authenticated
    mockUseAuth.mockReturnValue({
      authInfo: {
        isAuthenticated: true,
        user: {
          username: 'test@example.com',
          name: 'Test User'
        }
      }
    });

    rerender(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(mockAnalyticsInstance.identify).toHaveBeenCalledWith('test@example.com', {
      userId: 'test@example.com',
      name: 'Test User',
      email: 'test@example.com',
      orgId: undefined,
      orgName: undefined
    });

    expect(mockAnalyticsInstance.track).toHaveBeenCalledWith('USER_LOGGED_IN', {
      userId: 'test@example.com',
      name: 'Test User',
      email: 'test@example.com',
      orgId: undefined,
      orgName: undefined
    });
  });

  it('handles consent revocation gracefully', () => {
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: ['analytics']
    });

    render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(screen.getByTestId('consent-status')).toHaveTextContent('granted');

    // Revoke consent
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: ['functional']
    });

    act(() => {
      fireEvent(window, new CustomEvent('cc:onChange'));
    });

    expect(screen.getByTestId('consent-status')).toHaveTextContent('denied');
    // Analytics instance should still exist (not recreated)
    expect(screen.getByTestId('analytics-status')).toHaveTextContent('initialized');
  });

  it('handles empty user preferences', () => {
    mockGetUserPreferences.mockReturnValue({});

    render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(screen.getByTestId('consent-status')).toHaveTextContent('denied');
    expect(screen.getByTestId('analytics-status')).toHaveTextContent('not-initialized');
  });

  it('handles analytics initialization failure gracefully', () => {
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: ['analytics']
    });

    // Simulate analytics initialization failure
    mockSegmentAnalytics.mockImplementation(() => {
      throw new Error('Analytics initialization failed');
    });

    expect(() => {
      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      );
    }).toThrow('Analytics initialization failed');
  });

  it('handles multiple consent changes correctly', () => {
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: []
    });

    render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(screen.getByTestId('consent-status')).toHaveTextContent('denied');

    // Grant consent
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: ['analytics']
    });

    act(() => {
      fireEvent(window, new CustomEvent('cc:onChange'));
    });

    expect(screen.getByTestId('consent-status')).toHaveTextContent('granted');

    // Revoke consent
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: []
    });

    act(() => {
      fireEvent(window, new CustomEvent('cc:onChange'));
    });

    expect(screen.getByTestId('consent-status')).toHaveTextContent('denied');

    // Grant consent again
    mockGetUserPreferences.mockReturnValue({
      acceptedCategories: ['analytics']
    });

    act(() => {
      fireEvent(window, new CustomEvent('cc:onConsent'));
    });

    expect(screen.getByTestId('consent-status')).toHaveTextContent('granted');
  });
});
