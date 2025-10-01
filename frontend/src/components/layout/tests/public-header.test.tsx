/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {screen, fireEvent} from '@testing-library/react';
import {PublicHeader} from '../public-header';
import '@testing-library/jest-dom';
import {renderWithClient} from '@/utils/tests';
import React from 'react';

// Mock hooks with variables we can reference later
const mockLogin = vi.fn();
const mockRegister = vi.fn();

vi.mock('@/hooks', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister
  })
}));

// Mock router with MemoryRouter
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    Link: ({to, children, target, rel}: {to: string; children: React.ReactNode; target?: string; rel?: string}) => (
      <a href={to} target={target} rel={rel} data-testid="router-link">
        {children}
      </a>
    ),
    MemoryRouter: ({children}: {children: React.ReactNode}) => <div data-testid="memory-router">{children}</div>
  };
});

// Mock Spark Design components
vi.mock('@open-ui-kit/core', () => ({
  Button: ({children, onClick, variant, sx, ...props}: any) => (
    <button onClick={onClick} data-testid="spark-button" data-variant={variant} style={sx} {...props}>
      {children}
    </button>
  ),
  Header: ({logo, position, userSection, useDivider}: any) => (
    <header data-testid="spark-header" data-position={position} data-use-divider={useDivider}>
      <div data-testid="header-logo">{logo}</div>
      <div data-testid="header-user-section">{userSection}</div>
    </header>
  ),
  Typography: ({children, variant, color, ...props}: any) => (
    <div data-testid="typography" data-variant={variant} color={color} {...props}>
      {children}
    </div>
  )
}));

// Mock SVG imports
vi.mock('@/assets/header/header.svg?react', () => ({
  default: ({className}: {className?: string}) => (
    <div data-testid="header-logo-svg" className={className}>
      HeaderLogo
    </div>
  )
}));

// Mock global config
vi.mock('@/config/global', () => ({
  globalConfig: {
    poweredBy: true,
    company: {
      name: 'Test Company',
      url: 'https://test.com'
    }
  }
}));

describe('PublicHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockClear();
    mockRegister.mockClear();
  });

  it('renders the header with logo', () => {
    renderWithClient(<PublicHeader />);

    expect(screen.getByTestId('spark-header')).toBeInTheDocument();
    expect(screen.getByTestId('header-logo')).toBeInTheDocument();
    expect(screen.getByTestId('header-logo-svg')).toBeInTheDocument();
  });

  it('renders header with correct props', () => {
    renderWithClient(<PublicHeader />);

    const header = screen.getByTestId('spark-header');
    expect(header).toHaveAttribute('data-position', 'fixed');
    expect(header).toHaveAttribute('data-use-divider', 'false');
  });

  it('renders logo with responsive classes', () => {
    renderWithClient(<PublicHeader />);

    const logoSvg = screen.getByTestId('header-logo-svg');
    // Check the actual classes used in the component
    expect(logoSvg).toHaveClass('w-[200px]', 'md:w-[300px]', 'lg:w-full');
  });

  it('renders default user section with login and register buttons when no userSection provided', () => {
    renderWithClient(<PublicHeader />);

    const userSection = screen.getByTestId('header-user-section');
    expect(userSection).toBeInTheDocument();

    const buttons = screen.getAllByTestId('spark-button');
    expect(buttons).toHaveLength(2);

    // Check login button
    const loginButton = buttons.find((button) => button.textContent === 'Log In');
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toHaveAttribute('data-variant', 'secondary');
    expect(loginButton).toHaveStyle({fontWeight: '600 !important'});

    // Check register button
    const registerButton = buttons.find((button) => button.textContent === 'Sign Up');
    expect(registerButton).toBeInTheDocument();
    expect(registerButton).toHaveStyle({fontWeight: '600 !important'});
  });

  it('renders custom userSection when provided', () => {
    const customUserSection = <div data-testid="custom-user-section">Custom User Section</div>;

    renderWithClient(<PublicHeader userSection={customUserSection} />);

    expect(screen.getByTestId('custom-user-section')).toBeInTheDocument();
    expect(screen.getByText('Custom User Section')).toBeInTheDocument();

    // Should not render default buttons
    expect(screen.queryByText('Log In')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
  });

  it('calls login function when clicking Log In button', () => {
    renderWithClient(<PublicHeader />);

    const loginButton = screen.getByText('Log In');
    fireEvent.click(loginButton);

    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  it('calls register function when clicking Sign Up button', () => {
    renderWithClient(<PublicHeader />);

    const registerButton = screen.getByText('Sign Up');
    fireEvent.click(registerButton);

    expect(mockRegister).toHaveBeenCalledTimes(1);
  });

  it('handles undefined login function gracefully', () => {
    // Mock login as undefined
    vi.mocked(mockLogin).mockImplementation(undefined as any);

    renderWithClient(<PublicHeader />);

    const loginButton = screen.getByText('Log In');
    expect(() => fireEvent.click(loginButton)).not.toThrow();
  });

  it('handles undefined register function gracefully', () => {
    // Mock register as undefined
    vi.mocked(mockRegister).mockImplementation(undefined as any);

    renderWithClient(<PublicHeader />);

    const registerButton = screen.getByText('Sign Up');
    expect(() => fireEvent.click(registerButton)).not.toThrow();
  });

  it('renders buttons container with correct classes', () => {
    renderWithClient(<PublicHeader />);

    const userSection = screen.getByTestId('header-user-section');
    const buttonContainer = userSection.querySelector('.flex.items-center.gap-4');
    expect(buttonContainer).toBeInTheDocument();
  });

  it('renders with empty userSection prop', () => {
    renderWithClient(<PublicHeader userSection={undefined} />);

    // Should render default buttons when userSection is undefined
    expect(screen.getByText('Log In')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  it('renders with null userSection prop', () => {
    renderWithClient(<PublicHeader userSection={null} />);

    // Should render default buttons when userSection is null
    expect(screen.getByText('Log In')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  it('renders with complex custom userSection', () => {
    const complexUserSection = (
      <div data-testid="complex-user-section">
        <button data-testid="custom-button-1">Custom Button 1</button>
        <button data-testid="custom-button-2">Custom Button 2</button>
        <span>Welcome, User!</span>
      </div>
    );

    renderWithClient(<PublicHeader userSection={complexUserSection} />);

    expect(screen.getByTestId('complex-user-section')).toBeInTheDocument();
    expect(screen.getByTestId('custom-button-1')).toBeInTheDocument();
    expect(screen.getByTestId('custom-button-2')).toBeInTheDocument();
    expect(screen.getByText('Welcome, User!')).toBeInTheDocument();

    // Should not render default buttons
    expect(screen.queryByText('Log In')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
  });

  it('maintains button styling consistency', () => {
    renderWithClient(<PublicHeader />);

    const buttons = screen.getAllByTestId('spark-button');

    // Both buttons should have font weight styling
    buttons.forEach((button) => {
      expect(button).toHaveStyle({fontWeight: '600 !important'});
    });

    // Login button should have secondary variant
    const loginButton = buttons.find((button) => button.textContent === 'Log In');
    expect(loginButton).toHaveAttribute('data-variant', 'secondary');

    // Register button should not have variant (default)
    const registerButton = buttons.find((button) => button.textContent === 'Sign Up');
    expect(registerButton).not.toHaveAttribute('data-variant');
  });
});
