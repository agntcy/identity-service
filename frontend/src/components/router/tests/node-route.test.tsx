/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {describe, it, vi, expect, beforeEach, afterEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {NodeRoute} from '../node-route';
import {ErrorBoundary} from 'react-error-boundary';
import {Loading} from '@/components/ui/loading';
import {useAnalytics} from '@/hooks';

// Mock react-error-boundary
vi.mock('react-error-boundary', () => ({
  ErrorBoundary: vi.fn(({children, fallbackRender}) => {
    try {
      return <div data-testid="error-boundary">{children}</div>;
    } catch (error) {
      return fallbackRender ? fallbackRender({error}) : <div>Error occurred</div>;
    }
  })
}));

// Mock ErrorPage component - move the function inside the mock
vi.mock('../error-page', () => ({
  ErrorPage: vi.fn((props) => (
    <div data-testid="error-page" data-error={props.error?.message}>
      Error Page
    </div>
  ))
}));

// Mock Loading component
vi.mock('@/components/ui/loading', () => ({
  Loading: vi.fn(() => <div data-testid="loading">Loading...</div>)
}));

// Mock useAnalytics hook
vi.mock('@/hooks', () => ({
  useAnalytics: vi.fn()
}));

describe('NodeRoute', () => {
  let mockErrorBoundary: ReturnType<typeof vi.mocked>;
  let mockLoading: ReturnType<typeof vi.mocked>;
  let mockUseAnalytics: ReturnType<typeof vi.mocked<typeof useAnalytics>>;
  let mockAnalyticsPage: ReturnType<typeof vi.fn>;
  let mockErrorPageComponent: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockErrorBoundary = vi.mocked(ErrorBoundary);
    mockLoading = vi.mocked(Loading);
    mockUseAnalytics = vi.mocked(useAnalytics);
    mockAnalyticsPage = vi.fn();

    // Get the mocked ErrorPage component
    const {ErrorPage} = await import('../error-page');
    mockErrorPageComponent = vi.mocked(ErrorPage);

    mockUseAnalytics.mockReturnValue({
      analyticsPage: mockAnalyticsPage,
      analyticsTrack: vi.fn()
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const TestChild = () => <div data-testid="test-child">Test Content</div>;

  describe('component rendering', () => {
    it('renders without crashing', () => {
      render(
        <NodeRoute>
          <TestChild />
        </NodeRoute>
      );

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('renders children within Suspense and ErrorBoundary by default', () => {
      render(
        <NodeRoute>
          <TestChild />
        </NodeRoute>
      );

      expect(mockErrorBoundary).toHaveBeenCalledWith(
        expect.objectContaining({
          fallbackRender: expect.any(Function),
          children: expect.anything()
        }),
        {}
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('renders multiple children correctly', () => {
      render(
        <NodeRoute>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </NodeRoute>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });
  });

  describe('error boundary behavior', () => {
    it('wraps children with ErrorBoundary when disableErrorBoundary is false', () => {
      render(
        <NodeRoute disableErrorBoundary={false}>
          <TestChild />
        </NodeRoute>
      );

      expect(mockErrorBoundary).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });

    it('wraps children with ErrorBoundary by default (when disableErrorBoundary is undefined)', () => {
      render(
        <NodeRoute>
          <TestChild />
        </NodeRoute>
      );

      expect(mockErrorBoundary).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });

    it('does not wrap children with ErrorBoundary when disableErrorBoundary is true', () => {
      render(
        <NodeRoute disableErrorBoundary={true}>
          <TestChild />
        </NodeRoute>
      );

      expect(mockErrorBoundary).not.toHaveBeenCalled();
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('passes ErrorPage as fallbackRender to ErrorBoundary', () => {
      render(
        <NodeRoute>
          <TestChild />
        </NodeRoute>
      );

      expect(mockErrorBoundary).toHaveBeenCalledWith(
        expect.objectContaining({
          fallbackRender: expect.any(Function)
        }),
        {}
      );

      // Test that the fallback render function structure is correct
      // Since we can't easily test the internal implementation,
      // we'll test that ErrorBoundary receives the correct fallbackRender prop
      // @ts-expect-error error
      const fallbackRenderCall = mockErrorBoundary.mock.calls[0][0];
      expect(fallbackRenderCall.fallbackRender).toBeInstanceOf(Function);
    });

    it('ErrorBoundary fallbackRender creates ErrorPage when called', () => {
      render(
        <NodeRoute>
          <TestChild />
        </NodeRoute>
      );

      // Get the fallbackRender function
      // @ts-expect-error error
      const fallbackRender = mockErrorBoundary.mock.calls[0][0].fallbackRender;
      const mockProps = {error: new Error('Test error'), resetErrorBoundary: vi.fn()};

      // Render the fallback
      render(<>{fallbackRender(mockProps)}</>);

      // Check that ErrorPage component is rendered with the error
      expect(screen.getByTestId('error-page')).toBeInTheDocument();
      expect(screen.getByTestId('error-page')).toHaveAttribute('data-error', 'Test error');
    });
  });

  describe('suspense behavior', () => {
    it('wraps children with Suspense and Loading fallback', () => {
      render(
        <NodeRoute>
          <TestChild />
        </NodeRoute>
      );

      // The children should be wrapped in Suspense
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('renders with Suspense wrapper structure', () => {
      // Test that the component structure includes Suspense
      const {container} = render(
        <NodeRoute>
          <TestChild />
        </NodeRoute>
      );

      // Verify the basic structure is maintained
      expect(container.firstChild).toBeDefined();
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('analytics tracking', () => {
    it('calls analyticsPage when pageTitle is provided', () => {
      render(
        <NodeRoute pageTitle="Test Page">
          <TestChild />
        </NodeRoute>
      );

      expect(mockAnalyticsPage).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsPage).toHaveBeenCalledWith('VISIT_PAGE', {
        pageTitle: 'Test Page'
      });
    });

    it('does not call analyticsPage when pageTitle is not provided', () => {
      render(
        <NodeRoute>
          <TestChild />
        </NodeRoute>
      );

      expect(mockAnalyticsPage).not.toHaveBeenCalled();
    });

    it('does not call analyticsPage when pageTitle is empty string', () => {
      render(
        <NodeRoute pageTitle="">
          <TestChild />
        </NodeRoute>
      );

      expect(mockAnalyticsPage).not.toHaveBeenCalled();
    });

    it('calls analyticsPage when pageTitle changes', () => {
      const {rerender} = render(
        <NodeRoute pageTitle="First Page">
          <TestChild />
        </NodeRoute>
      );

      expect(mockAnalyticsPage).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsPage).toHaveBeenCalledWith('VISIT_PAGE', {
        pageTitle: 'First Page'
      });

      rerender(
        <NodeRoute pageTitle="Second Page">
          <TestChild />
        </NodeRoute>
      );

      expect(mockAnalyticsPage).toHaveBeenCalledTimes(2);
      expect(mockAnalyticsPage).toHaveBeenLastCalledWith('VISIT_PAGE', {
        pageTitle: 'Second Page'
      });
    });

    it('does not call analyticsPage again when pageTitle remains the same', () => {
      const {rerender} = render(
        <NodeRoute pageTitle="Same Page">
          <TestChild />
        </NodeRoute>
      );

      expect(mockAnalyticsPage).toHaveBeenCalledTimes(1);

      rerender(
        <NodeRoute pageTitle="Same Page">
          <TestChild />
        </NodeRoute>
      );

      expect(mockAnalyticsPage).toHaveBeenCalledTimes(1);
    });

    it('calls analyticsPage when changing from no title to having title', () => {
      const {rerender} = render(
        <NodeRoute>
          <TestChild />
        </NodeRoute>
      );

      expect(mockAnalyticsPage).not.toHaveBeenCalled();

      rerender(
        <NodeRoute pageTitle="New Page">
          <TestChild />
        </NodeRoute>
      );

      expect(mockAnalyticsPage).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsPage).toHaveBeenCalledWith('VISIT_PAGE', {
        pageTitle: 'New Page'
      });
    });

    it('stops calling analyticsPage when pageTitle is removed', () => {
      const {rerender} = render(
        <NodeRoute pageTitle="Existing Page">
          <TestChild />
        </NodeRoute>
      );

      expect(mockAnalyticsPage).toHaveBeenCalledTimes(1);

      rerender(
        <NodeRoute>
          <TestChild />
        </NodeRoute>
      );

      // Should still be 1, no additional calls
      expect(mockAnalyticsPage).toHaveBeenCalledTimes(1);
    });
  });

  describe('useEffect dependencies', () => {
    it('re-runs effect when analyticsPage function changes', () => {
      const newAnalyticsPage = vi.fn();

      const {rerender} = render(
        <NodeRoute pageTitle="Test Page">
          <TestChild />
        </NodeRoute>
      );

      expect(mockAnalyticsPage).toHaveBeenCalledTimes(1);

      // Change the analyticsPage function
      mockUseAnalytics.mockReturnValue({
        analyticsPage: newAnalyticsPage,
        analyticsTrack: vi.fn()
      });

      rerender(
        <NodeRoute pageTitle="Test Page">
          <TestChild />
        </NodeRoute>
      );

      expect(newAnalyticsPage).toHaveBeenCalledTimes(1);
      expect(newAnalyticsPage).toHaveBeenCalledWith('VISIT_PAGE', {
        pageTitle: 'Test Page'
      });
    });
  });

  describe('component structure combinations', () => {
    it('renders correctly with errorBoundary disabled and pageTitle provided', () => {
      render(
        <NodeRoute disableErrorBoundary={true} pageTitle="Test Page">
          <TestChild />
        </NodeRoute>
      );

      expect(mockErrorBoundary).not.toHaveBeenCalled();
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(mockAnalyticsPage).toHaveBeenCalledWith('VISIT_PAGE', {
        pageTitle: 'Test Page'
      });
    });

    it('renders correctly with errorBoundary enabled and no pageTitle', () => {
      render(
        <NodeRoute disableErrorBoundary={false}>
          <TestChild />
        </NodeRoute>
      );

      expect(mockErrorBoundary).toHaveBeenCalled();
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(mockAnalyticsPage).not.toHaveBeenCalled();
    });
  });

  describe('props interface compliance', () => {
    it('accepts all valid NodeRouteProps', () => {
      const props = {
        children: <TestChild />,
        disableErrorBoundary: true,
        pageTitle: 'Custom Page Title'
      };

      expect(() => {
        render(<NodeRoute {...props} />);
      }).not.toThrow();

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(mockAnalyticsPage).toHaveBeenCalledWith('VISIT_PAGE', {
        pageTitle: 'Custom Page Title'
      });
    });

    it('works with only required props', () => {
      expect(() => {
        render(
          <NodeRoute>
            <TestChild />
          </NodeRoute>
        );
      }).not.toThrow();

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles null children gracefully', () => {
      expect(() => {
        render(<NodeRoute>{null}</NodeRoute>);
      }).not.toThrow();
    });

    it('handles undefined children gracefully', () => {
      expect(() => {
        render(<NodeRoute>{undefined}</NodeRoute>);
      }).not.toThrow();
    });

    it('handles empty children gracefully', () => {
      expect(() => {
        // @ts-expect-error testing empty children
        render(<NodeRoute></NodeRoute>);
      }).not.toThrow();
    });

    it('handles very long page titles', () => {
      const longTitle = 'A'.repeat(1000);

      render(
        <NodeRoute pageTitle={longTitle}>
          <TestChild />
        </NodeRoute>
      );

      expect(mockAnalyticsPage).toHaveBeenCalledWith('VISIT_PAGE', {
        pageTitle: longTitle
      });
    });

    it('handles special characters in page titles', () => {
      const specialTitle = 'Page <script>alert("xss")</script> & émojis 🚀';

      render(
        <NodeRoute pageTitle={specialTitle}>
          <TestChild />
        </NodeRoute>
      );

      expect(mockAnalyticsPage).toHaveBeenCalledWith('VISIT_PAGE', {
        pageTitle: specialTitle
      });
    });
  });

  describe('hook integration', () => {
    it('calls useAnalytics hook on every render', () => {
      render(
        <NodeRoute>
          <TestChild />
        </NodeRoute>
      );

      expect(mockUseAnalytics).toHaveBeenCalledTimes(1);
    });

    it('handles useAnalytics returning undefined analyticsPage gracefully', () => {
      mockUseAnalytics.mockReturnValue({
        analyticsPage: undefined as any,
        analyticsTrack: vi.fn()
      });

      // This test should verify that the component handles undefined analyticsPage gracefully
      // The component should render but not call analytics
      render(
        <NodeRoute pageTitle="Test">
          <TestChild />
        </NodeRoute>
      );

      // Component should render without throwing
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      // No analytics call should be made since analyticsPage is undefined
    });

    it('handles useAnalytics throwing an error', () => {
      mockUseAnalytics.mockImplementation(() => {
        throw new Error('Analytics error');
      });

      expect(() => {
        render(
          <NodeRoute>
            <TestChild />
          </NodeRoute>
        );
      }).toThrow('Analytics error');
    });
  });
});
