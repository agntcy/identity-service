/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {describe, it, vi, beforeEach, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {ThemeProvider} from './theme-provider';
import React from 'react';

// Mock the store
vi.mock('@/store', () => ({
  useThemeStore: vi.fn()
}));

// Mock zustand shallow
vi.mock('zustand/react/shallow', () => ({
  useShallow: vi.fn((fn) => fn)
}));

// Mock SparkThemeProvider
vi.mock('@open-ui-kit/core', () => ({
  ThemeProvider: vi.fn(({children, isDarkMode}) =>
    React.createElement('div', {'data-testid': 'spark-theme-provider', 'data-dark-mode': isDarkMode}, children)
  )
}));

const mockUseThemeStore = vi.mocked(await import('@/store')).useThemeStore;
const mockUseShallow = vi.mocked(await import('zustand/react/shallow')).useShallow;
const mockSparkThemeProvider = vi.mocked(await import('@open-ui-kit/core')).ThemeProvider;

describe('ThemeProvider', () => {
  const createMockState = (isDarkMode: boolean) => ({
    isDarkMode,
    toggleTheme: vi.fn(),
    setTheme: vi.fn(),
    toggleDarkMode: vi.fn(),
    setDarkMode: vi.fn()
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children correctly', () => {
    mockUseThemeStore.mockImplementation((selector) => {
      const mockState = createMockState(false);
      return selector ? selector(mockState) : mockState;
    });

    render(
      <ThemeProvider>
        <div data-testid="test-child">Test Content</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('passes isDarkMode=false to SparkThemeProvider when store has isDarkMode=false', () => {
    mockUseThemeStore.mockImplementation((selector) => {
      const mockState = createMockState(false);
      return selector ? selector(mockState) : mockState;
    });

    render(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    );

    expect(mockSparkThemeProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        isDarkMode: false
      }),
      expect.anything()
    );

    const sparkProvider = screen.getByTestId('spark-theme-provider');
    expect(sparkProvider).toHaveAttribute('data-dark-mode', 'false');
  });

  it('passes isDarkMode=true to SparkThemeProvider when store has isDarkMode=true', () => {
    mockUseThemeStore.mockImplementation((selector) => {
      const mockState = createMockState(true);
      return selector ? selector(mockState) : mockState;
    });

    render(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    );

    expect(mockSparkThemeProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        isDarkMode: true
      }),
      expect.anything()
    );

    const sparkProvider = screen.getByTestId('spark-theme-provider');
    expect(sparkProvider).toHaveAttribute('data-dark-mode', 'true');
  });

  it('calls useThemeStore with useShallow selector', () => {
    mockUseThemeStore.mockImplementation((selector) => {
      const mockState = createMockState(false);
      return selector ? selector(mockState) : mockState;
    });

    render(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    );

    expect(mockUseThemeStore).toHaveBeenCalledWith(expect.any(Function));
    expect(mockUseShallow).toHaveBeenCalledWith(expect.any(Function));
  });

  it('selector function extracts only isDarkMode from store', () => {
    let capturedSelector: ((store: any) => any) | null = null;

    mockUseThemeStore.mockImplementation((selector) => {
      capturedSelector = selector;
      const mockState = createMockState(true);
      return selector ? selector(mockState) : mockState;
    });

    render(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    );

    expect(capturedSelector).toBeDefined();
    if (capturedSelector) {
      const mockStore = {
        ...createMockState(true),
        otherProperty: 'should not be selected'
      };

      const result = (capturedSelector as (store: any) => any)(mockStore);
      expect(result).toEqual({
        isDarkMode: true
      });
      expect(result).not.toHaveProperty('toggleTheme');
      expect(result).not.toHaveProperty('setTheme');
      expect(result).not.toHaveProperty('toggleDarkMode');
      expect(result).not.toHaveProperty('setDarkMode');
      expect(result).not.toHaveProperty('otherProperty');
    }
  });

  it('handles store state changes correctly', () => {
    mockUseThemeStore.mockImplementation((selector) => {
      const mockState = createMockState(false);
      return selector ? selector(mockState) : mockState;
    });

    const {rerender} = render(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('spark-theme-provider')).toHaveAttribute('data-dark-mode', 'false');

    mockUseThemeStore.mockImplementation((selector) => {
      const mockState = createMockState(true);
      return selector ? selector(mockState) : mockState;
    });

    rerender(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('spark-theme-provider')).toHaveAttribute('data-dark-mode', 'true');
  });

  it('renders null children without error', () => {
    mockUseThemeStore.mockImplementation((selector) => {
      const mockState = createMockState(false);
      return selector ? selector(mockState) : mockState;
    });

    render(<ThemeProvider>{null}</ThemeProvider>);

    expect(screen.getByTestId('spark-theme-provider')).toBeInTheDocument();
  });

  it('renders empty fragment children without error', () => {
    mockUseThemeStore.mockImplementation((selector) => {
      const mockState = createMockState(false);
      return selector ? selector(mockState) : mockState;
    });

    render(
      <ThemeProvider>
        <></>
      </ThemeProvider>
    );

    expect(screen.getByTestId('spark-theme-provider')).toBeInTheDocument();
  });

  it('renders string children correctly', () => {
    mockUseThemeStore.mockImplementation((selector) => {
      const mockState = createMockState(false);
      return selector ? selector(mockState) : mockState;
    });

    render(<ThemeProvider>Plain text content</ThemeProvider>);

    expect(screen.getByText('Plain text content')).toBeInTheDocument();
  });

  it('renders complex nested children correctly', () => {
    mockUseThemeStore.mockImplementation((selector) => {
      const mockState = createMockState(true);
      return selector ? selector(mockState) : mockState;
    });

    render(
      <ThemeProvider>
        <div data-testid="parent">
          <span data-testid="child">Nested Content</span>
          <div data-testid="sibling">
            <p data-testid="grandchild">Deep nested</p>
          </div>
        </div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('parent')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('sibling')).toBeInTheDocument();
    expect(screen.getByTestId('grandchild')).toBeInTheDocument();
    expect(screen.getByText('Nested Content')).toBeInTheDocument();
    expect(screen.getByText('Deep nested')).toBeInTheDocument();
  });

  it('maintains component identity across re-renders with same isDarkMode value', () => {
    mockUseThemeStore.mockImplementation((selector) => {
      const mockState = createMockState(false);
      return selector ? selector(mockState) : mockState;
    });

    const {rerender} = render(
      <ThemeProvider>
        <div data-testid="content">Content</div>
      </ThemeProvider>
    );

    const firstRender = screen.getByTestId('spark-theme-provider');

    rerender(
      <ThemeProvider>
        <div data-testid="content">Content</div>
      </ThemeProvider>
    );

    const secondRender = screen.getByTestId('spark-theme-provider');
    expect(firstRender).toBe(secondRender);
  });

  it('calls selector function only once per render', () => {
    mockUseThemeStore.mockImplementation((selector) => {
      const mockState = createMockState(false);
      return selector ? selector(mockState) : mockState;
    });

    mockUseShallow.mockImplementation((fn) => fn);

    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );

    expect(mockUseThemeStore).toHaveBeenCalledTimes(1);
  });

  it('preserves SparkThemeProvider props correctly', () => {
    mockUseThemeStore.mockImplementation((selector) => {
      const mockState = createMockState(true);
      return selector ? selector(mockState) : mockState;
    });

    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );

    expect(mockSparkThemeProvider).toHaveBeenCalledWith(
      {
        isDarkMode: true,
        children: expect.anything()
      },
      expect.anything()
    );
  });

  it('renders multiple children correctly', () => {
    mockUseThemeStore.mockImplementation((selector) => {
      const mockState = createMockState(false);
      return selector ? selector(mockState) : mockState;
    });

    render(
      <ThemeProvider>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <span data-testid="child-3">Child 3</span>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });
});
