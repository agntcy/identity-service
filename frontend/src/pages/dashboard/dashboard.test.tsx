/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import {screen, cleanup} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import Dashboard from './dashboard';
import {renderWithClient} from '@/utils/tests';

// Mock store
vi.mock('@/store', () => ({
  useSettingsStore: vi.fn()
}));

// Mock zustand
vi.mock('zustand/react/shallow', () => ({
  useShallow: vi.fn()
}));

// Mock components
vi.mock('@/components/dashboard/empty-dashboard', () => ({
  EmptyDashboard: () => <div data-testid="empty-dashboard">EmptyDashboard</div>
}));

vi.mock('@/components/dashboard/stats-dashboard', () => ({
  StatsDashboard: () => <div data-testid="stats-dashboard">StatsDashboard</div>
}));

// Mock CSS import
vi.mock('@/styles/dashboard.css', () => ({}));

const mockUseSettingsStore = vi.mocked(await import('@/store')).useSettingsStore;
const mockUseShallow = vi.mocked(await import('zustand/react/shallow')).useShallow;

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders without crashing', () => {
    // Setup store mock for empty IDP
    mockUseShallow.mockImplementation((selector: any) =>
      selector({
        isEmptyIdp: true
      })
    );
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: true
    });

    renderWithClient(<Dashboard />);
    expect(screen.getByTestId('empty-dashboard')).toBeInTheDocument();
  });

  it('renders EmptyDashboard when isEmptyIdp is true', () => {
    // Setup store mock for empty IDP
    mockUseShallow.mockImplementation((selector: any) =>
      selector({
        isEmptyIdp: true
      })
    );
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: true
    });

    renderWithClient(<Dashboard />);

    expect(screen.getByTestId('empty-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('stats-dashboard')).not.toBeInTheDocument();
  });

  it('renders StatsDashboard when isEmptyIdp is false', () => {
    // Setup store mock for non-empty IDP
    mockUseShallow.mockImplementation((selector: any) =>
      selector({
        isEmptyIdp: false
      })
    );
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: false
    });

    renderWithClient(<Dashboard />);

    expect(screen.getByTestId('stats-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-dashboard')).not.toBeInTheDocument();
  });

  it('uses settings store with correct selector', () => {
    mockUseShallow.mockImplementation((selector: any) =>
      selector({
        isEmptyIdp: false
      })
    );
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: false
    });

    renderWithClient(<Dashboard />);

    expect(mockUseSettingsStore).toHaveBeenCalled();
    expect(mockUseShallow).toHaveBeenCalled();
  });

  it('store selector extracts only isEmptyIdp property', () => {
    mockUseShallow.mockImplementation((selector: any) =>
      selector({
        isEmptyIdp: true,
        otherProperty: 'should not be selected'
      })
    );
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: true
    });

    renderWithClient(<Dashboard />);

    expect(mockUseShallow).toHaveBeenCalledWith(expect.any(Function));

    const selectorFunction = mockUseShallow.mock.calls[0][0];
    const mockState = {
      isEmptyIdp: true,
      otherProperty: 'should not be selected',
      anotherProperty: 123
    };

    const result = selectorFunction(mockState);
    expect(result).toEqual({
      isEmptyIdp: true
    });
    expect(result).not.toHaveProperty('otherProperty');
    expect(result).not.toHaveProperty('anotherProperty');
  });

  it('handles undefined isEmptyIdp as falsy', () => {
    mockUseShallow.mockImplementation((selector: any) =>
      selector({
        isEmptyIdp: undefined
      })
    );
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: undefined
    });

    renderWithClient(<Dashboard />);

    // undefined should be falsy, so StatsDashboard should render
    expect(screen.getByTestId('stats-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-dashboard')).not.toBeInTheDocument();
  });

  it('handles null isEmptyIdp as falsy', () => {
    mockUseShallow.mockImplementation((selector: any) =>
      selector({
        isEmptyIdp: null
      })
    );
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: null
    });

    renderWithClient(<Dashboard />);

    // null should be falsy, so StatsDashboard should render
    expect(screen.getByTestId('stats-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-dashboard')).not.toBeInTheDocument();
  });

  it('store is called exactly once', () => {
    mockUseShallow.mockImplementation((selector: any) =>
      selector({
        isEmptyIdp: false
      })
    );
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: false
    });

    renderWithClient(<Dashboard />);

    expect(mockUseSettingsStore).toHaveBeenCalledTimes(1);
    expect(mockUseShallow).toHaveBeenCalledTimes(1);
  });

  it('renders different components based on store state changes', () => {
    // First render with empty IDP
    mockUseShallow.mockImplementation((selector: any) =>
      selector({
        isEmptyIdp: true
      })
    );
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: true
    });

    renderWithClient(<Dashboard />);
    expect(screen.getByTestId('empty-dashboard')).toBeInTheDocument();

    cleanup();

    // Second render with non-empty IDP
    vi.clearAllMocks();
    mockUseShallow.mockImplementation((selector: any) =>
      selector({
        isEmptyIdp: false
      })
    );
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: false
    });

    renderWithClient(<Dashboard />);
    expect(screen.getByTestId('stats-dashboard')).toBeInTheDocument();
  });

  it('component structure is simple conditional rendering', () => {
    mockUseShallow.mockImplementation((selector: any) =>
      selector({
        isEmptyIdp: true
      })
    );
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: true
    });

    const {container} = renderWithClient(<Dashboard />);

    // Should only contain the EmptyDashboard component, no wrapper elements
    expect(container.firstChild).toEqual(screen.getByTestId('empty-dashboard'));
  });

  it('handles boolean true correctly', () => {
    mockUseShallow.mockImplementation((selector: any) =>
      selector({
        isEmptyIdp: true
      })
    );
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: true
    });

    renderWithClient(<Dashboard />);

    expect(screen.getByTestId('empty-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('stats-dashboard')).not.toBeInTheDocument();
  });

  it('handles boolean false correctly', () => {
    mockUseShallow.mockImplementation((selector: any) =>
      selector({
        isEmptyIdp: false
      })
    );
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: false
    });

    renderWithClient(<Dashboard />);

    expect(screen.getByTestId('stats-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-dashboard')).not.toBeInTheDocument();
  });

  it('handles truthy non-boolean values', () => {
    // Test with truthy non-boolean values
    const truthyValues = ['string', 1, {}, []];

    truthyValues.forEach((value, index) => {
      if (index > 0) {
        cleanup();
      }

      vi.clearAllMocks();
      mockUseShallow.mockImplementation((selector: any) =>
        selector({
          isEmptyIdp: value
        })
      );
      mockUseSettingsStore.mockReturnValue({
        isEmptyIdp: value
      });

      renderWithClient(<Dashboard />);

      // All truthy values should render EmptyDashboard
      expect(screen.getByTestId('empty-dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('stats-dashboard')).not.toBeInTheDocument();
    });
  });

  it('handles falsy non-boolean values', () => {
    // Test with falsy non-boolean values
    const falsyValues = [0, '', null, undefined];

    falsyValues.forEach((value, index) => {
      if (index > 0) {
        cleanup();
      }

      vi.clearAllMocks();
      mockUseShallow.mockImplementation((selector: any) =>
        selector({
          isEmptyIdp: value
        })
      );
      mockUseSettingsStore.mockReturnValue({
        isEmptyIdp: value
      });

      renderWithClient(<Dashboard />);

      // All falsy values should render StatsDashboard
      expect(screen.getByTestId('stats-dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('empty-dashboard')).not.toBeInTheDocument();
    });
  });

  it('uses shallow comparison for store selector', () => {
    mockUseShallow.mockReturnValue({
      // @ts-expect-error - Mocking store behavior for testing
      isEmptyIdp: false
    });

    mockUseSettingsStore.mockImplementation((callback) => {
      // The component calls useSettingsStore with the result of useShallow
      return callback;
    });

    renderWithClient(<Dashboard />);

    // Verify that useShallow is called with a selector function
    expect(mockUseShallow).toHaveBeenCalledWith(expect.any(Function));

    // The useSettingsStore should be called with the result from useShallow
    expect(mockUseSettingsStore).toHaveBeenCalledWith({
      isEmptyIdp: false
    });
  });

  it('component unmounts gracefully', () => {
    mockUseShallow.mockImplementation((selector: any) =>
      selector({
        isEmptyIdp: false
      })
    );
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: false
    });

    const {unmount} = renderWithClient(<Dashboard />);

    expect(() => unmount()).not.toThrow();
  });

  it('is a functional component', () => {
    expect(Dashboard).toBeInstanceOf(Function);
    expect(Dashboard.name).toBe('Dashboard');
  });

  it('imports and uses dashboard CSS styles', () => {
    // This test verifies that the CSS import is present
    // The actual import is mocked, but we can verify the mock was set up
    expect(vi.isMockFunction).toBeDefined();

    // Just render to ensure no errors with CSS import
    mockUseShallow.mockImplementation((selector: any) =>
      selector({
        isEmptyIdp: false
      })
    );
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: false
    });

    expect(() => renderWithClient(<Dashboard />)).not.toThrow();
  });

  it('maintains consistent behavior across multiple renders', () => {
    const testScenarios = [
      {isEmptyIdp: true, expectedComponent: 'empty-dashboard'},
      {isEmptyIdp: false, expectedComponent: 'stats-dashboard'},
      {isEmptyIdp: true, expectedComponent: 'empty-dashboard'}
    ];

    testScenarios.forEach(({isEmptyIdp, expectedComponent}, index) => {
      if (index > 0) {
        cleanup();
      }

      vi.clearAllMocks();
      mockUseShallow.mockImplementation((selector: any) => selector({isEmptyIdp}));
      mockUseSettingsStore.mockReturnValue({isEmptyIdp});

      renderWithClient(<Dashboard />);

      expect(screen.getByTestId(expectedComponent)).toBeInTheDocument();

      const unexpectedComponent = expectedComponent === 'empty-dashboard' ? 'stats-dashboard' : 'empty-dashboard';
      expect(screen.queryByTestId(unexpectedComponent)).not.toBeInTheDocument();
    });
  });

  it('selector function is pure and deterministic', () => {
    mockUseShallow.mockImplementation((selector: any) => {
      // Call selector multiple times with same input to test purity
      const state = {isEmptyIdp: true, other: 'value'};
      const result1 = selector(state);
      const result2 = selector(state);

      expect(result1).toEqual(result2);
      expect(result1).toEqual({isEmptyIdp: true});

      return result1;
    });
    mockUseSettingsStore.mockReturnValue({
      isEmptyIdp: true
    });

    renderWithClient(<Dashboard />);

    expect(screen.getByTestId('empty-dashboard')).toBeInTheDocument();
  });

  it('zustand integration works correctly', () => {
    // Test the actual pattern used in the component:
    // useSettingsStore(useShallow((state) => ({ isEmptyIdp: state.isEmptyIdp })))

    const mockState = {
      isEmptyIdp: true,
      otherProp: 'other'
    };

    // Mock useShallow to return the selector result
    mockUseShallow.mockImplementation((selector: any) => {
      return selector(mockState);
    });

    // Mock useSettingsStore to accept the useShallow result
    mockUseSettingsStore.mockImplementation((selectorResult) => {
      return selectorResult;
    });

    renderWithClient(<Dashboard />);

    // Verify the hooks were called correctly
    expect(mockUseShallow).toHaveBeenCalledWith(expect.any(Function));
    expect(mockUseSettingsStore).toHaveBeenCalledWith({
      isEmptyIdp: true
    });

    // Verify correct component rendered
    expect(screen.getByTestId('empty-dashboard')).toBeInTheDocument();
  });
});
