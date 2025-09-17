/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {screen} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach} from 'vitest';
import AddAgenticService from '../add-agentic-service';
import {PATHS} from '@/router/paths';
import {docs} from '@/utils/docs';
import {renderWithClient} from '@/utils/tests';

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

vi.mock('@/components/agentic-services/add/add-agentic-service-stepper', () => ({
  AddAgenticServiceStepper: () => <div data-testid="add-agentic-service-stepper">AddAgenticServiceStepper</div>
}));

vi.mock('@cisco-eti/spark-design', () => ({
  Link: ({children, href, openInNewTab}: any) => (
    <a data-testid="spark-link" href={href} data-open-in-new-tab={openInNewTab}>
      {children}
    </a>
  )
}));

vi.mock('lucide-react', () => ({
  ExternalLinkIcon: ({className}: any) => (
    <svg data-testid="external-link-icon" className={className}>
      ExternalLinkIcon
    </svg>
  )
}));

// Mock utils
vi.mock('@/utils/docs', () => ({
  docs: vi.fn()
}));

const mockDocs = vi.mocked(docs);

describe('AddAgenticService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDocs.mockReturnValue('https://docs.example.com/agentic-service');
  });

  it('renders without crashing', () => {
    renderWithClient(<AddAgenticService />);
    expect(screen.getByTestId('base-page')).toBeInTheDocument();
  });

  it('renders with correct title', () => {
    renderWithClient(<AddAgenticService />);
    expect(screen.getByTestId('page-title')).toHaveTextContent('Add Agentic Service');
  });

  it('renders breadcrumbs correctly', () => {
    renderWithClient(<AddAgenticService />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    expect(breadcrumbsData).toEqual([
      {
        text: 'Agentic Services',
        link: PATHS.agenticServices.base
      },
      {
        text: 'Add Agentic Service'
      }
    ]);
  });

  it('renders breadcrumbs with correct paths', () => {
    renderWithClient(<AddAgenticService />);

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');

    expect(breadcrumbsData[0].link).toBe(PATHS.agenticServices.base);
    expect(breadcrumbsData[1]).not.toHaveProperty('link'); // Add breadcrumb should not have a link
  });

  it('renders AddAgenticServiceStepper component', () => {
    renderWithClient(<AddAgenticService />);
    expect(screen.getByTestId('add-agentic-service-stepper')).toBeInTheDocument();
  });

  it('renders documentation link in rightSideItems', () => {
    renderWithClient(<AddAgenticService />);

    const rightSideItems = screen.getByTestId('right-side-items');
    expect(rightSideItems).toBeInTheDocument();

    const documentationLink = screen.getByTestId('spark-link');
    expect(documentationLink).toBeInTheDocument();
  });

  it('calls docs utility with correct parameter', () => {
    renderWithClient(<AddAgenticService />);
    expect(mockDocs).toHaveBeenCalledWith('agentic-service');
  });

  it('passes correct href to documentation link', () => {
    const mockUrl = 'https://docs.example.com/agentic-service';
    mockDocs.mockReturnValue(mockUrl);

    renderWithClient(<AddAgenticService />);

    const documentationLink = screen.getByTestId('spark-link');
    expect(documentationLink).toHaveAttribute('href', mockUrl);
  });

  it('sets openInNewTab prop on documentation link', () => {
    renderWithClient(<AddAgenticService />);

    const documentationLink = screen.getByTestId('spark-link');
    expect(documentationLink).toHaveAttribute('data-open-in-new-tab', 'true');
  });

  it('renders documentation link text correctly', () => {
    renderWithClient(<AddAgenticService />);

    const documentationLink = screen.getByTestId('spark-link');
    expect(documentationLink).toHaveTextContent('View Documentation');
  });

  it('renders external link icon in documentation link', () => {
    renderWithClient(<AddAgenticService />);

    const externalLinkIcon = screen.getByTestId('external-link-icon');
    expect(externalLinkIcon).toBeInTheDocument();
    expect(externalLinkIcon).toHaveClass('w-4', 'h-4', 'ml-1');
  });

  it('renders documentation link with correct structure', () => {
    renderWithClient(<AddAgenticService />);

    const documentationLink = screen.getByTestId('spark-link');
    const linkContent = documentationLink.querySelector('div');

    expect(linkContent).toHaveClass('flex', 'items-center', 'gap-1');
    expect(linkContent).toHaveTextContent('View Documentation');
  });

  it('handles empty docs return value', () => {
    mockDocs.mockReturnValue('');

    renderWithClient(<AddAgenticService />);

    const documentationLink = screen.getByTestId('spark-link');
    expect(documentationLink).toHaveAttribute('href', '');
  });

  it('handles null docs return value', () => {
    mockDocs.mockReturnValue(null as any);

    renderWithClient(<AddAgenticService />);

    const documentationLink = screen.getByTestId('spark-link');
    expect(documentationLink).not.toHaveAttribute('href');
  });

  it('handles undefined docs return value', () => {
    mockDocs.mockReturnValue(undefined as any);

    renderWithClient(<AddAgenticService />);

    const documentationLink = screen.getByTestId('spark-link');
    expect(documentationLink).not.toHaveAttribute('href');
  });

  it('renders all required elements', () => {
    renderWithClient(<AddAgenticService />);

    // Check all main components are present
    expect(screen.getByTestId('base-page')).toBeInTheDocument();
    expect(screen.getByTestId('page-title')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    expect(screen.getByTestId('right-side-items')).toBeInTheDocument();
    expect(screen.getByTestId('add-agentic-service-stepper')).toBeInTheDocument();
    expect(screen.getByTestId('spark-link')).toBeInTheDocument();
    expect(screen.getByTestId('external-link-icon')).toBeInTheDocument();
  });

  it('passes all props correctly to BasePage', () => {
    renderWithClient(<AddAgenticService />);

    // Verify title
    expect(screen.getByTestId('page-title')).toHaveTextContent('Add Agentic Service');

    // Verify breadcrumbs structure
    const breadcrumbs = screen.getByTestId('breadcrumbs');
    const breadcrumbsData = JSON.parse(breadcrumbs.textContent || '[]');
    expect(breadcrumbsData).toHaveLength(2);
    expect(breadcrumbsData[0].text).toBe('Agentic Services');
    expect(breadcrumbsData[1].text).toBe('Add Agentic Service');

    // Verify rightSideItems is present
    expect(screen.getByTestId('right-side-items')).toBeInTheDocument();
  });

  it('maintains component structure and styling', () => {
    renderWithClient(<AddAgenticService />);

    const documentationLink = screen.getByTestId('spark-link');
    const linkWrapper = documentationLink.querySelector('div');
    const icon = screen.getByTestId('external-link-icon');

    // Check wrapper classes
    expect(linkWrapper).toHaveClass('flex', 'items-center', 'gap-1');

    // Check icon classes
    expect(icon).toHaveClass('w-4', 'h-4', 'ml-1');
  });

  it('calls docs function only once during render', () => {
    renderWithClient(<AddAgenticService />);
    expect(mockDocs).toHaveBeenCalledTimes(1);
  });

  it('renders component as functional component', () => {
    const component = renderWithClient(<AddAgenticService />);
    expect(component.container.firstChild).toBeInTheDocument();
  });
});
