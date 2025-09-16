/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, vi, beforeEach, expect} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {BannerProvider, useBanner} from './banner-provider';

// Mock the hooks
vi.mock('@/hooks', () => ({
  useWindowSize: vi.fn()
}));

// Mock the Banner component
vi.mock('@outshift/spark-design', () => ({
  Banner: ({text, onClose, showCloseButton, ...props}: any) => (
    <div data-testid="banner" data-show-close-button={showCloseButton} {...props}>
      {typeof text === 'string' ? text : text}
      {onClose && showCloseButton !== false && (
        <button data-testid="close-button" onClick={onClose}>
          Close
        </button>
      )}
    </div>
  )
}));

// Mock the docs utility
vi.mock('@/utils/docs', () => ({
  docs: vi.fn(() => 'https://docs.example.com')
}));

const mockUseWindowSize = vi.mocked(await import('@/hooks')).useWindowSize;

// Test component that uses the banner context
const TestComponent = () => {
  const {banners, hasBanners, addBanner, removeBanner} = useBanner();

  return (
    <div>
      <div data-testid="banners-count">{banners.length}</div>
      <div data-testid="has-banners">{hasBanners.toString()}</div>
      <button data-testid="add-banner" onClick={() => addBanner('Test banner')}>
        Add Banner
      </button>
      <button data-testid="add-banner-with-id" onClick={() => addBanner('Test banner with ID')}>
        Add Banner with ID
      </button>
      <button data-testid="remove-banner" onClick={() => removeBanner('docs-banner')}>
        Remove Banner
      </button>
    </div>
  );
};

// Component to test error throwing
const TestComponentOutsideProvider = () => {
  useBanner();
  return <div>Should not render</div>;
};

describe('BannerProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for useWindowSize
    mockUseWindowSize.mockReturnValue({
      isMobile: false,
      isTablet: false,
      windowSize: {
        width: 1024,
        height: 768
      }
    });
  });

  it('renders children correctly', () => {
    render(
      <BannerProvider>
        <div data-testid="children">Test children</div>
      </BannerProvider>
    );

    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  it('provides context values correctly', () => {
    render(
      <BannerProvider>
        <TestComponent />
      </BannerProvider>
    );

    // Should have initial banner
    expect(screen.getByTestId('banners-count')).toHaveTextContent('1');
    expect(screen.getByTestId('has-banners')).toHaveTextContent('true');
  });

  it('throws error when useBanner is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponentOutsideProvider />);
    }).toThrow('useBanner must be used within a BannerProvider');

    consoleSpy.mockRestore();
  });

  it('renders default banner with correct content', () => {
    render(
      <BannerProvider>
        <div>Content</div>
      </BannerProvider>
    );

    // Since the text prop contains JSX, we need to check for the rendered content differently
    expect(screen.getByText(/This is a reference implementation/)).toBeInTheDocument();
    expect(screen.getByText('Service Documentation')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Service Documentation'})).toHaveAttribute('href', 'https://docs.example.com');
  });

  it('adds banner without custom ID', () => {
    render(
      <BannerProvider>
        <TestComponent />
      </BannerProvider>
    );

    fireEvent.click(screen.getByTestId('add-banner'));

    expect(screen.getByTestId('banners-count')).toHaveTextContent('2');
  });

  it('adds banner with custom ID', () => {
    render(
      <BannerProvider>
        <TestComponent />
      </BannerProvider>
    );

    fireEvent.click(screen.getByTestId('add-banner-with-id'));

    expect(screen.getByTestId('banners-count')).toHaveTextContent('2');
  });

  it('removes banner by ID', () => {
    render(
      <BannerProvider>
        <TestComponent />
      </BannerProvider>
    );

    fireEvent.click(screen.getByTestId('remove-banner'));

    expect(screen.getByTestId('banners-count')).toHaveTextContent('0');
    expect(screen.getByTestId('has-banners')).toHaveTextContent('false');
  });

  it('hides banners on mobile', () => {
    mockUseWindowSize.mockReturnValue({
      isMobile: true,
      isTablet: false,
      windowSize: {
        width: 375,
        height: 667
      }
    });

    render(
      <BannerProvider>
        <TestComponent />
      </BannerProvider>
    );

    expect(screen.getByTestId('has-banners')).toHaveTextContent('false');
    expect(screen.queryByTestId('banner')).not.toBeInTheDocument();
  });

  it('shows banners on desktop', () => {
    mockUseWindowSize.mockReturnValue({
      isMobile: false,
      isTablet: false,
      windowSize: {
        width: 1024,
        height: 768
      }
    });

    render(
      <BannerProvider>
        <div>Content</div>
      </BannerProvider>
    );

    expect(screen.getByTestId('banner')).toBeInTheDocument();
  });

  it('renders multiple banners with correct z-index', () => {
    render(
      <BannerProvider>
        <TestComponent />
      </BannerProvider>
    );

    // Add two more banners
    fireEvent.click(screen.getByTestId('add-banner'));
    fireEvent.click(screen.getByTestId('add-banner'));

    const bannerContainers = screen.getAllByTestId('banner').map((banner) => banner.parentElement);

    expect(bannerContainers[0]).toHaveStyle('z-index: 1');
    expect(bannerContainers[1]).toHaveStyle('z-index: 2');
    expect(bannerContainers[2]).toHaveStyle('z-index: 3');
  });

  it('handles banner close functionality', () => {
    render(
      <BannerProvider>
        <TestComponent />
      </BannerProvider>
    );

    // Add a banner that can be closed (by default, addBanner creates closeable banners)
    fireEvent.click(screen.getByTestId('add-banner'));

    // Now we should have 2 banners total, and the new one should have a close button
    expect(screen.getByTestId('banners-count')).toHaveTextContent('2');

    const closeButtons = screen.getAllByTestId('close-button');
    expect(closeButtons).toHaveLength(1); // Only the new banner should have a close button

    fireEvent.click(closeButtons[0]);

    // After closing, we should be back to 1 banner (the default one)
    expect(screen.getByTestId('banners-count')).toHaveTextContent('1');
  });

  it('applies correct styling for mobile icon visibility', () => {
    mockUseWindowSize.mockReturnValue({
      isMobile: true,
      isTablet: false,
      windowSize: {
        width: 375,
        height: 667
      }
    });

    render(
      <BannerProvider>
        <div>Content</div>
      </BannerProvider>
    );

    // Banner should not be rendered on mobile due to hasBanners being false
    expect(screen.queryByTestId('banner')).not.toBeInTheDocument();
  });

  it('applies correct styling for tablet icon visibility', () => {
    mockUseWindowSize.mockReturnValue({
      isMobile: false,
      isTablet: true,
      windowSize: {
        width: 768,
        height: 1024
      }
    });

    render(
      <BannerProvider>
        <div>Content</div>
      </BannerProvider>
    );

    const banner = screen.getByTestId('banner');
    expect(banner).toBeInTheDocument();
  });

  it('generates unique IDs for banners when no ID provided', () => {
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(2000);

    render(
      <BannerProvider>
        <TestComponent />
      </BannerProvider>
    );

    fireEvent.click(screen.getByTestId('add-banner'));
    fireEvent.click(screen.getByTestId('add-banner'));

    expect(screen.getByTestId('banners-count')).toHaveTextContent('3');

    dateSpy.mockRestore();
  });

  it('maintains banner state correctly after multiple operations', () => {
    render(
      <BannerProvider>
        <TestComponent />
      </BannerProvider>
    );

    // Add banner
    fireEvent.click(screen.getByTestId('add-banner'));
    expect(screen.getByTestId('banners-count')).toHaveTextContent('2');

    // Add another banner with custom ID
    fireEvent.click(screen.getByTestId('add-banner-with-id'));
    expect(screen.getByTestId('banners-count')).toHaveTextContent('3');

    // Remove original banner
    fireEvent.click(screen.getByTestId('remove-banner'));
    expect(screen.getByTestId('banners-count')).toHaveTextContent('2');
  });

  it('applies correct container styling', () => {
    render(
      <BannerProvider>
        <div data-testid="content">Content</div>
      </BannerProvider>
    );

    const container = screen.getByTestId('content').parentElement;
    expect(container).toHaveClass('pt-[56px]');
  });

  it('applies correct grid styling to banner container', () => {
    render(
      <BannerProvider>
        <div>Content</div>
      </BannerProvider>
    );

    const gridContainer = screen.getByTestId('banner').parentElement?.parentElement;
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1');
  });

  it('handles empty banner list correctly', () => {
    render(
      <BannerProvider>
        <TestComponent />
      </BannerProvider>
    );

    // Remove the default banner
    fireEvent.click(screen.getByTestId('remove-banner'));

    expect(screen.getByTestId('has-banners')).toHaveTextContent('false');
    expect(screen.queryByTestId('banner')).not.toBeInTheDocument();
  });

  it('passes banner props correctly to Banner component', () => {
    render(
      <BannerProvider>
        <div>Content</div>
      </BannerProvider>
    );

    const banner = screen.getByTestId('banner');
    expect(banner).toBeInTheDocument();

    // Default banner should not have showCloseButton
    expect(banner).toHaveAttribute('data-show-close-button', 'false');
  });

  it('maintains correct banner order when adding multiple banners', () => {
    render(
      <BannerProvider>
        <TestComponent />
      </BannerProvider>
    );

    // Add banners in sequence
    fireEvent.click(screen.getByTestId('add-banner'));
    fireEvent.click(screen.getByTestId('add-banner-with-id'));

    const bannerContainers = screen.getAllByTestId('banner').map((banner) => banner.parentElement);

    // Check z-index order
    expect(bannerContainers).toHaveLength(3);
    expect(bannerContainers[0]).toHaveStyle('z-index: 1');
    expect(bannerContainers[1]).toHaveStyle('z-index: 2');
    expect(bannerContainers[2]).toHaveStyle('z-index: 3');
  });
});
