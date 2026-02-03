/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, vi, expect, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {ProviderType} from './provider-type';
import {IdpType} from '@/types/api/settings';

// Mock utilities
vi.mock('@/lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}));

// Mock MUI components
vi.mock('@mui/material', () => ({
  Typography: vi.fn(({children, variant, fontSize, ...props}) => (
    <span data-testid="typography" data-variant={variant} data-fontsize={fontSize} {...props}>
      {children}
    </span>
  ))
}));

// Mock SVG assets
vi.mock('@/assets/duo.svg?react', () => ({
  default: vi.fn((props) => (
    <svg data-testid="duo-logo" {...props}>
      <title>Duo Logo</title>
    </svg>
  ))
}));

vi.mock('@/assets/okta.svg?react', () => ({
  default: vi.fn((props) => (
    <svg data-testid="okta-logo" {...props}>
      <title>Okta Logo</title>
    </svg>
  ))
}));

vi.mock('@/assets/oasf.svg?react', () => ({
  default: vi.fn((props) => (
    <svg data-testid="oasf-logo" {...props}>
      <title>OASF Logo</title>
    </svg>
  ))
}));

vi.mock('@/assets/ory.svg?react', () => ({
  default: vi.fn((props) => (
    <svg data-testid="ory-logo" {...props}>
      <title>Ory Logo</title>
    </svg>
  ))
}));

vi.mock('@/assets/ping.jpg', () => ({
  default: 'ping-logo.jpg'
}));

// Mock constants - use string literals instead of enum references
vi.mock('@/constants/labels', () => ({
  labels: {
    providerTypes: {
      IDP_TYPE_DUO: 'Cisco Duo',
      IDP_TYPE_OKTA: 'Okta',
      IDP_TYPE_SELF: 'Self-Managed',
      IDP_TYPE_ORY: 'Ory',
      IDP_TYPE_PING: 'Ping Identity'
    }
  }
}));

// Mock IdpType enum
vi.mock('@/types/api/settings', () => ({
  IdpType: {
    IDP_TYPE_DUO: 'IDP_TYPE_DUO',
    IDP_TYPE_OKTA: 'IDP_TYPE_OKTA',
    IDP_TYPE_SELF: 'IDP_TYPE_SELF',
    IDP_TYPE_ORY: 'IDP_TYPE_ORY',
    IDP_TYPE_PING: 'IDP_TYPE_PING'
  }
}));

describe('ProviderType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders without props', () => {
      render(<ProviderType />);

      const container = screen.getByText('Unknown Provider Type').parentElement;
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('flex items-center gap-2');
    });

    it('renders with custom className', () => {
      render(<ProviderType className="custom-class" />);

      const container = screen.getByText('Unknown Provider Type').parentElement;
      expect(container).toHaveClass('flex items-center gap-2 custom-class');
    });

    it('renders Typography component with correct props', () => {
      render(<ProviderType />);

      const typography = screen.getByTestId('typography');
      expect(typography).toBeInTheDocument();
      expect(typography).toHaveAttribute('data-variant', 'body1');
      expect(typography).toHaveAttribute('data-fontsize', '14');
    });
  });

  describe('Duo provider type', () => {
    it('renders Duo logo and label', () => {
      render(<ProviderType type={IdpType.IDP_TYPE_DUO} />);

      const duoLogo = screen.getByTestId('duo-logo');
      expect(duoLogo).toBeInTheDocument();
      expect(duoLogo).toHaveClass('h-[22px] w-[22px]');

      expect(screen.getByText('Cisco Duo')).toBeInTheDocument();
      expect(screen.queryByTestId('okta-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('oasf-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ory-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ping-logo')).not.toBeInTheDocument();
    });
  });

  describe('Okta provider type', () => {
    it('renders Okta logo and label', () => {
      render(<ProviderType type={IdpType.IDP_TYPE_OKTA} />);

      const oktaLogo = screen.getByTestId('okta-logo');
      expect(oktaLogo).toBeInTheDocument();
      expect(oktaLogo).toHaveClass('h-[20px] w-[20px]');

      expect(screen.getByText('Okta')).toBeInTheDocument();
      expect(screen.queryByTestId('duo-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('oasf-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ory-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ping-logo')).not.toBeInTheDocument();
    });
  });

  describe('Self-managed provider type', () => {
    it('renders OASF logo and label', () => {
      render(<ProviderType type={IdpType.IDP_TYPE_SELF} />);

      const oasfLogo = screen.getByTestId('oasf-logo');
      expect(oasfLogo).toBeInTheDocument();
      expect(oasfLogo).toHaveClass('h-[20px] w-[20px]');

      expect(screen.getByText('Self-Managed')).toBeInTheDocument();
      expect(screen.queryByTestId('duo-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('okta-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ory-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ping-logo')).not.toBeInTheDocument();
    });
  });

  describe('Ory provider type', () => {
    it('renders Ory logo and label', () => {
      render(<ProviderType type={IdpType.IDP_TYPE_ORY} />);

      const oryLogo = screen.getByTestId('ory-logo');
      expect(oryLogo).toBeInTheDocument();
      expect(oryLogo).toHaveClass('h-[22px] w-[22px]');

      expect(screen.getByText('Ory')).toBeInTheDocument();
      expect(screen.queryByTestId('duo-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('okta-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('oasf-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ping-logo')).not.toBeInTheDocument();
    });
  });

  describe('Ping provider type', () => {
    it('renders Ping logo and label', () => {
      render(<ProviderType type={IdpType.IDP_TYPE_PING} />);

      const pingLogo = screen.getByAltText('Ping');
      expect(pingLogo).toBeInTheDocument();
      expect(pingLogo).toHaveClass('h-[22px] w-[22px]');

      expect(screen.getByText('Ping Identity')).toBeInTheDocument();
      expect(screen.queryByTestId('duo-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('okta-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('oasf-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ory-logo')).not.toBeInTheDocument();
    });
  });

  describe('unknown provider type', () => {
    it('shows fallback text for undefined type', () => {
      render(<ProviderType type={undefined} />);

      expect(screen.getByText('Unknown Provider Type')).toBeInTheDocument();
      expect(screen.queryByTestId('duo-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('okta-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('oasf-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ory-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ping-logo')).not.toBeInTheDocument();
    });

    it('shows fallback text for invalid type', () => {
      render(<ProviderType type={'INVALID_TYPE' as IdpType} />);

      expect(screen.getByText('Unknown Provider Type')).toBeInTheDocument();
      expect(screen.queryByTestId('duo-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('okta-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('oasf-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ory-logo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ping-logo')).not.toBeInTheDocument();
    });
  });

  describe('styling and structure', () => {
    it('applies correct base classes', () => {
      render(<ProviderType type={IdpType.IDP_TYPE_DUO} />);

      const container = screen.getByText('Cisco Duo').parentElement;
      expect(container).toHaveClass('flex items-center gap-2');
    });

    it('combines base classes with custom className', () => {
      render(<ProviderType type={IdpType.IDP_TYPE_OKTA} className="custom-styling" />);

      const container = screen.getByText('Okta').parentElement;
      expect(container).toHaveClass('flex items-center gap-2 custom-styling');
    });

    it('maintains proper DOM structure', () => {
      render(<ProviderType type={IdpType.IDP_TYPE_DUO} />);

      const container = screen.getByText('Cisco Duo').parentElement;
      expect(container?.tagName.toLowerCase()).toBe('div');

      const logo = screen.getByTestId('duo-logo');
      const text = screen.getByTestId('typography');

      expect(container).toContainElement(logo);
      expect(container).toContainElement(text);
    });
  });

  describe('accessibility', () => {
    it('provides accessible content for screen readers', () => {
      render(<ProviderType type={IdpType.IDP_TYPE_DUO} />);

      // Logo should have a title for accessibility
      const logo = screen.getByTestId('duo-logo');
      expect(logo).toContainElement(screen.getByTitle('Duo Logo'));

      // Text content should be accessible
      expect(screen.getByText('Cisco Duo')).toBeInTheDocument();
    });

    it('provides meaningful fallback content', () => {
      render(<ProviderType />);

      const fallbackText = screen.getByText('Unknown Provider Type');
      expect(fallbackText).toBeInTheDocument();
      expect(fallbackText).toBeVisible();
    });
  });

  describe('all provider types comprehensive test', () => {
    const providerTypeTests = [
      {
        type: IdpType.IDP_TYPE_DUO,
        expectedLabel: 'Cisco Duo',
        expectedLogo: 'duo-logo',
        expectedClasses: 'h-[22px] w-[22px]'
      },
      {
        type: IdpType.IDP_TYPE_OKTA,
        expectedLabel: 'Okta',
        expectedLogo: 'okta-logo',
        expectedClasses: 'h-[20px] w-[20px]'
      },
      {
        type: IdpType.IDP_TYPE_SELF,
        expectedLabel: 'Self-Managed',
        expectedLogo: 'oasf-logo',
        expectedClasses: 'h-[20px] w-[20px]'
      },
      {
        type: IdpType.IDP_TYPE_ORY,
        expectedLabel: 'Ory',
        expectedLogo: 'ory-logo',
        expectedClasses: 'h-[22px] w-[22px]'
      },
      {
        type: IdpType.IDP_TYPE_PING,
        expectedLabel: 'Ping Identity',
        expectedLogo: 'ping-logo',
        expectedClasses: 'h-[22px] w-[22px]'
      }
    ];

    providerTypeTests.forEach(({type, expectedLabel, expectedLogo, expectedClasses}) => {
      it(`renders ${type} provider correctly`, () => {
        render(<ProviderType type={type} />);

        // Check label
        expect(screen.getByText(expectedLabel)).toBeInTheDocument();

        // Check logo
        const logo = screen.getByTestId(expectedLogo);
        expect(logo).toBeInTheDocument();
        expect(logo).toHaveClass(expectedClasses);

        // Check that only the correct logo is rendered
        const allLogos = ['duo-logo', 'okta-logo', 'oasf-logo', 'ory-logo', 'ping-logo'];
        allLogos.forEach((logoTestId) => {
          if (logoTestId === expectedLogo) {
            expect(screen.getByTestId(logoTestId)).toBeInTheDocument();
          } else {
            expect(screen.queryByTestId(logoTestId)).not.toBeInTheDocument();
          }
        });
      });
    });
  });

  describe('edge cases', () => {
    it('handles null type gracefully', () => {
      render(<ProviderType type={null as any} />);

      expect(screen.getByText('Unknown Provider Type')).toBeInTheDocument();
      expect(screen.queryByTestId('duo-logo')).not.toBeInTheDocument();
    });

    it('handles empty string className', () => {
      render(<ProviderType className="" />);

      const container = screen.getByText('Unknown Provider Type').parentElement;
      expect(container).toHaveClass('flex items-center gap-2');
    });

    it('handles multiple custom classes', () => {
      render(<ProviderType className="class1 class2 class3" />);

      const container = screen.getByText('Unknown Provider Type').parentElement;
      expect(container).toHaveClass('flex items-center gap-2 class1 class2 class3');
    });
  });
});
