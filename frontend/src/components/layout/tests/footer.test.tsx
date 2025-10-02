/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import {renderWithClient} from '@/utils/tests';
import {Footer} from '../footer';
import {globalConfig} from '@/config/global';
import userEvent from '@testing-library/user-event';
import {MouseEventHandler, ReactElement, JSXElementConstructor, ReactNode, ReactPortal, Key} from 'react';
import {ClassAttributes, HTMLAttributes} from 'react';
import {JSX} from 'react/jsx-runtime';

// Create mock functions first
const mockUseWindowSize = vi.fn();
const mockShowPreferences = vi.fn();

// Mock dependencies
vi.mock('@open-ui-kit/core', () => ({
  Footer: ({productNode, links}: any) => (
    <footer data-testid="spark-footer">
      <div data-testid="product-node">{productNode}</div>
      <div data-testid="footer-links">
        {links?.map(
          (
            link: {
              href: string | undefined;
              openInNewTab: any;
              onClick: MouseEventHandler<HTMLAnchorElement> | undefined;
              children:
                | string
                | number
                | boolean
                | ReactElement<any, string | JSXElementConstructor<any>>
                | Iterable<ReactNode>
                | ReactPortal
                | null
                | undefined;
            },
            idx: Key | null | undefined
          ) => (
            <a
              key={idx}
              href={link.href}
              target={link.openInNewTab ? '_blank' : undefined}
              rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
              onClick={link.onClick}
              data-testid={`footer-link-${idx}`}
            >
              {link.children}
            </a>
          )
        )}
      </div>
    </footer>
  ),
  Typography: ({children, variant}: any) => (
    <div data-testid="typography" data-variant={variant}>
      {children}
    </div>
  )
}));

// Mock hooks with proper return values
vi.mock('@/hooks', () => ({
  useWindowSize: () => mockUseWindowSize()
}));

// Mock CookieConsent
vi.mock('vanilla-cookieconsent', () => ({
  showPreferences: () => mockShowPreferences()
}));

vi.mock('@/assets/footer/footer.svg?react', () => ({
  __esModule: true,
  default: (props: JSX.IntrinsicAttributes & ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="footer-logo" {...props} />
  )
}));

vi.mock('@/config/global', () => ({
  globalConfig: {
    poweredBy: true,
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

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with desktop view when not mobile', () => {
    // Mock non-mobile view
    mockUseWindowSize.mockReturnValue({isMobile: false, width: 1024, height: 768});

    renderWithClient(<Footer />);

    // Check if footer logo is rendered
    expect(screen.getByTestId('footer-logo')).toBeInTheDocument();

    // Check copyright text (should contain year and company name from config)
    const currentYear = new Date().getFullYear();
    // Target the specific span element that contains the copyright text
    expect(
      screen.getByText((content, element) => {
        if (!element || element.tagName !== 'SPAN') {
          return false;
        }
        const normalizedText = element.textContent?.replace(/\s+/g, ' ').trim() || '';
        const expectedText = `© ${currentYear} ${globalConfig.company.name}`;
        return normalizedText.includes(expectedText);
      })
    ).toBeInTheDocument();

    // Check if all desktop links are rendered
    expect(screen.getByText('support@agntcy.com')).toBeInTheDocument();
    expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Cookies')).toBeInTheDocument();

    // Check if we have 4 links in desktop view
    expect(screen.getAllByTestId(/footer-link-/)).toHaveLength(4);
  });

  it('renders with mobile view when on mobile', () => {
    // Mock mobile view
    mockUseWindowSize.mockReturnValue({isMobile: true, width: 375, height: 667});

    renderWithClient(<Footer />);

    // Check if footer logo is still rendered
    expect(screen.getByTestId('footer-logo')).toBeInTheDocument();

    // Check copyright text is still present (should contain year and company name from config)
    const currentYear = new Date().getFullYear();
    // Target the specific span element that contains the copyright text
    expect(
      screen.getByText((content, element) => {
        if (!element || element.tagName !== 'SPAN') {
          return false;
        }
        const normalizedText = element.textContent?.replace(/\s+/g, ' ').trim() || '';
        const expectedText = `© ${currentYear} ${globalConfig.company.name}`;
        return normalizedText.includes(expectedText);
      })
    ).toBeInTheDocument();

    // In mobile view, only Cookies link should be present
    expect(screen.queryByText('support@agntcy.com')).not.toBeInTheDocument();
    expect(screen.queryByText('Terms & Conditions')).not.toBeInTheDocument();
    expect(screen.queryByText('Privacy Policy')).not.toBeInTheDocument();
    expect(screen.getByText('Cookies')).toBeInTheDocument();

    // Check if we have only 1 link in mobile view
    expect(screen.getAllByTestId(/footer-link-/)).toHaveLength(1);
  });

  it('opens cookie preferences when clicking on Cookies link', async () => {
    // Mock non-mobile view
    mockUseWindowSize.mockReturnValue({isMobile: false, width: 1024, height: 768});

    renderWithClient(<Footer />);

    // Find and click the Cookies link
    const cookiesLink = screen.getByText('Cookies');
    await userEvent.click(cookiesLink);

    // Check if the cookie preferences function was called
    expect(mockShowPreferences).toHaveBeenCalledTimes(1);
  });

  it('renders copyright with current year', () => {
    // Mock non-mobile view
    mockUseWindowSize.mockReturnValue({isMobile: false, width: 1024, height: 768});

    renderWithClient(<Footer />);

    // Check that copyright contains current year and company name from config
    const currentYear = new Date().getFullYear();
    // Target the specific span element that contains the copyright text
    expect(
      screen.getByText((content, element) => {
        if (!element || element.tagName !== 'SPAN') {
          return false;
        }
        const normalizedText = element.textContent?.replace(/\s+/g, ' ').trim() || '';
        const expectedText = `© ${currentYear} ${globalConfig.company.name}`;
        return normalizedText.includes(expectedText);
      })
    ).toBeInTheDocument();
  });

  it('has correct link for Terms & Conditions', () => {
    // Mock non-mobile view
    mockUseWindowSize.mockReturnValue({isMobile: false, width: 1024, height: 768});

    renderWithClient(<Footer />);

    // Find Terms & Conditions link
    const termsLink = screen.getByText('Terms & Conditions').closest('a');
    expect(termsLink).toHaveAttribute('href', 'https://example.com/terms');
    expect(termsLink).toHaveAttribute('target', '_blank');
  });

  it('has correct link for Privacy Policy', () => {
    // Mock non-mobile view
    mockUseWindowSize.mockReturnValue({isMobile: false, width: 1024, height: 768});

    renderWithClient(<Footer />);

    // Find Privacy Policy link
    const privacyLink = screen.getByText('Privacy Policy').closest('a');
    expect(privacyLink).toHaveAttribute('href', 'https://example.com/privacy');
    expect(privacyLink).toHaveAttribute('target', '_blank');
  });

  it('has correct mailto link for support email', () => {
    // Mock non-mobile view
    mockUseWindowSize.mockReturnValue({isMobile: false, width: 1024, height: 768});

    renderWithClient(<Footer />);

    // Find support email link
    const emailLink = screen.getByText('support@agntcy.com').closest('a');
    expect(emailLink).toHaveAttribute('href', 'mailto:support@agntcy.com');
    expect(emailLink).toHaveAttribute('target', '_blank');
  });
});
