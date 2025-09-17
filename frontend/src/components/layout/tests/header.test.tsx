/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {screen, fireEvent, waitFor} from '@testing-library/react';
import {Header} from '../header';
import '@testing-library/jest-dom';
import {renderWithClient} from '@/utils/tests';
import React from 'react';

// Mock hooks with variables we can reference later
const mockAnalyticsTrack = vi.fn();
const mockLogout = vi.fn().mockResolvedValue(undefined);
let isMobileValue = false;

vi.mock('@/hooks', () => ({
  useAnalytics: () => ({
    analyticsTrack: mockAnalyticsTrack
  }),
  useAuth: () => ({
    authInfo: {
      user: {
        name: 'Test User'
      }
    },
    logout: mockLogout
  }),
  useWindowSize: () => ({
    isMobile: isMobileValue
  })
}));

// Mock router with MemoryRouter
vi.mock('react-router-dom', () => ({
  Link: ({to, children}: {to: string; children: React.ReactNode}) => (
    <a href={to} data-testid="router-link">
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  MemoryRouter: ({children}: {children: React.ReactNode}) => <div data-testid="memory-router">{children}</div>
}));

// Mock Spark Design components
vi.mock('@outshift/spark-design', () => ({
  Avatar: ({children, sx}: any) => <div data-testid="avatar">{children}</div>,
  Button: ({children, onClick, startIcon, endIcon, ...props}: any) => (
    <button onClick={onClick} data-testid="user-button" {...props}>
      {startIcon && <div data-testid="button-start-icon">{startIcon}</div>}
      {children}
      {endIcon && <div data-testid="button-end-icon">{endIcon}</div>}
    </button>
  ),
  Divider: () => <hr data-testid="divider" />,
  Header: ({logo, customSearchNode, actions, userSection}: any) => (
    <header data-testid="spark-header">
      <div data-testid="header-logo">{logo}</div>
      {customSearchNode && <div data-testid="header-search">{customSearchNode}</div>}
      {actions && (
        <div data-testid="header-actions">
          {actions.map((action: any, index: number) => (
            <a
              key={index}
              href={action.href}
              onClick={action.onClick}
              data-testid={`header-action-${action.id}`}
              target={action.target}
            >
              {action.icon}
            </a>
          ))}
        </div>
      )}
      <div data-testid="header-user-section">{userSection}</div>
    </header>
  ),
  Menu: ({children, open, anchorEl, onClose}: any) => (open ? <div data-testid="user-menu">{children}</div> : null),
  MenuItem: ({children, onClick}: any) => (
    <div data-testid="menu-item" onClick={onClick}>
      {children}
    </div>
  ),
  Typography: ({children, variant, sx, ...props}: any) => (
    <div data-testid="typography" data-variant={variant} {...props}>
      {children}
    </div>
  ),
  Modal: ({children, open, onClose, ...props}: any) =>
    open ? (
      <div data-testid="modal" {...props}>
        {children}
      </div>
    ) : null,
  ModalTitle: ({children}: any) => <div data-testid="modal-title">{children}</div>,
  ModalContent: ({children}: any) => <div data-testid="modal-content">{children}</div>,
  ModalActions: ({children}: any) => <div data-testid="modal-actions">{children}</div>,
  Tag: ({children, size, status, ...props}: any) => (
    <div data-testid="tag" data-size={size} data-status={status} {...props}>
      {children}
    </div>
  ),
  // Mock the constants directly in the main mock
  GeneralSize: {
    Small: 'small'
  },
  TagStatus: {
    Negative: 'negative',
    Positive: 'positive',
    Info: 'info'
  }
}));

// Mock MUI components - ADD ALL MISSING EXPORTS
vi.mock('@mui/material', () => ({
  Typography: ({children, variant, component, sx, ...props}: any) => (
    <div data-testid="typography" data-variant={variant} data-component={component} {...props}>
      {children}
    </div>
  ),
  Box: ({children, sx, ...props}: any) => (
    <div data-testid="box" {...props}>
      {children}
    </div>
  ),
  Button: ({children, onClick, startIcon, endIcon, ...props}: any) => (
    <button onClick={onClick} data-testid="mui-button" {...props}>
      {startIcon && <span data-testid="mui-button-start-icon">{startIcon}</span>}
      {children}
      {endIcon && <span data-testid="mui-button-end-icon">{endIcon}</span>}
    </button>
  ),
  useTheme: () => ({
    palette: {
      vars: {
        baseTextWeak: '#666'
      }
    },
    typography: {
      subtitle2: {
        fontSize: '14px'
      }
    }
  })
}));

// Mock MUI styles - MOVE useTheme HERE
vi.mock('@mui/material/styles', () => ({
  useTheme: () => ({
    palette: {
      vars: {
        baseTextWeak: '#666'
      }
    },
    typography: {
      subtitle2: {
        fontSize: '14px'
      }
    }
  })
}));

// Mock all lucide-react icons
vi.mock('lucide-react', () => ({
  BellIcon: () => <div data-testid="bell-icon">BellIcon</div>,
  BellOffIcon: () => <div data-testid="bell-off-icon">BellOffIcon</div>,
  ChevronDownIcon: () => <div data-testid="chevron-down-icon">ChevronDownIcon</div>,
  ChevronUpIcon: () => <div data-testid="chevron-up-icon">ChevronUpIcon</div>,
  LogOutIcon: () => <div data-testid="logout-icon">LogOutIcon</div>,
  UserIcon: () => <div data-testid="user-icon">UserIcon</div>
}));

// Mock SVG imports
vi.mock('@/assets/union.svg?react', () => ({
  default: () => <div data-testid="book-logo">BookLogo</div>
}));

vi.mock('@/assets/git.svg?react', () => ({
  default: () => <div data-testid="git-logo">GitLogo</div>
}));

vi.mock('@/assets/user.svg?react', () => ({
  default: () => <div data-testid="user-icon">UserIcon</div>
}));

vi.mock('@/assets/header/header.svg?react', () => ({
  default: () => <div data-testid="header-logo-svg">HeaderLogo</div>
}));

// Mock stores
vi.mock('@/store', () => ({
  useSettingsStore: vi.fn().mockImplementation((selector) =>
    selector({
      session: {
        groups: [{role: 'ADMIN'}]
      }
    })
  ),
  useLocalStore: vi.fn().mockImplementation((selector) =>
    selector({
      idDevice: 'test-device-id'
    })
  ),
  useShallow: (fn: any) => fn
}));

// Mock queries
vi.mock('@/queries', () => ({
  useGetDevices: () => ({
    data: {
      devices: [{id: '1', name: 'Device 1'}]
    }
  }),
  useGetAgenticServices: () => ({
    data: null,
    error: null,
    isLoading: false,
    refetch: vi.fn()
  }),
  useGetPolicies: () => ({
    data: null,
    error: null,
    isLoading: false,
    refetch: vi.fn()
  })
}));

// Mock the notification provider
vi.mock('@/providers/notification-utils-provider/notification-utils-provider', () => ({
  useNotificationUtils: () => ({
    enabled: true,
    supported: true,
    handleToggleNotifications: vi.fn(),
    fixNotifications: vi.fn(),
    loading: false,
    showNotification: vi.fn(),
    clearNotifications: vi.fn()
  })
}));

// Mock PATHS
vi.mock('@/router/paths', () => ({
  PATHS: {
    dashboard: '/dashboard',
    callBackLoading: '/callback-loading'
  }
}));

// Mock docs utility
vi.mock('@/utils/docs', () => ({
  docs: () => 'https://docs.example.com'
}));

// Mock Logo component properly
vi.mock('../ui/logo', () => ({
  __esModule: true,
  Logo: ({className}: {className?: string}) => (
    <div data-testid="logo" className={className}>
      Logo
    </div>
  )
}));

// COMPLETELY BLOCK THESE COMPONENTS FROM RENDERING
vi.mock('../shared/helpers/global-search', () => ({
  __esModule: true,
  default: () => <div data-testid="global-search">GlobalSearch</div>,
  GlobalSearch: () => <div data-testid="global-search">GlobalSearch</div>
}));

vi.mock('../../shared/helpers/global-search', () => ({
  __esModule: true,
  default: () => <div data-testid="global-search">GlobalSearch</div>,
  GlobalSearch: () => <div data-testid="global-search">GlobalSearch</div>
}));

vi.mock('../ui/search-field-with-auto-complete', () => ({
  __esModule: true,
  default: () => <div data-testid="search-field">SearchField</div>,
  SearchFieldWithAutocomplete: () => <div data-testid="search-field">SearchField</div>
}));

vi.mock('../../ui/search-field-with-auto-complete', () => ({
  __esModule: true,
  default: () => <div data-testid="search-field">SearchField</div>,
  SearchFieldWithAutocomplete: () => <div data-testid="search-field">SearchField</div>
}));

vi.mock('../shared/notifications/notification-settings', () => ({
  __esModule: true,
  default: ({open, onClose}: any) =>
    open ? (
      <div data-testid="notification-settings">
        NotificationSettings <button onClick={onClose}>Close</button>
      </div>
    ) : null,
  NotificationSettings: ({open, onClose}: any) =>
    open ? (
      <div data-testid="notification-settings">
        NotificationSettings <button onClick={onClose}>Close</button>
      </div>
    ) : null
}));

vi.mock('../../shared/notifications/notification-settings', () => ({
  __esModule: true,
  default: ({open, onClose}: any) =>
    open ? (
      <div data-testid="notification-settings">
        NotificationSettings <button onClick={onClose}>Close</button>
      </div>
    ) : null,
  NotificationSettings: ({open, onClose}: any) =>
    open ? (
      <div data-testid="notification-settings">
        NotificationSettings <button onClick={onClose}>Close</button>
      </div>
    ) : null
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mobile value to desktop mode by default
    isMobileValue = false;
    // Reset the mock functions
    mockAnalyticsTrack.mockClear();
    mockLogout.mockClear();
  });

  it('renders the header with logo', () => {
    renderWithClient(<Header />);

    expect(screen.getByTestId('spark-header')).toBeInTheDocument();
    expect(screen.getByTestId('header-logo')).toBeInTheDocument();
    // The header uses the SVG directly, not the Logo component
    expect(screen.getByTestId('header-logo-svg')).toBeInTheDocument();
  });

  it('renders the global search in desktop mode', () => {
    renderWithClient(<Header />);

    expect(screen.getByTestId('header-search')).toBeInTheDocument();
    expect(screen.getByTestId('global-search')).toBeInTheDocument();
  });

  it('renders action buttons in desktop mode', () => {
    renderWithClient(<Header />);

    expect(screen.getByTestId('header-actions')).toBeInTheDocument();
    expect(screen.getByTestId('header-action-docs')).toBeInTheDocument();
    expect(screen.getByTestId('header-action-github')).toBeInTheDocument();
  });

  it('renders user section with avatar and name', () => {
    renderWithClient(<Header />);

    expect(screen.getByTestId('header-user-section')).toBeInTheDocument();
    expect(screen.getByTestId('user-button')).toBeInTheDocument();
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });

  it('opens user menu when clicking user button', () => {
    renderWithClient(<Header />);

    const userButton = screen.getByTestId('user-button');
    expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();

    fireEvent.click(userButton);

    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('shows logout option in user menu', () => {
    renderWithClient(<Header />);

    const userButton = screen.getByTestId('user-button');
    fireEvent.click(userButton);

    const menuItems = screen.getAllByTestId('menu-item');
    expect(menuItems.length).toBeGreaterThan(0);
    expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
  });

  it('shows notifications option in user menu when features enabled', () => {
    // Set mobile view for this test
    isMobileValue = true;

    renderWithClient(<Header />);

    const userButton = screen.getByTestId('user-button');
    fireEvent.click(userButton);

    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
  });

  it('opens notification settings when clicking notifications option', () => {
    // Set mobile view for this test
    isMobileValue = true;

    renderWithClient(<Header />);

    // Open user menu
    const userButton = screen.getByTestId('user-button');
    fireEvent.click(userButton);

    // Find notifications menu item and click it
    const notificationsMenuItem = screen.getByTestId('bell-icon').closest('[data-testid="menu-item"]');
    fireEvent.click(notificationsMenuItem!);

    expect(screen.getByTestId('notification-settings')).toBeInTheDocument();
  });

  it('closes notification settings when clicking close button', async () => {
    // Set mobile view for this test
    isMobileValue = true;

    renderWithClient(<Header />);

    // Open user menu
    const userButton = screen.getByTestId('user-button');
    fireEvent.click(userButton);

    // Find notifications menu item and click it
    const notificationsMenuItem = screen.getByTestId('bell-icon').closest('[data-testid="menu-item"]');
    fireEvent.click(notificationsMenuItem!);

    expect(screen.getByTestId('notification-settings')).toBeInTheDocument();

    // Close notifications
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('notification-settings')).not.toBeInTheDocument();
    });
  });

  it('renders chevron down icon when menu is closed', () => {
    renderWithClient(<Header />);

    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('chevron-up-icon')).not.toBeInTheDocument();
  });

  it('renders chevron up icon when menu is open', () => {
    renderWithClient(<Header />);

    const userButton = screen.getByTestId('user-button');
    fireEvent.click(userButton);

    expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument();
    expect(screen.getByTestId('chevron-up-icon')).toBeInTheDocument();
  });

  it('does not render action buttons in mobile mode', () => {
    // Set mobile view for this test
    isMobileValue = true;

    renderWithClient(<Header />);

    expect(screen.queryByTestId('header-actions')).not.toBeInTheDocument();
    expect(screen.queryByTestId('header-action-docs')).not.toBeInTheDocument();
    expect(screen.queryByTestId('header-action-github')).not.toBeInTheDocument();
  });

  it('does not render global search in mobile mode', () => {
    // Set mobile view for this test
    isMobileValue = true;

    renderWithClient(<Header />);

    expect(screen.queryByTestId('header-search')).not.toBeInTheDocument();
    expect(screen.queryByTestId('global-search')).not.toBeInTheDocument();
  });

  it('does not show user name in button on mobile', () => {
    // Set mobile view for this test
    isMobileValue = true;

    renderWithClient(<Header />);

    // Should only have the avatar in mobile mode, not the text
    expect(screen.getByTestId('button-start-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('button-end-icon')).not.toBeInTheDocument();
  });

  it('calls logout function when clicking logout', () => {
    renderWithClient(<Header />);

    const userButton = screen.getByTestId('user-button');
    fireEvent.click(userButton);

    const logoutMenuItem = screen.getByTestId('logout-icon').closest('[data-testid="menu-item"]');
    fireEvent.click(logoutMenuItem!);

    expect(mockLogout).toHaveBeenCalledWith({
      revokeAccessToken: true,
      revokeRefreshToken: true,
      clearTokensBeforeRedirect: true
    });
  });

  it('navigates to docs when clicking docs action', () => {
    renderWithClient(<Header />);

    const docsAction = screen.getByTestId('header-action-docs');
    fireEvent.click(docsAction);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_DOCS');
  });

  it('navigates to GitHub when clicking GitHub action', () => {
    renderWithClient(<Header />);

    const githubAction = screen.getByTestId('header-action-github');
    fireEvent.click(githubAction);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_GITHUB');
  });
});
