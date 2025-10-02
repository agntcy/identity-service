/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {screen, cleanup} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import OnBoardDevice from './onboard-device';
import {docs} from '@/utils/docs';
import {renderWithClient} from '@/utils/tests';

// Mock utilities
vi.mock('@/utils/docs', () => ({
  docs: vi.fn()
}));

// Mock store
const mockSetIdDevice = vi.fn();
const mockIdDevice = 'device-123';

vi.mock('@/store', () => ({
  useLocalStore: vi.fn()
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: vi.fn()
  };
});

// Mock zustand
vi.mock('zustand/react/shallow', () => ({
  useShallow: vi.fn()
}));

// Mock components
vi.mock('@/components/layout/public-header', () => ({
  PublicHeader: ({userSection}: any) => (
    <div data-testid="public-header">
      <div data-testid="user-section">{userSection}</div>
    </div>
  )
}));

vi.mock('@/components/onboard-device/content-onboard-device', () => ({
  ContentOnBoardDevice: ({id}: any) => (
    <div data-testid="content-onboard-device" {...(id !== undefined && id !== null ? {'data-id': id} : {})}>
      ContentOnBoardDevice
    </div>
  )
}));

vi.mock('@/components/layout/footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>
}));

// Mock external dependencies
vi.mock('@open-ui-kit/core', async () => {
  const actual = await vi.importActual('@open-ui-kit/core');
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
const mockUseSearchParams = vi.mocked(await import('react-router-dom')).useSearchParams;
const mockUseLocalStore = vi.mocked(await import('@/store')).useLocalStore;
const mockUseShallow = vi.mocked(await import('zustand/react/shallow')).useShallow;

describe('OnBoardDevice', () => {
  const mockSearchParams = {
    get: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockDocs.mockReturnValue('https://docs.example.com');
    mockUseSearchParams.mockReturnValue([mockSearchParams as any, vi.fn()]);
    mockSearchParams.get.mockReturnValue(null);

    // Setup store mock
    mockUseShallow.mockImplementation((selector: any) =>
      selector({
        setIdDevice: mockSetIdDevice,
        idDevice: mockIdDevice
      })
    );
    mockUseLocalStore.mockReturnValue({
      setIdDevice: mockSetIdDevice,
      idDevice: mockIdDevice
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders without crashing', () => {
    renderWithClient(<OnBoardDevice />);
    expect(screen.getByTestId('public-header')).toBeInTheDocument();
  });

  it('renders all main components', () => {
    renderWithClient(<OnBoardDevice />);

    expect(screen.getByTestId('public-header')).toBeInTheDocument();
    expect(screen.getByTestId('content-onboard-device')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('renders documentation link in public header', () => {
    renderWithClient(<OnBoardDevice />);

    expect(screen.getByTestId('spark-link')).toBeInTheDocument();
    expect(screen.getByTestId('external-link-icon')).toBeInTheDocument();
  });

  it('documentation link has correct href', () => {
    mockDocs.mockReturnValue('https://custom-docs.example.com');

    renderWithClient(<OnBoardDevice />);

    const link = screen.getByTestId('spark-link');
    expect(link).toHaveAttribute('href', 'https://custom-docs.example.com');
  });

  it('documentation link opens in new tab', () => {
    renderWithClient(<OnBoardDevice />);

    const link = screen.getByTestId('spark-link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('calls docs utility without parameters', () => {
    renderWithClient(<OnBoardDevice />);

    expect(mockDocs).toHaveBeenCalledWith();
  });

  it('renders external link icon with correct classes', () => {
    renderWithClient(<OnBoardDevice />);

    const icon = screen.getByTestId('external-link-icon');
    expect(icon).toHaveClass('w-4', 'h-4', 'ml-1');
  });

  it('renders "Explore" text on medium screens and up', () => {
    renderWithClient(<OnBoardDevice />);

    const exploreText = screen.getByText('Explore');
    expect(exploreText).toHaveClass('hidden', 'md:block');
  });

  it('gets id from search params', () => {
    renderWithClient(<OnBoardDevice />);

    expect(mockUseSearchParams).toHaveBeenCalled();
    expect(mockSearchParams.get).toHaveBeenCalledWith('id');
  });

  it('uses local store with correct selector', () => {
    renderWithClient(<OnBoardDevice />);

    expect(mockUseLocalStore).toHaveBeenCalled();
    expect(mockUseShallow).toHaveBeenCalled();
  });

  it('passes idDevice from store to ContentOnBoardDevice', () => {
    renderWithClient(<OnBoardDevice />);

    const content = screen.getByTestId('content-onboard-device');
    expect(content).toHaveAttribute('data-id', mockIdDevice);
  });

  it('sets idDevice when id is present in search params', () => {
    const testId = 'test-device-456';
    mockSearchParams.get.mockReturnValue(testId);

    renderWithClient(<OnBoardDevice />);

    expect(mockSetIdDevice).toHaveBeenCalledWith(testId);
  });

  it('does not call setIdDevice when id is not in search params', () => {
    mockSearchParams.get.mockReturnValue(null);

    renderWithClient(<OnBoardDevice />);

    expect(mockSetIdDevice).not.toHaveBeenCalled();
  });

  it('handles empty string id from search params', () => {
    mockSearchParams.get.mockReturnValue('');

    renderWithClient(<OnBoardDevice />);

    expect(mockSetIdDevice).not.toHaveBeenCalled();
  });

  it('calls setIdDevice when id changes in search params', () => {
    // First render with no id
    renderWithClient(<OnBoardDevice />);
    expect(mockSetIdDevice).not.toHaveBeenCalled();

    cleanup();

    // Setup new search params and render again
    vi.clearAllMocks();
    mockSearchParams.get.mockReturnValue('new-device-789');

    renderWithClient(<OnBoardDevice />);
    expect(mockSetIdDevice).toHaveBeenCalledWith('new-device-789');
  });

  it('has correct layout structure', () => {
    renderWithClient(<OnBoardDevice />);

    // Check for main container classes
    const mainContainer = document.querySelector('.h-screen.w-screen.fixed.top-0.left-0.z-50');
    expect(mainContainer).toBeInTheDocument();

    // Check for flex layout
    const flexContainer = document.querySelector('.flex.flex-col.justify-between.h-full');
    expect(flexContainer).toBeInTheDocument();

    // Check for content centering
    const contentContainer = document.querySelector('.flex.flex-col.justify-center.h-full');
    expect(contentContainer).toBeInTheDocument();
  });

  it('applies correct CSS classes for full screen layout', () => {
    renderWithClient(<OnBoardDevice />);

    const container = document.querySelector('.h-screen.w-screen.fixed.top-0.left-0.z-50');
    expect(container).toHaveClass(
      'h-screen',
      'w-screen',
      'fixed',
      'top-0',
      'left-0',
      'z-50',
      'no-doc-scroll',
      'relative',
      'overflow-hidden',
      'h-dvh'
    );
  });

  it('renders components in correct order', () => {
    renderWithClient(<OnBoardDevice />);

    const container = document.querySelector('.flex.flex-col.justify-between.h-full');
    const children = Array.from(container?.children || []);

    expect(children[0]).toContainElement(screen.getByTestId('public-header'));
    expect(children[1]).toContainElement(screen.getByTestId('content-onboard-device'));
    expect(children[2]).toContainElement(screen.getByTestId('footer'));
  });

  it('handles docs returning different URLs', () => {
    const customUrl = 'https://custom.docs.com/onboard';
    mockDocs.mockReturnValue(customUrl);

    renderWithClient(<OnBoardDevice />);

    const link = screen.getByTestId('spark-link');
    expect(link).toHaveAttribute('href', customUrl);
  });

  it('handles docs returning empty string', () => {
    mockDocs.mockReturnValue('');

    renderWithClient(<OnBoardDevice />);

    const link = screen.getByTestId('spark-link');
    expect(link).toHaveAttribute('href', '');
  });

  it('handles docs returning null', () => {
    mockDocs.mockReturnValue(null as any);

    renderWithClient(<OnBoardDevice />);

    const link = screen.getByTestId('spark-link');
    expect(link).not.toHaveAttribute('href');
  });

  it('handles docs returning undefined', () => {
    mockDocs.mockReturnValue(undefined as any);

    renderWithClient(<OnBoardDevice />);

    const link = screen.getByTestId('spark-link');
    expect(link).not.toHaveAttribute('href');
  });

  it('store selector extracts correct properties', () => {
    renderWithClient(<OnBoardDevice />);

    expect(mockUseShallow).toHaveBeenCalledWith(expect.any(Function));

    const selectorFunction = mockUseShallow.mock.calls[0][0];
    const mockState = {
      setIdDevice: mockSetIdDevice,
      idDevice: mockIdDevice,
      otherProperty: 'should not be selected'
    };

    const result = selectorFunction(mockState);
    expect(result).toEqual({
      setIdDevice: mockSetIdDevice,
      idDevice: mockIdDevice
    });
    expect(result).not.toHaveProperty('otherProperty');
  });

  it('handles store returning different idDevice', () => {
    const differentId = 'different-device-id';
    mockUseLocalStore.mockReturnValue({
      setIdDevice: mockSetIdDevice,
      idDevice: differentId
    });

    renderWithClient(<OnBoardDevice />);

    const content = screen.getByTestId('content-onboard-device');
    expect(content).toHaveAttribute('data-id', differentId);
  });

  it('handles store returning undefined idDevice', () => {
    mockUseLocalStore.mockReturnValue({
      setIdDevice: mockSetIdDevice,
      idDevice: undefined
    });

    renderWithClient(<OnBoardDevice />);

    const content = screen.getByTestId('content-onboard-device');
    // When idDevice is undefined, the data-id attribute should not exist
    expect(content).not.toHaveAttribute('data-id');
  });

  it('handles store returning null idDevice', () => {
    mockUseLocalStore.mockReturnValue({
      setIdDevice: mockSetIdDevice,
      idDevice: null
    });

    renderWithClient(<OnBoardDevice />);

    const content = screen.getByTestId('content-onboard-device');
    // When idDevice is null, the data-id attribute should not exist
    expect(content).not.toHaveAttribute('data-id');
  });

  it('effect dependencies are correct', () => {
    const testId = 'effect-test-id';
    mockSearchParams.get.mockReturnValue(testId);

    renderWithClient(<OnBoardDevice />);

    expect(mockSetIdDevice).toHaveBeenCalledWith(testId);
    expect(mockSetIdDevice).toHaveBeenCalledTimes(1);
  });

  it('handles multiple id changes in search params', () => {
    // Test sequence of different ID values with separate renders
    const idSequence = ['first-id', 'second-id', 'third-id'];

    idSequence.forEach((id, index) => {
      // Clean up from previous iteration
      if (index > 0) {
        cleanup();
      }

      vi.clearAllMocks();
      mockSearchParams.get.mockReturnValue(id);

      renderWithClient(<OnBoardDevice />);

      expect(mockSetIdDevice).toHaveBeenCalledWith(id);
      expect(mockSetIdDevice).toHaveBeenCalledTimes(1);
    });
  });

  it('accessibility attributes are correct for external link', () => {
    renderWithClient(<OnBoardDevice />);

    const link = screen.getByTestId('spark-link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('user section contains link and icon', () => {
    renderWithClient(<OnBoardDevice />);

    const userSection = screen.getByTestId('user-section');
    expect(userSection.querySelector('[data-testid="spark-link"]')).toBeInTheDocument();
    expect(userSection.querySelector('[data-testid="external-link-icon"]')).toBeInTheDocument();
  });

  it('link structure contains explore text and icon', () => {
    renderWithClient(<OnBoardDevice />);

    const link = screen.getByTestId('spark-link');

    // Should contain both span and icon
    expect(link.querySelector('span')).toBeInTheDocument();
    expect(link.querySelector('[data-testid="external-link-icon"]')).toBeInTheDocument();

    // Span should have correct classes and text
    const span = link.querySelector('span');
    expect(span).toHaveClass('hidden', 'md:block');
    expect(span).toHaveTextContent('Explore');
  });

  it('handles component unmounting gracefully', () => {
    const {unmount} = renderWithClient(<OnBoardDevice />);

    expect(() => unmount()).not.toThrow();
  });

  it('docs function is called exactly once', () => {
    renderWithClient(<OnBoardDevice />);

    expect(mockDocs).toHaveBeenCalledTimes(1);
  });

  it('preserves component structure across different renders', () => {
    // First render
    renderWithClient(<OnBoardDevice />);

    expect(screen.getByTestId('public-header')).toBeInTheDocument();
    expect(screen.getByTestId('content-onboard-device')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();

    cleanup();

    // Second render with different conditions
    vi.clearAllMocks();
    mockDocs.mockReturnValue('https://different-docs.com');

    renderWithClient(<OnBoardDevice />);

    expect(screen.getByTestId('public-header')).toBeInTheDocument();
    expect(screen.getByTestId('content-onboard-device')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('handles various idDevice values from store', () => {
    const testCases = [
      {value: 'valid-id', shouldHaveAttribute: true, expectedValue: 'valid-id'},
      {value: '', shouldHaveAttribute: true, expectedValue: ''},
      {value: 0, shouldHaveAttribute: true, expectedValue: '0'},
      {value: null, shouldHaveAttribute: false},
      {value: undefined, shouldHaveAttribute: false}
    ];

    testCases.forEach(({value, shouldHaveAttribute, expectedValue}, index) => {
      // Clean up from previous iteration
      if (index > 0) {
        cleanup();
      }

      vi.clearAllMocks();
      mockUseLocalStore.mockReturnValue({
        setIdDevice: mockSetIdDevice,
        idDevice: value
      });

      renderWithClient(<OnBoardDevice />);

      const content = screen.getByTestId('content-onboard-device');

      if (shouldHaveAttribute) {
        expect(content).toHaveAttribute('data-id', expectedValue);
      } else {
        expect(content).not.toHaveAttribute('data-id');
      }
    });
  });

  it('handles search params with no id consistently', () => {
    // Test that component behaves consistently when no ID is provided
    mockSearchParams.get.mockReturnValue(null);

    renderWithClient(<OnBoardDevice />);

    expect(mockSetIdDevice).not.toHaveBeenCalled();
    expect(screen.getByTestId('content-onboard-device')).toBeInTheDocument();

    cleanup();

    // Render again with empty string
    vi.clearAllMocks();
    mockSearchParams.get.mockReturnValue('');

    renderWithClient(<OnBoardDevice />);

    expect(mockSetIdDevice).not.toHaveBeenCalled();
    expect(screen.getByTestId('content-onboard-device')).toBeInTheDocument();
  });

  it('effect only triggers when id is truthy', () => {
    const falsyValues = [null, undefined, ''];

    falsyValues.forEach((value, index) => {
      if (index > 0) {
        cleanup();
      }

      vi.clearAllMocks();
      mockSearchParams.get.mockReturnValue(value);

      renderWithClient(<OnBoardDevice />);

      expect(mockSetIdDevice).not.toHaveBeenCalled();
    });
  });

  it('layout container has proper nesting structure', () => {
    renderWithClient(<OnBoardDevice />);

    // Verify the nested structure exists
    const outerContainer = document.querySelector('.h-screen.w-screen.fixed');
    const innerContainer = outerContainer?.querySelector('.flex.flex-col.justify-between.h-full');
    const contentWrapper = innerContainer?.querySelector('.flex.flex-col.justify-center.h-full');

    expect(outerContainer).toBeInTheDocument();
    expect(innerContainer).toBeInTheDocument();
    expect(contentWrapper).toBeInTheDocument();
    expect(contentWrapper).toContainElement(screen.getByTestId('content-onboard-device'));
  });

  it('processes search params correctly', () => {
    // Test the logic: searchParams.get('id') || undefined
    mockSearchParams.get.mockReturnValue('');

    renderWithClient(<OnBoardDevice />);

    // Empty string from search params should not trigger setIdDevice
    expect(mockSetIdDevice).not.toHaveBeenCalled();

    cleanup();

    // Valid ID should trigger setIdDevice
    vi.clearAllMocks();
    mockSearchParams.get.mockReturnValue('valid-device-id');

    renderWithClient(<OnBoardDevice />);

    expect(mockSetIdDevice).toHaveBeenCalledWith('valid-device-id');
  });
});
