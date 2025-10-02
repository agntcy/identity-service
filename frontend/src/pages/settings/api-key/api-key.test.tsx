/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, vi, beforeEach, expect} from 'vitest';
import {screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import ApiKey from './api-key';
import {renderWithClient} from '@/utils/tests';
import {PATHS} from '@/router/paths';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: vi.fn()
  };
});

// Mock paths
vi.mock('@/router/paths', () => ({
  PATHS: {
    settings: {
      base: '/settings'
    }
  }
}));

// Mock components
vi.mock('@/components/layout/base-page', () => ({
  BasePage: ({children, title, subNav, breadcrumbs}: any) => (
    <div data-testid="base-page">
      <h1 data-testid="page-title">{title}</h1>
      <div data-testid="sub-nav">{subNav ? JSON.stringify(subNav) : 'undefined'}</div>
      <div data-testid="breadcrumbs">{JSON.stringify(breadcrumbs)}</div>
      {children}
    </div>
  )
}));

vi.mock('@/components/api-key/content-api-key', () => ({
  ContentApiKey: () => <div data-testid="content-api-key">Content API Key Component</div>
}));

const mockUseOutletContext = vi.mocked(await import('react-router-dom')).useOutletContext;

describe('ApiKey', () => {
  const mockSubNav = [
    {label: 'API Key', href: '/settings/api-key'},
    {label: 'Users', href: '/settings/users'}
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseOutletContext.mockReturnValue({
      subNav: mockSubNav
    });
  });

  it('renders without crashing', () => {
    renderWithClient(<ApiKey />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('base-page')).toBeInTheDocument();
    expect(screen.getByTestId('page-title')).toHaveTextContent('API Key');
  });

  it('renders with correct props passed to BasePage', () => {
    renderWithClient(<ApiKey />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('page-title')).toHaveTextContent('API Key');

    const subNav = screen.getByTestId('sub-nav');
    expect(subNav).toHaveTextContent(JSON.stringify(mockSubNav));

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs).toHaveTextContent('"text":"Settings"');
    expect(breadcrumbs).toHaveTextContent('"link":"/settings"');
    expect(breadcrumbs).toHaveTextContent('"text":"API Key"');
  });

  it('renders correct breadcrumbs structure', () => {
    renderWithClient(<ApiKey />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbsText = screen.getByTestId('breadcrumbs').textContent;
    const breadcrumbs = JSON.parse(breadcrumbsText || '[]');

    expect(breadcrumbs).toHaveLength(2);
    expect(breadcrumbs[0]).toEqual({
      text: 'Settings',
      link: '/settings'
    });
    expect(breadcrumbs[1]).toEqual({
      text: 'API Key'
    });
  });

  it('maintains consistent breadcrumb hierarchy', () => {
    renderWithClient(<ApiKey />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbsText = screen.getByTestId('breadcrumbs').textContent;
    const breadcrumbs = JSON.parse(breadcrumbsText || '[]');

    // First breadcrumb should have link
    expect(breadcrumbs[0]).toHaveProperty('link');

    // Last breadcrumb should not have link (current page)
    expect(breadcrumbs[1]).not.toHaveProperty('link');
  });

  it('uses correct PATHS constants', () => {
    renderWithClient(<ApiKey />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbsText = screen.getByTestId('breadcrumbs').textContent;
    const breadcrumbs = JSON.parse(breadcrumbsText || '[]');

    expect(breadcrumbs[0].link).toBe('/settings');
  });

  it('renders ContentApiKey component', () => {
    renderWithClient(<ApiKey />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('content-api-key')).toBeInTheDocument();
    expect(screen.getByTestId('content-api-key')).toHaveTextContent('Content API Key Component');
  });

  it('passes subNav from outlet context to BasePage', () => {
    const customSubNav = [
      {label: 'Custom API Key', href: '/custom-api-key'},
      {label: 'Custom Users', href: '/custom-users'}
    ];

    mockUseOutletContext.mockReturnValue({
      subNav: customSubNav
    });

    renderWithClient(<ApiKey />, {initialEntries: [PATHS.settings.base]});

    const subNav = screen.getByTestId('sub-nav');
    expect(subNav).toHaveTextContent(JSON.stringify(customSubNav));
  });

  it('renders all required UI elements', () => {
    renderWithClient(<ApiKey />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('base-page')).toBeInTheDocument();
    expect(screen.getByTestId('page-title')).toBeInTheDocument();
    expect(screen.getByTestId('sub-nav')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    expect(screen.getByTestId('content-api-key')).toBeInTheDocument();
  });

  it('handles empty subNav from outlet context', () => {
    mockUseOutletContext.mockReturnValue({
      subNav: []
    });

    renderWithClient(<ApiKey />, {initialEntries: [PATHS.settings.base]});

    const subNav = screen.getByTestId('sub-nav');
    expect(subNav).toHaveTextContent('[]');
  });

  it('handles undefined subNav from outlet context', () => {
    mockUseOutletContext.mockReturnValue({
      subNav: undefined
    });

    renderWithClient(<ApiKey />, {initialEntries: [PATHS.settings.base]});

    const subNav = screen.getByTestId('sub-nav');
    expect(subNav).toHaveTextContent('undefined');
  });
});
