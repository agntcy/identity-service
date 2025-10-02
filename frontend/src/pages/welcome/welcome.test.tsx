/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {render, screen, fireEvent} from '@testing-library/react';
import {describe, it, vi, beforeEach, expect} from 'vitest';
import '@testing-library/jest-dom';
import Welcome from './welcome';

// Mock external dependencies
vi.mock('@/hooks', () => ({
  useAuth: vi.fn(),
  useAnalytics: vi.fn()
}));

vi.mock('@/utils/docs', () => ({
  docs: vi.fn(() => 'https://docs.example.com')
}));

vi.mock('@/assets/welcome/landing.svg?react', () => ({
  default: () => <div data-testid="landing-logo">Landing Logo</div>
}));

vi.mock('vanilla-cookieconsent', () => ({
  showPreferences: vi.fn()
}));

vi.mock('@/styles/welcome.css', () => ({}));

vi.mock('@/config/global', () => ({
  globalConfig: {
    company: {
      name: '<place-holder-company-name>',
      url: '<place-holder-company-url>'
    },
    links: {
      email: 'support@agntcy.com',
      termsAndConditions: 'https://example.com/terms',
      privacyPolicy: 'https://example.com/privacy'
    }
  }
}));

vi.mock('@open-ui-kit/core', () => ({
  Button: ({children, onClick, ...props}: any) => (
    <button onClick={onClick} data-testid={props['data-testid'] || 'button'} {...props}>
      {children}
    </button>
  ),
  Link: ({children, href, onClick, openInNewTab, ...props}: any) => (
    <a
      href={href}
      onClick={onClick}
      target={openInNewTab ? '_blank' : undefined}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
      data-testid={props['data-testid'] || 'link'}
      {...props}
    >
      {children}
    </a>
  ),
  Typography: ({children, variant, color, paddingBottom, textAlign, sx, ...props}: any) => (
    <div
      data-testid={props['data-testid'] || 'typography'}
      data-variant={variant}
      style={{
        color,
        paddingBottom,
        textAlign,
        ...sx
      }}
      {...props}
    >
      {children}
    </div>
  )
}));

const mockUseAuth = vi.mocked(await import('@/hooks')).useAuth;
const mockUseAnalytics = vi.mocked(await import('@/hooks')).useAnalytics;
const mockCookieConsent = vi.mocked(await import('vanilla-cookieconsent'));

describe('Welcome', () => {
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockAnalyticsTrack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      login: mockLogin,
      register: mockRegister,
      authConfig: {
        oktaIssuer: '',
        oktaClient: '',
        iamUI: '',
        iamApi: '',
        productId: ''
      },
      oktaInstance: {} as unknown as any,
      loading: false,
      logout: vi.fn(),
      tokenExpiredHttpHandler: vi.fn()
    });

    mockUseAnalytics.mockReturnValue({
      analyticsTrack: mockAnalyticsTrack,
      analyticsPage: vi.fn(),
      analyticsIdentify: vi.fn(),
      analyticsReset: vi.fn()
    });
  });

  it('renders without crashing', () => {
    render(<Welcome />);
  });

  it('renders main heading text', () => {
    render(<Welcome />);
    expect(screen.getByText('Get started with')).toBeInTheDocument();
  });

  it('renders landing logo', () => {
    render(<Welcome />);
    expect(screen.getByTestId('landing-logo')).toBeInTheDocument();
  });

  it('renders main content text', () => {
    render(<Welcome />);
    expect(screen.getByText('Create Badges & Policies')).toBeInTheDocument();
    expect(screen.getByText(/Register your AI agents and MCP servers/)).toBeInTheDocument();
    expect(screen.getByText('Learn more in our documentation.')).toBeInTheDocument();
  });

  it('renders login and sign up buttons', () => {
    render(<Welcome />);
    expect(screen.getByText('Log In')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  it('calls analytics tracking and login function when login button is clicked', () => {
    render(<Welcome />);
    const loginButton = screen.getByText('Log In').closest('button');

    fireEvent.click(loginButton!);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_LOGIN');
    expect(mockLogin).toHaveBeenCalled();
  });

  it('calls analytics tracking and register function when sign up button is clicked', () => {
    render(<Welcome />);
    const signUpButton = screen.getByText('Sign Up').closest('button');

    fireEvent.click(signUpButton!);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_SIGN_UP');
    expect(mockRegister).toHaveBeenCalled();
  });

  it('renders footer links with correct hrefs', () => {
    render(<Welcome />);

    const termsLink = screen.getByText('Terms & Conditions').closest('a');
    const privacyLink = screen.getByText('Privacy Policy').closest('a');

    expect(termsLink).toHaveAttribute('href', 'https://example.com/terms');
    expect(termsLink).toHaveAttribute('target', '_blank');
    expect(privacyLink).toHaveAttribute('href', 'https://example.com/privacy');
    expect(privacyLink).toHaveAttribute('target', '_blank');
  });

  it('renders documentation link with correct href', () => {
    render(<Welcome />);

    const docsLink = screen.getByText('Learn more in our documentation.').closest('a');
    expect(docsLink).toHaveAttribute('href', 'https://docs.example.com');
    expect(docsLink).toHaveAttribute('target', '_blank');
  });

  it('calls CookieConsentVanilla.showPreferences when cookie preferences is clicked', () => {
    render(<Welcome />);

    const cookiePrefsLink = screen.getByText('Cookie Preferences');
    fireEvent.click(cookiePrefsLink);

    expect(mockCookieConsent.showPreferences).toHaveBeenCalled();
  });

  it('handles missing login function gracefully', () => {
    mockUseAuth.mockReturnValue({
      login: () => {},
      register: mockRegister,
      authConfig: {
        oktaIssuer: '',
        oktaClient: '',
        iamUI: '',
        iamApi: '',
        productId: ''
      },
      oktaInstance: {} as unknown as any,
      loading: false,
      logout: vi.fn(),
      tokenExpiredHttpHandler: vi.fn()
    });

    render(<Welcome />);
    const loginButton = screen.getByText('Log In').closest('button');

    expect(() => fireEvent.click(loginButton!)).not.toThrow();
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_LOGIN');
  });

  it('handles missing register function gracefully', () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      register: () => {},
      authConfig: {
        oktaIssuer: '',
        oktaClient: '',
        iamUI: '',
        iamApi: '',
        productId: ''
      },
      oktaInstance: {} as unknown as any,
      loading: false,
      logout: vi.fn(),
      tokenExpiredHttpHandler: vi.fn()
    });

    render(<Welcome />);
    const signUpButton = screen.getByText('Sign Up').closest('button');

    expect(() => fireEvent.click(signUpButton!)).not.toThrow();
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_SIGN_UP');
  });
});
