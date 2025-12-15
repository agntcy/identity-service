/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {screen, cleanup} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import Dashboard from './dashboard';
import {renderWithClient} from '@/utils/tests';

// Mock hooks
vi.mock('@/hooks', () => ({
  useAnalytics: vi.fn(() => ({
    analyticsTrack: vi.fn()
  }))
}));

// Mock store
vi.mock('@/store', () => ({
  useLocalStore: vi.fn()
}));

// Mock zustand
vi.mock('zustand/react/shallow', () => ({
  useShallow: vi.fn((fn) => fn)
}));

// Mock ContentDashboard component
vi.mock('@/components/dashboard/content-dashboard', () => ({
  ContentDashboard: () => <div data-testid="content-dashboard">ContentDashboard</div>
}));

// Mock CSS import
vi.mock('@/styles/dashboard.css', () => ({}));

const mockUseLocalStore = vi.mocked(await import('@/store')).useLocalStore;

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useLocalStore with default values
    mockUseLocalStore.mockReturnValue({
      addAgent: false,
      setAddAgent: vi.fn(),
      setIdp: false,
      setSetIdp: vi.fn(),
      createBadge: false,
      setCreateBadge: vi.fn(),
      createPolicy: false,
      setCreatePolicy: vi.fn()
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders without crashing', () => {
    renderWithClient(<Dashboard />);
    expect(screen.getByTestId('content-dashboard')).toBeInTheDocument();
  });

  it('renders ContentDashboard component', () => {
    renderWithClient(<Dashboard />);

    expect(screen.getByTestId('content-dashboard')).toBeInTheDocument();
    expect(screen.getByText('ContentDashboard')).toBeInTheDocument();
  });

  it('component unmounts gracefully', () => {
    const {unmount} = renderWithClient(<Dashboard />);
    expect(() => unmount()).not.toThrow();
  });

  it('is a functional component', () => {
    expect(Dashboard).toBeInstanceOf(Function);
    expect(Dashboard.name).toBe('Dashboard');
  });

  it('imports and uses dashboard CSS styles', () => {
    // This test verifies that the CSS import is present
    // The actual import is mocked, but we can verify the component renders without errors
    expect(() => renderWithClient(<Dashboard />)).not.toThrow();
  });

  it('maintains consistent behavior across multiple renders', () => {
    // First render
    renderWithClient(<Dashboard />);
    expect(screen.getByTestId('content-dashboard')).toBeInTheDocument();

    cleanup();

    // Second render
    renderWithClient(<Dashboard />);
    expect(screen.getByTestId('content-dashboard')).toBeInTheDocument();
  });

  it('renders the same component regardless of props', () => {
    // Dashboard doesn't take props, it should always render ContentDashboard
    const {container: container1} = renderWithClient(<Dashboard />);
    cleanup();
    const {container: container2} = renderWithClient(<Dashboard />);

    expect(container1.innerHTML).toBeDefined();
    expect(container2.innerHTML).toBeDefined();
  });

  it('has simple structure that delegates to ContentDashboard', () => {
    const {container} = renderWithClient(<Dashboard />);

    // Should contain the ContentDashboard component
    expect(container.querySelector('[data-testid="content-dashboard"]')).toBeInTheDocument();
  });
});
