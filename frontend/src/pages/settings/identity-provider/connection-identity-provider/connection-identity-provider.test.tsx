/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import {describe, it, vi, beforeEach, expect} from 'vitest';
import {screen, fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom';
import ConnectionIdentityProvider from './connection-identity-provider';
import {renderWithClient} from '@/utils/tests';
import {PATHS} from '@/router/paths';

// Mock paths
vi.mock('@/router/paths', () => ({
  PATHS: {
    settings: {
      base: '/settings',
      identityProvider: {
        base: '/settings/identity-provider'
      }
    }
  }
}));

// Mock components
vi.mock('@/components/layout/base-page', () => ({
  BasePage: ({children, title, breadcrumbs}: any) => (
    <div data-testid="base-page">
      <div data-testid="page-title">{title}</div>
      <div data-testid="breadcrumbs">{JSON.stringify(breadcrumbs)}</div>
      {children}
    </div>
  )
}));

vi.mock('@/components/identity-provider/create/create-identity-provider', () => ({
  CreateIdentityProvider: () => <div data-testid="create-identity-provider">Create Identity Provider Component</div>
}));

// Mock MUI components
vi.mock('@mui/material', () => ({
  IconButton: ({children, sx, onClick}: any) => {
    // Capture and test the sx function if it's a function
    let sxResult = sx;
    if (typeof sx === 'function') {
      // Call the sx function with a mock theme to test the returned styles
      const mockTheme = {
        palette: {
          vars: {
            baseTextDefault: '#333333'
          }
        }
      };
      sxResult = sx(mockTheme);
    }

    return (
      <button
        data-testid="info-icon-button"
        data-sx={sx ? (typeof sx === 'function' ? 'function' : JSON.stringify(sx)) : undefined}
        data-has-sx={!!sx}
        data-sx-result={sxResult ? JSON.stringify(sxResult) : undefined}
        onClick={onClick}
      >
        {children}
      </button>
    );
  },
  Tooltip: ({children, title, arrow, placement}: any) => (
    <div
      data-testid="tooltip"
      data-title={typeof title === 'string' ? title : ''}
      data-arrow={arrow?.toString()}
      data-placement={placement}
    >
      {children}
      <div data-testid="tooltip-content">{title}</div>
    </div>
  )
}));

// Mock Lucide React
vi.mock('lucide-react', () => ({
  InfoIcon: ({className}: any) => (
    <span data-testid="info-icon" className={className}>
      ℹ️
    </span>
  )
}));

describe('ConnectionIdentityProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithClient(<ConnectionIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('base-page')).toBeInTheDocument();
  });

  it('renders with correct title containing text and tooltip', () => {
    renderWithClient(<ConnectionIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    const pageTitle = screen.getByTestId('page-title');
    expect(pageTitle).toBeInTheDocument();

    // Check that the title contains the text
    expect(pageTitle).toHaveTextContent('Identity Provider Connection');

    // Check that tooltip and icon are present
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('info-icon-button')).toBeInTheDocument();
    expect(screen.getByTestId('info-icon')).toBeInTheDocument();
  });

  it('renders tooltip with correct props', () => {
    renderWithClient(<ConnectionIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toHaveAttribute('data-arrow', 'true');
    expect(tooltip).toHaveAttribute('data-placement', 'right');

    const tooltipContent = screen.getByTestId('tooltip-content');
    expect(tooltipContent).toHaveTextContent(
      "In the first release, you can link a single identity provider as an issuer, but it won't be possible to edit or remove it."
    );
  });

  it('renders icon button with correct styling', () => {
    renderWithClient(<ConnectionIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    const iconButton = screen.getByTestId('info-icon-button');
    expect(iconButton).toBeInTheDocument();

    // Check that sx prop is passed (it's a theme function, so we check it exists)
    expect(iconButton).toHaveAttribute('data-has-sx', 'true');
    expect(iconButton).toHaveAttribute('data-sx', 'function');
  });

  it('renders info icon with correct className', () => {
    renderWithClient(<ConnectionIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    const infoIcon = screen.getByTestId('info-icon');
    expect(infoIcon).toHaveClass('w-4', 'h-4');
  });

  it('renders correct breadcrumbs structure', () => {
    renderWithClient(<ConnectionIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbsText = screen.getByTestId('breadcrumbs').textContent;
    const breadcrumbs = JSON.parse(breadcrumbsText || '[]');

    expect(breadcrumbs).toHaveLength(3);
    expect(breadcrumbs[0]).toEqual({
      text: 'Settings',
      link: '/settings'
    });
    expect(breadcrumbs[1]).toEqual({
      text: 'Identity Provider',
      link: '/settings/identity-provider'
    });
    expect(breadcrumbs[2]).toEqual({
      text: 'Connection'
    });
  });

  it('maintains consistent breadcrumb hierarchy', () => {
    renderWithClient(<ConnectionIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbsText = screen.getByTestId('breadcrumbs').textContent;
    const breadcrumbs = JSON.parse(breadcrumbsText || '[]');

    // First breadcrumb should have link
    expect(breadcrumbs[0]).toHaveProperty('link');

    // Second breadcrumb should have link
    expect(breadcrumbs[1]).toHaveProperty('link');

    // Last breadcrumb should not have link (current page)
    expect(breadcrumbs[2]).not.toHaveProperty('link');
  });

  it('renders CreateIdentityProvider component', () => {
    renderWithClient(<ConnectionIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('create-identity-provider')).toBeInTheDocument();
    expect(screen.getByTestId('create-identity-provider')).toHaveTextContent('Create Identity Provider Component');
  });

  it('passes correct props to BasePage', () => {
    renderWithClient(<ConnectionIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    // Check that BasePage receives title as a complex element
    const pageTitle = screen.getByTestId('page-title');
    expect(pageTitle).toBeInTheDocument();

    // Check that BasePage receives breadcrumbs
    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs).toBeInTheDocument();

    // Check that BasePage receives children (CreateIdentityProvider)
    expect(screen.getByTestId('create-identity-provider')).toBeInTheDocument();
  });

  it('title structure contains flex layout elements', () => {
    renderWithClient(<ConnectionIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    // The title should contain both the text and the tooltip/icon
    const pageTitle = screen.getByTestId('page-title');

    // Should contain the main text
    expect(pageTitle).toHaveTextContent('Identity Provider Connection');

    // Should contain the tooltip/icon elements
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('info-icon-button')).toBeInTheDocument();
  });

  it('tooltip content has proper structure', () => {
    renderWithClient(<ConnectionIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    const tooltipContent = screen.getByTestId('tooltip-content');

    // Check the exact tooltip message
    expect(tooltipContent).toHaveTextContent(
      "In the first release, you can link a single identity provider as an issuer, but it won't be possible to edit or remove it."
    );
  });

  it('handles icon button interaction', () => {
    renderWithClient(<ConnectionIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    const iconButton = screen.getByTestId('info-icon-button');

    // Verify button is clickable
    expect(iconButton).toBeInTheDocument();

    // Simulate click to ensure no errors
    fireEvent.click(iconButton);

    // No errors should occur
    expect(iconButton).toBeInTheDocument();
  });

  it('renders all required UI elements in correct order', () => {
    renderWithClient(<ConnectionIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    // Check that all main elements are present
    expect(screen.getByTestId('base-page')).toBeInTheDocument();
    expect(screen.getByTestId('page-title')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('info-icon-button')).toBeInTheDocument();
    expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    expect(screen.getByTestId('create-identity-provider')).toBeInTheDocument();
  });

  it('uses correct PATHS constants', () => {
    renderWithClient(<ConnectionIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbsText = screen.getByTestId('breadcrumbs').textContent;
    const breadcrumbs = JSON.parse(breadcrumbsText || '[]');

    // Verify that the correct path constants are used
    expect(breadcrumbs[0].link).toBe('/settings');
    expect(breadcrumbs[1].link).toBe('/settings/identity-provider');
  });

  it('component is a functional component', () => {
    // This test ensures the component can be rendered as a React functional component
    expect(() => {
      renderWithClient(<ConnectionIdentityProvider />, {initialEntries: [PATHS.settings.base]});
    }).not.toThrow();
  });

  it('icon button sx function returns correct theme-based styles', () => {
    renderWithClient(<ConnectionIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    const iconButton = screen.getByTestId('info-icon-button');

    // Verify that the sx function was called and returned the expected styles
    const sxResultAttr = iconButton.getAttribute('data-sx-result');
    expect(sxResultAttr).toBeTruthy();

    const sxResult = JSON.parse(sxResultAttr || '{}');

    expect(sxResult).toEqual({
      color: '#333333', // from mock theme.palette.vars.baseTextDefault
      width: '24px',
      height: '24px'
    });
  });

  it('icon button receives theme-based sx styling function', () => {
    renderWithClient(<ConnectionIdentityProvider />, {initialEntries: [PATHS.settings.base]});

    const iconButton = screen.getByTestId('info-icon-button');

    // Verify that the sx prop is a function (theme-based styling)
    expect(iconButton).toHaveAttribute('data-has-sx', 'true');
    expect(iconButton).toHaveAttribute('data-sx', 'function');
  });
});
