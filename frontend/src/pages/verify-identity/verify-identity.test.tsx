/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, vi, beforeEach, expect} from 'vitest';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import VerifyIdentity from './verify-identity';
import {renderWithClient} from '@/utils/tests';
import {Badge} from '@/types/api/badge';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn()
  };
});

// Mock the query hook
vi.mock('@/queries/agentic-services', () => ({
  useGetAgenticServiceBadge: vi.fn()
}));

// Mock components
vi.mock('@/components/layout/base-page', () => ({
  BasePage: ({children, title, rightSideItems}: any) => (
    <div data-testid="base-page">
      <h1>{title}</h1>
      <div data-testid="right-side-items">{rightSideItems}</div>
      {children}
    </div>
  )
}));

vi.mock('@/components/verify-identity/verify-identity-stepper', () => ({
  VerifyIdentityStepper: ({badge}: any) => (
    <div data-testid="verify-identity-stepper" data-badge={JSON.stringify(badge)}>
      VerifyIdentityStepper
    </div>
  )
}));

vi.mock('@/components/ui/conditional-query-renderer', () => ({
  ConditionalQueryRenderer: ({
    children,
    itemName,
    data,
    error,
    isLoading,
    bypass,
    errorListStateProps,
    useRelativeLoader
  }: any) => {
    if (bypass) {
      return <div data-testid="bypassed">Bypassed</div>;
    }
    if (isLoading) {
      return (
        <div data-testid="loading" data-use-relative-loader={useRelativeLoader}>
          Loading {itemName}
        </div>
      );
    }
    if (error) {
      return (
        <div data-testid="error">
          Error loading {itemName}
          <button onClick={errorListStateProps?.actionCallback} data-testid="retry-button">
            Retry
          </button>
        </div>
      );
    }
    if (data) {
      return <div data-testid="success">{children}</div>;
    }
    return <div data-testid="no-data">No data</div>;
  }
}));

// Mock external dependencies
vi.mock('lucide-react', () => ({
  ExternalLinkIcon: ({className}: any) => (
    <div data-testid="external-link-icon" className={className}>
      ExternalLinkIcon
    </div>
  )
}));

vi.mock('@open-ui-kit/core', () => ({
  Link: ({children, href, openInNewTab}: any) => (
    <a data-testid="spark-link" href={href} data-open-in-new-tab={openInNewTab}>
      {children}
    </a>
  )
}));

vi.mock('@/utils/docs', () => ({
  docs: vi.fn((key: string) => `https://docs.example.com/${key}`)
}));

const mockUseParams = vi.mocked(await import('react-router-dom')).useParams;
const mockUseGetAgenticServiceBadge = vi.mocked(await import('@/queries/agentic-services')).useGetAgenticServiceBadge;
const mockDocs = vi.mocked(await import('@/utils/docs')).docs;

describe('VerifyIdentity', () => {
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockDocs.mockReturnValue('https://docs.example.com/verify');
  });

  it('renders without crashing', () => {
    mockUseParams.mockReturnValue({id: 'test-id'});
    mockUseGetAgenticServiceBadge.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<Badge, Error>);

    renderWithClient(<VerifyIdentity />);

    expect(screen.getByTestId('base-page')).toBeInTheDocument();
  });

  it('renders with correct title and documentation link', () => {
    mockUseParams.mockReturnValue({id: 'test-id'});
    mockUseGetAgenticServiceBadge.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<Badge, Error>);

    renderWithClient(<VerifyIdentity />);

    expect(screen.getByText('Verify Identity')).toBeInTheDocument();
    expect(screen.getByTestId('spark-link')).toHaveAttribute('href', 'https://docs.example.com/verify');
    expect(screen.getByTestId('spark-link')).toHaveAttribute('data-open-in-new-tab', 'true');
    expect(screen.getByText('View Documentation')).toBeInTheDocument();
    expect(screen.getByTestId('external-link-icon')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    mockUseParams.mockReturnValue({id: 'test-id'});
    mockUseGetAgenticServiceBadge.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<Badge, Error>);

    renderWithClient(<VerifyIdentity />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText('Loading Verify Identity Badge')).toBeInTheDocument();
  });

  it('handles error state and refetch functionality', async () => {
    const user = userEvent.setup();
    mockUseParams.mockReturnValue({id: 'test-id'});
    mockUseGetAgenticServiceBadge.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<Badge, Error>);

    renderWithClient(<VerifyIdentity />);

    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(screen.getByText('Error loading Verify Identity Badge')).toBeInTheDocument();

    const retryButton = screen.getByTestId('retry-button');
    await user.click(retryButton);

    expect(mockRefetch).toHaveBeenCalledOnce();
  });

  it('renders VerifyIdentityStepper when data is available', () => {
    const mockBadgeData = {id: 'badge-1', name: 'Test Badge'};
    mockUseParams.mockReturnValue({id: 'test-id'});
    mockUseGetAgenticServiceBadge.mockReturnValue({
      data: mockBadgeData,
      isLoading: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<Badge, Error>);

    renderWithClient(<VerifyIdentity />);

    expect(screen.getByTestId('success')).toBeInTheDocument();
    expect(screen.getByTestId('verify-identity-stepper')).toBeInTheDocument();
    expect(screen.getByTestId('verify-identity-stepper')).toHaveAttribute('data-badge', JSON.stringify(mockBadgeData));
  });

  it('handles bypass scenario when no ID is provided', () => {
    mockUseParams.mockReturnValue({id: undefined});
    mockUseGetAgenticServiceBadge.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<Badge, Error>);

    renderWithClient(<VerifyIdentity />);

    expect(screen.getByTestId('bypassed')).toBeInTheDocument();
  });

  it('calls useGetAgenticServiceBadge with correct ID', () => {
    const testId = 'test-badge-id';
    mockUseParams.mockReturnValue({id: testId});
    mockUseGetAgenticServiceBadge.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<Badge, Error>);

    renderWithClient(<VerifyIdentity />);

    expect(mockUseGetAgenticServiceBadge).toHaveBeenCalledWith(testId);
  });

  it('passes useRelativeLoader prop to ConditionalQueryRenderer', () => {
    mockUseParams.mockReturnValue({id: 'test-id'});
    mockUseGetAgenticServiceBadge.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: mockRefetch
    } as unknown as import('@tanstack/react-query').UseQueryResult<Badge, Error>);

    renderWithClient(<VerifyIdentity />);

    expect(screen.getByTestId('loading')).toHaveAttribute('data-use-relative-loader', 'true');
  });
});
