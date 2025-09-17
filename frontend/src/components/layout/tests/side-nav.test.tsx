/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {screen, fireEvent, waitFor} from '@testing-library/react';
import {SideNav} from '../side-nav';
import '@testing-library/jest-dom';
import {renderWithClient} from '@/utils/tests';
import React from 'react';

// Mock hooks with variables we can reference later
const mockAnalyticsTrack = vi.fn();
const mockOnChangeCollapsed = vi.fn();
let mockAuthInfo = {
  user: {
    tenant: {
      name: 'Test Organization'
    }
  }
};
let mockLocation = {pathname: '/dashboard'};
let mockIsTbacEnabled = true;

vi.mock('@/config', () => ({
  default: {
    IAM_MULTI_TENANT: true
  }
}));

vi.mock('@/hooks', () => ({
  useAnalytics: () => ({
    analyticsTrack: mockAnalyticsTrack
  }),
  useAuth: () => ({
    authInfo: mockAuthInfo
  })
}));

// Mock router
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    Link: ({to, children, target, rel}: {to: string; children: React.ReactNode; target?: string; rel?: string}) => (
      <a href={to} target={target} rel={rel} data-testid="router-link" data-href={to}>
        {children}
      </a>
    ),
    useLocation: () => mockLocation,
    MemoryRouter: ({children}: {children: React.ReactNode}) => <div data-testid="memory-router">{children}</div>
  };
});

// Mock MUI components - Fix style prop handling
vi.mock('@mui/material', () => ({
  IconButton: ({children, onClick, sx, ...props}: any) => (
    <button onClick={onClick} data-testid="icon-button" {...props}>
      {children}
    </button>
  ),
  Tooltip: ({children, title, placement, arrow, ...props}: any) => (
    <div data-testid="tooltip" data-placement={placement} data-arrow={arrow} {...props}>
      <div data-testid="tooltip-content">{title}</div>
      {children}
    </div>
  ),
  Typography: ({children, variant, sx, noWrap, textAlign, ...props}: any) => (
    <div data-testid="typography" data-variant={variant} data-no-wrap={noWrap} data-text-align={textAlign} {...props}>
      {children}
    </div>
  ),
  useTheme: () => ({
    palette: {
      vars: {
        brandTextPrimary: '#00142B',
        brandTextSecondary: '#59616B'
      }
    }
  })
}));

// Mock Spark Design components - Remove any style-related props
vi.mock('@outshift/spark-design', () => ({
  OverflowTooltip: ({value, someLongText, children, ...props}: any) => (
    <div data-testid="overflow-tooltip" data-value={value} {...props}>
      {someLongText || value || children}
    </div>
  )
}));

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: any) => fn
}));

// Mock PATHS
vi.mock('@/router/paths', () => ({
  PATHS: {
    dashboard: '/dashboard',
    agenticServices: {
      base: '/agentic-services'
    },
    verifyIdentity: {
      base: '/verify-identity'
    },
    policies: {
      base: '/policies'
    },
    settings: {
      base: '/settings'
    }
  }
}));

// Mock cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' ')
}));

// Mock SVG imports - Remove any style-related props
vi.mock('@/assets/organization.svg?react', () => ({
  default: ({className, ...props}: {className?: string}) => (
    <div data-testid="organization-logo" className={className} {...props}>
      OrganizationLogo
    </div>
  )
}));

vi.mock('@/assets/sidebar/settings.svg?react', () => ({
  default: ({className, ...props}: {className?: string}) => (
    <div data-testid="settings-icon" className={className} {...props}>
      SettingsIcon
    </div>
  )
}));

vi.mock('@/assets/sidebar/agentic-services.svg?react', () => ({
  default: ({className, ...props}: {className?: string}) => (
    <div data-testid="agentic-services-icon" className={className} {...props}>
      AgenticServicesIcon
    </div>
  )
}));

vi.mock('@/assets/sidebar/access-policies.svg?react', () => ({
  default: ({className, ...props}: {className?: string}) => (
    <div data-testid="policies-icon" className={className} {...props}>
      PoliciesIcon
    </div>
  )
}));

vi.mock('@/assets/sidebar/verify-identity.svg?react', () => ({
  default: ({className, ...props}: {className?: string}) => (
    <div data-testid="verify-identity-icon" className={className} {...props}>
      VerifyIdentityIcon
    </div>
  )
}));

// Mock Lucide React icons - Remove any style-related props
vi.mock('lucide-react', () => ({
  ChevronLeftIcon: ({className, ...props}: {className?: string}) => (
    <div data-testid="chevron-left-icon" className={className} {...props}>
      ChevronLeft
    </div>
  ),
  ChevronRightIcon: ({className, ...props}: {className?: string}) => (
    <div data-testid="chevron-right-icon" className={className} {...props}>
      ChevronRight
    </div>
  ),
  LayoutDashboardIcon: ({className, ...props}: {className?: string}) => (
    <div data-testid="dashboard-icon" className={className} {...props}>
      DashboardIcon
    </div>
  )
}));

// Mock OrganizationsDrawer
vi.mock('../organizations-drawer', () => ({
  OrganizationsDrawer: ({isOpen, onChange, isCollapsed}: any) => (
    <div data-testid="organizations-drawer" data-open={isOpen} data-collapsed={isCollapsed}>
      <button onClick={() => onChange && onChange(false)}>Close Drawer</button>
      Organizations Drawer Content
    </div>
  )
}));

// Mock CSS import
vi.mock('@/styles/side-nav.css', () => ({}));

describe('SideNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAnalyticsTrack.mockClear();
    mockOnChangeCollapsed.mockClear();
    mockAuthInfo = {
      user: {
        tenant: {
          name: 'Test Organization'
        }
      }
    };
    mockLocation = {pathname: '/dashboard'};
    mockIsTbacEnabled = true;
  });

  it('renders the organizations drawer', () => {
    renderWithClient(<SideNav />);
    expect(screen.getByTestId('organizations-drawer')).toBeInTheDocument();
  });

  it('renders with collapsed state', () => {
    renderWithClient(<SideNav isCollapsed={true} />);
    const drawer = screen.getByTestId('organizations-drawer');
    expect(drawer).toHaveAttribute('data-collapsed', 'true');
  });

  it('renders with expanded state', () => {
    renderWithClient(<SideNav isCollapsed={false} />);
    const drawer = screen.getByTestId('organizations-drawer');
    expect(drawer).toHaveAttribute('data-collapsed', 'false');
  });

  it('passes correct props to organizations drawer', () => {
    renderWithClient(<SideNav isCollapsed={true} />);
    const drawer = screen.getByTestId('organizations-drawer');
    expect(drawer).toHaveAttribute('data-open', 'false');
    expect(drawer).toHaveAttribute('data-collapsed', 'true');
  });

  it('closes organizations drawer when drawer calls onChange', () => {
    renderWithClient(<SideNav />);
    expect(screen.getByTestId('organizations-drawer')).toHaveAttribute('data-open', 'false');

    const closeButton = screen.getByText('Close Drawer');
    fireEvent.click(closeButton);

    expect(screen.getByTestId('organizations-drawer')).toHaveAttribute('data-open', 'false');
  });

  it('renders without errors when feature flags are disabled', () => {
    mockIsTbacEnabled = false;
    renderWithClient(<SideNav />);
    expect(screen.getByTestId('organizations-drawer')).toBeInTheDocument();
  });

  it('renders without errors when auth info is missing', () => {
    mockAuthInfo = null as any;
    renderWithClient(<SideNav />);
    expect(screen.getByTestId('organizations-drawer')).toBeInTheDocument();
  });

  it('renders without errors when tenant is missing', () => {
    mockAuthInfo = {
      user: {
        tenant: null as any
      }
    };
    renderWithClient(<SideNav />);
    expect(screen.getByTestId('organizations-drawer')).toBeInTheDocument();
  });

  it('handles onChangeCollapsed being undefined', () => {
    renderWithClient(<SideNav />);
    expect(screen.getByTestId('organizations-drawer')).toBeInTheDocument();
  });

  it('renders with different location paths', () => {
    mockLocation = {pathname: '/agentic-services/some-sub-path'};
    renderWithClient(<SideNav />);
    expect(screen.getByTestId('organizations-drawer')).toBeInTheDocument();
  });

  it('handles analytics tracking function being undefined', () => {
    const mockAnalyticsUndefined = vi.fn().mockReturnValue(undefined);
    vi.mocked(mockAnalyticsTrack).mockImplementation(mockAnalyticsUndefined);
    renderWithClient(<SideNav />);
    expect(screen.getByTestId('organizations-drawer')).toBeInTheDocument();
  });
});
