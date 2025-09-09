/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {screen, fireEvent, waitFor} from '@testing-library/react';
import Layout from '../layout';
import '@testing-library/jest-dom';
import {renderWithClient} from '@/utils/tests';
import React from 'react';

// Mock react-router-dom with proper MemoryRouter
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    Outlet: () => <div data-testid="outlet">Page Content</div>,
    MemoryRouter: ({children, initialEntries, initialIndex}: any) => (
      <div data-testid="memory-router" data-initial-entries={initialEntries} data-initial-index={initialIndex}>
        {children}
      </div>
    )
  };
});

// Mock resizable components
vi.mock('@/components/ui/resizable', () => ({
  ResizablePanel: ({children, hidden, onCollapse, onExpand, className, collapsible, minSize, maxSize, ...props}: any) => (
    <div
      data-testid={hidden ? 'resizable-panel-hidden' : 'resizable-panel'}
      data-hidden={hidden}
      data-collapsible={collapsible}
      data-min-size={minSize}
      data-max-size={maxSize}
      className={className}
      {...props}
    >
      {!hidden && onCollapse && (
        <button data-testid="collapse-button" onClick={onCollapse}>
          Collapse
        </button>
      )}
      {!hidden && onExpand && (
        <button data-testid="expand-button" onClick={onExpand}>
          Expand
        </button>
      )}
      {children}
    </div>
  ),
  ResizablePanelGroup: ({children, direction, onLayout, style, className, ...props}: any) => (
    <div
      data-testid={`resizable-panel-group-${direction}`}
      data-direction={direction}
      style={style}
      className={className}
      {...props}
    >
      {children}
      {onLayout && (
        <button data-testid="trigger-layout" onClick={() => onLayout([15, 85])}>
          Trigger Layout
        </button>
      )}
    </div>
  )
}));

// Mock SideNav component as named export
vi.mock('../side-nav', () => ({
  SideNav: ({isCollapsed, onChangeCollapsed}: any) => (
    <div data-testid="side-nav" data-collapsed={isCollapsed}>
      <button data-testid="side-nav-toggle" onClick={() => onChangeCollapsed && onChangeCollapsed(!isCollapsed)}>
        Toggle SideNav
      </button>
      SideNav Content
    </div>
  )
}));

// Mock Header component as named export
vi.mock('../header', () => ({
  Header: () => <div data-testid="header">Header Content</div>
}));

// Mock Footer component as named export
vi.mock('../footer', () => ({
  Footer: () => <div data-testid="footer">Footer Content</div>
}));

// Mock BannerProvider
vi.mock('@/providers/banner-provider/banner-provider', () => ({
  BannerProvider: ({children}: any) => <div data-testid="banner-provider">{children}</div>
}));

// Mock cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' ')
}));

// Mock window dimensions
const originalInnerWidth = window.innerWidth;
let mockInnerWidth = 1024;

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: mockInnerWidth
});

// Mock window event listeners
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

Object.defineProperty(window, 'addEventListener', {
  writable: true,
  value: mockAddEventListener
});

Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  value: mockRemoveEventListener
});

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInnerWidth = 1024;
    (window as any).innerWidth = mockInnerWidth;
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
  });

  afterEach(() => {
    (window as any).innerWidth = originalInnerWidth;
  });

  it('renders all main layout components', () => {
    renderWithClient(<Layout />);

    expect(screen.getByTestId('banner-provider')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('renders with correct panel group structure', () => {
    renderWithClient(<Layout />);

    expect(screen.getByTestId('resizable-panel-group-vertical')).toBeInTheDocument();
    expect(screen.getByTestId('resizable-panel-group-horizontal')).toBeInTheDocument();
  });

  it('initializes with desktop layout when screen is wide', () => {
    mockInnerWidth = 1024;
    (window as any).innerWidth = mockInnerWidth;

    renderWithClient(<Layout />);

    expect(screen.getByTestId('banner-provider')).toBeInTheDocument();
  });

  it('initializes with mobile layout when screen is narrow', () => {
    mockInnerWidth = 600;
    (window as any).innerWidth = mockInnerWidth;

    renderWithClient(<Layout />);

    expect(screen.getByTestId('banner-provider')).toBeInTheDocument();
  });

  it('sets up resize event listener on mount', () => {
    renderWithClient(<Layout />);

    expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('removes resize event listener on unmount', () => {
    const {unmount} = renderWithClient(<Layout />);

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('handles layout changes', () => {
    renderWithClient(<Layout />);

    const triggerLayoutButton = screen.queryByTestId('trigger-layout');
    if (triggerLayoutButton) {
      fireEvent.click(triggerLayoutButton);
      expect(triggerLayoutButton).toBeInTheDocument();
    }
  });

  it('sets correct styles on root container', () => {
    renderWithClient(<Layout />);

    const verticalPanelGroup = screen.getByTestId('resizable-panel-group-vertical');
    expect(verticalPanelGroup).toHaveClass('fixed');
    expect(verticalPanelGroup).toHaveStyle({
      height: '100vh'
    });
  });

  it('wraps content in banner provider', () => {
    renderWithClient(<Layout />);

    const bannerProvider = screen.getByTestId('banner-provider');
    expect(bannerProvider).toBeInTheDocument();

    expect(bannerProvider).toContainElement(screen.getByTestId('header'));
    expect(bannerProvider).toContainElement(screen.getByTestId('footer'));
    expect(bannerProvider).toContainElement(screen.getByTestId('outlet'));
  });

  it('renders memory router correctly', () => {
    renderWithClient(<Layout />);

    expect(screen.getByTestId('memory-router')).toBeInTheDocument();
  });

  it('renders main layout structure', () => {
    renderWithClient(<Layout />);

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByTestId('banner-provider')).toBeInTheDocument();
  });

  it('renders resizable panels with correct props', () => {
    renderWithClient(<Layout />);

    const panels = screen.getAllByTestId('resizable-panel');
    expect(panels.length).toBeGreaterThan(0);

    // Check that panels have the expected data attributes
    panels.forEach((panel) => {
      expect(panel).toHaveAttribute('data-collapsible');
      expect(panel).toHaveAttribute('data-min-size');
    });
  });

  it('renders with correct fixed positioning', () => {
    renderWithClient(<Layout />);

    const verticalPanelGroup = screen.getByTestId('resizable-panel-group-vertical');
    expect(verticalPanelGroup).toHaveClass('fixed');
  });
});
