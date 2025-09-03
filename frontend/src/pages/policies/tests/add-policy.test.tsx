/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {screen, cleanup} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import AddPolicy from '../add-policy';
import {PATHS} from '@/router/paths';
import {docs} from '@/utils/docs';
import {renderWithClient} from '@/utils/tests';

// Mock utilities
vi.mock('@/utils/docs', () => ({
  docs: vi.fn()
}));

// Mock components
vi.mock('@/components/layout/base-page', () => ({
  BasePage: ({children, title, breadcrumbs, rightSideItems}: any) => (
    <div data-testid="base-page">
      <h1 data-testid="page-title">{title}</h1>
      <div data-testid="breadcrumbs">{JSON.stringify(breadcrumbs)}</div>
      <div data-testid="right-side-items">{rightSideItems}</div>
      {children}
    </div>
  )
}));

vi.mock('@/components/policies/add-edit/add-edit-stepper', () => ({
  AddEditPolicyStepper: ({mode, policy}: any) => (
    <div
      data-testid="add-edit-stepper"
      data-mode={mode}
      data-policy={policy !== undefined ? JSON.stringify(policy) : undefined}
    >
      AddEditPolicyStepper
    </div>
  )
}));

// Mock external dependencies
vi.mock('@outshift/spark-design', async () => {
  const actual = await vi.importActual('@outshift/spark-design');
  return {
    ...actual,
    Link: ({children, href, openInNewTab, ...props}: any) => (
      <a
        data-testid="spark-link"
        href={href}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
      </a>
    )
  };
});

vi.mock('lucide-react', () => ({
  ExternalLinkIcon: ({className}: any) => (
    <div data-testid="external-link-icon" className={className}>
      ExternalLinkIcon
    </div>
  )
}));

const mockDocs = vi.mocked(docs);

describe('AddPolicy', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default docs mock
    mockDocs.mockReturnValue('https://docs.example.com/policies');
  });

  afterEach(() => {
    cleanup();
  });

  it('renders without crashing', () => {
    renderWithClient(<AddPolicy />);
    expect(screen.getByTestId('base-page')).toBeInTheDocument();
  });

  it('renders with correct title', () => {
    renderWithClient(<AddPolicy />);
    expect(screen.getByTestId('page-title')).toHaveTextContent('Add Policy');
  });

  it('renders breadcrumbs correctly', () => {
    renderWithClient(<AddPolicy />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    expect(breadcrumbsData).toEqual([
      {
        text: 'Policies',
        link: PATHS.policies.base
      },
      {
        text: 'Add Policy'
      }
    ]);
  });

  it('breadcrumbs structure is correct', () => {
    renderWithClient(<AddPolicy />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    // First breadcrumb should have a link
    expect(breadcrumbsData[0]).toHaveProperty('link');
    expect(breadcrumbsData[0].link).toBe(PATHS.policies.base);

    // Second breadcrumb should not have a link (current page)
    expect(breadcrumbsData[1]).not.toHaveProperty('link');
  });

  it('renders documentation link in right side items', () => {
    renderWithClient(<AddPolicy />);

    expect(screen.getByTestId('spark-link')).toBeInTheDocument();
    expect(screen.getByTestId('spark-link')).toHaveTextContent('View Documentation');
  });

  it('documentation link has correct href', () => {
    mockDocs.mockReturnValue('https://custom-docs.example.com/policies');

    renderWithClient(<AddPolicy />);

    const link = screen.getByTestId('spark-link');
    expect(link).toHaveAttribute('href', 'https://custom-docs.example.com/policies');
  });

  it('documentation link opens in new tab', () => {
    renderWithClient(<AddPolicy />);

    const link = screen.getByTestId('spark-link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('calls docs utility with correct parameter', () => {
    renderWithClient(<AddPolicy />);

    expect(mockDocs).toHaveBeenCalledWith('policies');
  });

  it('renders external link icon', () => {
    renderWithClient(<AddPolicy />);

    expect(screen.getByTestId('external-link-icon')).toBeInTheDocument();
    expect(screen.getByTestId('external-link-icon')).toHaveClass('w-4', 'h-4', 'ml-1');
  });

  it('documentation link content structure is correct', () => {
    renderWithClient(<AddPolicy />);

    const link = screen.getByTestId('spark-link');

    // Should contain both text and icon
    expect(link).toHaveTextContent('View Documentation');
    expect(link.querySelector('[data-testid="external-link-icon"]')).toBeInTheDocument();
  });

  it('renders AddEditPolicyStepper component', () => {
    renderWithClient(<AddPolicy />);

    expect(screen.getByTestId('add-edit-stepper')).toBeInTheDocument();
  });

  it('passes correct mode to AddEditPolicyStepper', () => {
    renderWithClient(<AddPolicy />);

    const stepper = screen.getByTestId('add-edit-stepper');
    expect(stepper).toHaveAttribute('data-mode', 'add');
  });

  it('does not pass policy prop to AddEditPolicyStepper in add mode', () => {
    renderWithClient(<AddPolicy />);

    const stepper = screen.getByTestId('add-edit-stepper');
    // In add mode, no policy prop is passed, so the data-policy attribute should not exist
    expect(stepper).not.toHaveAttribute('data-policy');
  });

  it('renders all main sections', () => {
    renderWithClient(<AddPolicy />);

    // Should have all main components
    expect(screen.getByTestId('base-page')).toBeInTheDocument();
    expect(screen.getByTestId('page-title')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    expect(screen.getByTestId('right-side-items')).toBeInTheDocument();
    expect(screen.getByTestId('add-edit-stepper')).toBeInTheDocument();
  });

  it('handles docs utility returning empty string', () => {
    mockDocs.mockReturnValue('');

    renderWithClient(<AddPolicy />);

    const link = screen.getByTestId('spark-link');
    expect(link).toHaveAttribute('href', '');
  });

  it('handles docs utility returning null', () => {
    mockDocs.mockReturnValue(null as any);

    renderWithClient(<AddPolicy />);

    const link = screen.getByTestId('spark-link');
    // When href is null, React doesn't render the href attribute
    expect(link).not.toHaveAttribute('href');
  });

  it('handles docs utility returning undefined', () => {
    mockDocs.mockReturnValue(undefined as any);

    renderWithClient(<AddPolicy />);

    const link = screen.getByTestId('spark-link');
    // When href is undefined, React doesn't render the href attribute
    expect(link).not.toHaveAttribute('href');
  });

  it('handles docs utility returning false', () => {
    mockDocs.mockReturnValue(false as any);

    renderWithClient(<AddPolicy />);

    const link = screen.getByTestId('spark-link');
    // When href is false, React doesn't render the href attribute
    expect(link).not.toHaveAttribute('href');
  });

  it('handles docs utility returning zero', () => {
    mockDocs.mockReturnValue(0 as any);

    renderWithClient(<AddPolicy />);

    const link = screen.getByTestId('spark-link');
    // When href is 0, React renders it as href="0"
    expect(link).toHaveAttribute('href', '0');
  });

  it('documentation link flex layout is correct', () => {
    renderWithClient(<AddPolicy />);

    const link = screen.getByTestId('spark-link');
    const flexDiv = link.querySelector('div');

    expect(flexDiv).toHaveClass('flex', 'items-center', 'gap-1');
  });

  it('external link icon classes are applied correctly', () => {
    renderWithClient(<AddPolicy />);

    const icon = screen.getByTestId('external-link-icon');
    expect(icon).toHaveClass('w-4', 'h-4', 'ml-1');
  });

  it('uses correct PATHS constant for breadcrumbs', () => {
    renderWithClient(<AddPolicy />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    expect(breadcrumbsData[0].link).toBe(PATHS.policies.base);
  });

  it('component structure matches expected layout', () => {
    renderWithClient(<AddPolicy />);

    // BasePage should contain everything
    const basePage = screen.getByTestId('base-page');
    expect(basePage).toBeInTheDocument();

    // Right side items should contain the documentation link
    const rightSideItems = screen.getByTestId('right-side-items');
    expect(rightSideItems.querySelector('[data-testid="spark-link"]')).toBeInTheDocument();

    // Main content should contain the stepper
    expect(basePage.querySelector('[data-testid="add-edit-stepper"]')).toBeInTheDocument();
  });

  it('docs function is called exactly once', () => {
    renderWithClient(<AddPolicy />);

    expect(mockDocs).toHaveBeenCalledTimes(1);
  });

  it('docs function is called with string parameter', () => {
    renderWithClient(<AddPolicy />);

    expect(mockDocs).toHaveBeenCalledWith('policies');
    expect(typeof mockDocs.mock.calls[0][0]).toBe('string');
  });

  it('renders correctly when docs returns a complex URL', () => {
    const complexUrl = 'https://docs.example.com/v2/policies?section=overview&tab=getting-started';
    mockDocs.mockReturnValue(complexUrl);

    renderWithClient(<AddPolicy />);

    const link = screen.getByTestId('spark-link');
    expect(link).toHaveAttribute('href', complexUrl);
  });

  it('accessibility attributes are correct for external link', () => {
    renderWithClient(<AddPolicy />);

    const link = screen.getByTestId('spark-link');

    // Should have proper attributes for external links
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('handles different docs values in separate renders', () => {
    // First render with default docs value
    renderWithClient(<AddPolicy />);
    expect(screen.getByTestId('base-page')).toBeInTheDocument();
    expect(mockDocs).toHaveBeenCalledTimes(1);

    cleanup();

    // Clear mocks and render again with different docs value
    vi.clearAllMocks();
    mockDocs.mockReturnValue('https://different-docs.example.com/policies');

    renderWithClient(<AddPolicy />);
    expect(screen.getByTestId('base-page')).toBeInTheDocument();
    expect(mockDocs).toHaveBeenCalledTimes(1);

    const link = screen.getByTestId('spark-link');
    expect(link).toHaveAttribute('href', 'https://different-docs.example.com/policies');
  });

  it('maintains consistent component structure', () => {
    renderWithClient(<AddPolicy />);

    // Verify the component hierarchy
    const basePage = screen.getByTestId('base-page');
    const stepper = screen.getByTestId('add-edit-stepper');
    const link = screen.getByTestId('spark-link');
    const icon = screen.getByTestId('external-link-icon');

    // Stepper should be inside BasePage
    expect(basePage).toContainElement(stepper);

    // Icon should be inside link
    expect(link).toContainElement(icon);
  });

  it('renders with different docs values across test iterations', () => {
    // Test that the component renders correctly with different docs values
    const testCases = [
      'https://docs.example.com/policies-1',
      'https://docs.example.com/policies-2',
      'https://docs.example.com/policies-3'
    ];

    testCases.forEach((docsUrl, index) => {
      // Clean up from previous iteration
      if (index > 0) {
        cleanup();
      }

      vi.clearAllMocks();
      mockDocs.mockReturnValue(docsUrl);

      renderWithClient(<AddPolicy />);

      expect(screen.getByTestId('base-page')).toBeInTheDocument();
      expect(screen.getByTestId('add-edit-stepper')).toHaveAttribute('data-mode', 'add');
      expect(mockDocs).toHaveBeenCalledWith('policies');

      const link = screen.getByTestId('spark-link');
      expect(link).toHaveAttribute('href', docsUrl);
    });
  });

  it('handles docs returning various falsy values', () => {
    // Test each falsy value individually to ensure proper behavior
    const falsyTestCases = [
      {value: '', shouldHaveHref: true, expectedHref: ''},
      {value: null, shouldHaveHref: false},
      {value: undefined, shouldHaveHref: false},
      {value: false, shouldHaveHref: false},
      {value: 0, shouldHaveHref: true, expectedHref: '0'}
    ];

    falsyTestCases.forEach(({value, shouldHaveHref, expectedHref}, index) => {
      // Clean up from previous iteration
      if (index > 0) {
        cleanup();
      }

      vi.clearAllMocks();
      mockDocs.mockReturnValue(value as any);

      renderWithClient(<AddPolicy />);

      const link = screen.getByTestId('spark-link');

      if (shouldHaveHref) {
        expect(link).toHaveAttribute('href', expectedHref);
      } else {
        expect(link).not.toHaveAttribute('href');
      }
    });
  });

  it('docs utility is called consistently across different return values', () => {
    // Test that docs is always called regardless of what it returns
    const values = ['valid-url', '', null, undefined, false, 0];

    values.forEach((value, index) => {
      if (index > 0) {
        cleanup();
      }

      vi.clearAllMocks();
      mockDocs.mockReturnValue(value as any);

      renderWithClient(<AddPolicy />);

      expect(mockDocs).toHaveBeenCalledWith('policies');
      expect(mockDocs).toHaveBeenCalledTimes(1);
    });
  });
});
