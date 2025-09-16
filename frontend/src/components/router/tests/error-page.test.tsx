/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import {describe, it, vi, expect, beforeEach, afterEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {ErrorPage} from '../error-page';

// Mock React Router DOM
vi.mock('react-router-dom', () => ({
  useRouteError: vi.fn(),
  isRouteErrorResponse: vi.fn()
}));

// Mock Spark Design EmptyState
vi.mock('@outshift/spark-design', () => ({
  EmptyState: vi.fn(({variant, title, description, actionTitle, actionCallback, containerProps, ...props}) => {
    const handleClick = () => {
      if (actionCallback && typeof actionCallback === 'function') {
        actionCallback();
      }
    };

    return (
      <div
        data-testid="empty-state"
        data-variant={variant}
        data-title={title}
        data-action-title={actionTitle}
        data-container-padding-bottom={containerProps?.paddingBottom}
        {...props}
      >
        <h1>{title}</h1>
        <div data-testid="description">{description}</div>
        <button onClick={handleClick} data-testid="action-button">
          {actionTitle}
        </button>
      </div>
    );
  })
}));

import {useRouteError, isRouteErrorResponse} from 'react-router-dom';

describe('ErrorPage', () => {
  let mockResetErrorBoundary: ReturnType<typeof vi.fn>;
  let mockUseRouteError: ReturnType<typeof vi.fn>;
  let mockIsRouteErrorResponse: ReturnType<typeof vi.fn>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockResetErrorBoundary = vi.fn();
    mockUseRouteError = vi.mocked(useRouteError);
    mockIsRouteErrorResponse = vi.mocked(isRouteErrorResponse);
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock Date to ensure consistent timestamps in tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));

    // Default router error mock
    mockUseRouteError.mockReturnValue(null);
    mockIsRouteErrorResponse.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  const getDefaultProps = () => ({
    error: new Error('Test error message'),
    resetErrorBoundary: mockResetErrorBoundary
  });

  describe('component rendering', () => {
    it('renders without crashing', () => {
      render(<ErrorPage {...getDefaultProps()} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(document.querySelector('[data-slot="card"]')).toBeInTheDocument();
    });

    it('renders Card with correct props', () => {
      render(<ErrorPage {...getDefaultProps()} />);

      const card = document.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('mt-[24px]', 'mx-[32px]', 'p-[24px]');
    });

    it('renders EmptyState with correct props', () => {
      render(<ErrorPage {...getDefaultProps()} />);

      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveAttribute('data-variant', 'warning');
      expect(emptyState).toHaveAttribute('data-title', 'Something went wrong');
      expect(emptyState).toHaveAttribute('data-action-title', 'Refresh');
      expect(emptyState).toHaveAttribute('data-container-padding-bottom', '40px');
    });
  });

  describe('error handling with route error responses', () => {
    it('handles route error response with error message', () => {
      const routeError = {
        status: 404,
        statusText: 'Not Found',
        error: {
          message: 'Page not found'
        }
      };

      mockUseRouteError.mockReturnValue(routeError);
      mockIsRouteErrorResponse.mockReturnValue(true);

      render(<ErrorPage {...getDefaultProps()} />);

      const description = screen.getByTestId('description');
      // Component shows statusText, not error.message
      expect(description).toHaveTextContent('Not Found');
    });

    it('handles route error response without error message, falls back to statusText', () => {
      const routeError = {
        status: 500,
        statusText: 'Internal Server Error',
        error: null
      };

      mockUseRouteError.mockReturnValue(routeError);
      mockIsRouteErrorResponse.mockReturnValue(true);

      render(<ErrorPage error={new Error('Prop error')} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Internal Server Error');
    });

    it('handles route error response with empty error object', () => {
      const routeError = {
        status: 403,
        statusText: 'Forbidden',
        error: {}
      };

      mockUseRouteError.mockReturnValue(routeError);
      mockIsRouteErrorResponse.mockReturnValue(true);

      render(<ErrorPage error={new Error('Prop error')} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Forbidden');
    });
  });

  describe('error handling with Error objects', () => {
    it('displays Error object with name and message', () => {
      const testError = new Error('Network connection failed');
      testError.name = 'NetworkError';

      render(<ErrorPage error={testError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('NetworkError: Network connection failed');
    });

    it('displays Error object with just message when name is not set', () => {
      const testError = new Error('Simple error message');

      render(<ErrorPage error={testError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Simple error message');
    });

    it('displays TypeError correctly', () => {
      const typeError = new TypeError('Cannot read property of undefined');

      render(<ErrorPage error={typeError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('TypeError: Cannot read property of undefined');
    });

    it('handles Error object without message', () => {
      const errorWithoutMessage = new Error();

      render(<ErrorPage error={errorWithoutMessage} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Please try refreshing the page');
    });
  });

  describe('error handling with string errors', () => {
    it('displays string error message', () => {
      const stringError = 'Authentication failed';

      render(<ErrorPage error={stringError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Authentication failed');
    });

    it('displays empty string error', () => {
      render(<ErrorPage error="" resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Please try refreshing the page');
    });

    it('displays whitespace-only string error', () => {
      render(<ErrorPage error="   " resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      // Whitespace string shows fallback message
      expect(description).toHaveTextContent('Please try refreshing the page');
    });
  });

  describe('error handling with unknown error types', () => {
    it('handles null error', () => {
      render(<ErrorPage error={null} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Unknown error');
      expect(consoleSpy).toHaveBeenCalledWith(null);
    });

    it('handles undefined error', () => {
      render(<ErrorPage error={undefined} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Unknown error');
      expect(consoleSpy).toHaveBeenCalledWith(undefined);
    });

    it('handles object error', () => {
      const objectError = {code: 500, status: 'Internal Server Error'};

      render(<ErrorPage error={objectError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Unknown error');
      expect(consoleSpy).toHaveBeenCalledWith(objectError);
    });

    it('handles number error', () => {
      render(<ErrorPage error={404 as any} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Unknown error');
      expect(consoleSpy).toHaveBeenCalledWith(404);
    });
  });

  describe('date and timestamp display', () => {
    it('displays current date and time', () => {
      render(<ErrorPage {...getDefaultProps()} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Date of error: 1/15/2024, 10:30:00 AM');
    });

    it('updates date when rendered at different times', () => {
      const {rerender} = render(<ErrorPage {...getDefaultProps()} />);

      expect(screen.getByTestId('description')).toHaveTextContent('1/15/2024, 10:30:00 AM');

      // Advance time and rerender
      vi.setSystemTime(new Date('2024-01-15T14:45:30Z'));
      rerender(<ErrorPage {...getDefaultProps()} />);

      expect(screen.getByTestId('description')).toHaveTextContent('1/15/2024, 2:45:30 PM');
    });
  });

  describe('action button functionality', () => {
    it('calls resetErrorBoundary when Refresh button is clicked', () => {
      render(<ErrorPage {...getDefaultProps()} />);

      const refreshButton = screen.getByTestId('action-button');
      fireEvent.click(refreshButton);

      expect(mockResetErrorBoundary).toHaveBeenCalledTimes(1);
    });

    it('handles multiple clicks', () => {
      render(<ErrorPage {...getDefaultProps()} />);

      const refreshButton = screen.getByTestId('action-button');

      fireEvent.click(refreshButton);
      fireEvent.click(refreshButton);
      fireEvent.click(refreshButton);

      expect(mockResetErrorBoundary).toHaveBeenCalledTimes(3);
    });

    it('works when resetErrorBoundary is undefined', () => {
      render(<ErrorPage error={new Error('Test')} resetErrorBoundary={undefined} />);

      const refreshButton = screen.getByTestId('action-button');

      expect(() => {
        fireEvent.click(refreshButton);
      }).not.toThrow();
    });

    it('works when resetErrorBoundary is not provided', () => {
      render(<ErrorPage error={new Error('Test')} />);

      const refreshButton = screen.getByTestId('action-button');

      expect(() => {
        fireEvent.click(refreshButton);
      }).not.toThrow();
    });
  });

  describe('content and messaging', () => {
    it('displays correct title', () => {
      render(<ErrorPage {...getDefaultProps()} />);

      expect(screen.getByRole('heading', {level: 1})).toHaveTextContent('Something went wrong');
    });

    it('displays support message', () => {
      render(<ErrorPage {...getDefaultProps()} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Please try refreshing the page, or contact support if the problem persists.');
    });

    it('displays action button with correct text', () => {
      render(<ErrorPage {...getDefaultProps()} />);

      const refreshButton = screen.getByTestId('action-button');
      expect(refreshButton).toHaveTextContent('Refresh');
    });
  });

  describe('router error integration', () => {
    it('prioritizes route error over prop error when route error is present', () => {
      const routeError = {
        status: 404,
        statusText: 'Not Found',
        error: {
          message: 'Route not found'
        }
      };
      const propError = new Error('Prop error message');

      mockUseRouteError.mockReturnValue(routeError);
      mockIsRouteErrorResponse.mockReturnValue(true);

      render(<ErrorPage error={propError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      // Component shows statusText, not error.message
      expect(description).toHaveTextContent('Not Found');
      expect(description).not.toHaveTextContent('Prop error message');
    });

    it('falls back to prop error when route error is not a route response', () => {
      const routeError = new Error('Router error');
      const propError = new Error('Prop error message');

      mockUseRouteError.mockReturnValue(routeError);
      mockIsRouteErrorResponse.mockReturnValue(false);

      render(<ErrorPage error={propError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Prop error message');
    });

    it('uses route error when no prop error is provided', () => {
      const routeError = new Error('Router error message');

      mockUseRouteError.mockReturnValue(routeError);
      mockIsRouteErrorResponse.mockReturnValue(false);

      render(<ErrorPage error={routeError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Router error message');
    });
  });

  describe('component structure and styling', () => {
    it('has correct DOM hierarchy', () => {
      render(<ErrorPage {...getDefaultProps()} />);

      const card = document.querySelector('[data-slot="card"]');
      const emptyState = screen.getByTestId('empty-state');

      expect(card).toContainElement(emptyState);
    });

    it('applies correct CSS classes to Card', () => {
      render(<ErrorPage {...getDefaultProps()} />);

      const card = document.querySelector('[data-slot="card"]');
      expect(card).toHaveClass('mt-[24px]', 'mx-[32px]', 'p-[24px]');
    });

    it('description has correct styling classes', () => {
      render(<ErrorPage {...getDefaultProps()} />);

      const description = screen.getByTestId('description');
      const descriptionContent = description.querySelector('div');

      expect(descriptionContent).toHaveClass(
        'flex',
        'flex-col',
        'gap-2',
        'text-center',
        'text-xs',
        'text-muted-foreground',
        'mt-2'
      );
    });
  });

  describe('accessibility', () => {
    it('has accessible heading structure', () => {
      render(<ErrorPage {...getDefaultProps()} />);

      const heading = screen.getByRole('heading', {level: 1});
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Something went wrong');
    });

    it('has accessible button for refresh action', () => {
      render(<ErrorPage {...getDefaultProps()} />);

      const button = screen.getByRole('button', {name: /refresh/i});
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });

    it('provides meaningful error information for screen readers', () => {
      const testError = new Error('Authentication expired');
      testError.name = 'AuthError';

      render(<ErrorPage error={testError} resetErrorBoundary={mockResetErrorBoundary} />);

      expect(
        screen.getByText((content, element) => {
          return element?.textContent === 'AuthError: Authentication expired';
        })
      ).toBeInTheDocument();
      expect(screen.getByText(/Date of error:/)).toBeInTheDocument();
    });
  });

  describe('edge cases and error boundaries', () => {
    it('handles very long error messages', () => {
      const longError = new Error('A'.repeat(1000));

      render(<ErrorPage error={longError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('A'.repeat(1000));
    });

    it('handles special characters in error messages', () => {
      const specialError = new Error('Error with <script>alert("xss")</script> and émojis 🚨');

      render(<ErrorPage error={specialError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Error with <script>alert("xss")</script> and émojis 🚨');
    });

    it('handles route error with circular references', () => {
      const circularError: any = {message: 'Circular error'};
      circularError.self = circularError;

      mockUseRouteError.mockReturnValue(circularError);
      mockIsRouteErrorResponse.mockReturnValue(false);

      render(<ErrorPage error={circularError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Unknown error');
      expect(consoleSpy).toHaveBeenCalledWith(circularError);
    });
  });

  describe('component behavior verification', () => {
    it('renders consistently on multiple renders', () => {
      const {rerender} = render(<ErrorPage {...getDefaultProps()} />);

      expect(document.querySelector('[data-slot="card"]')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();

      rerender(<ErrorPage {...getDefaultProps()} />);

      expect(document.querySelector('[data-slot="card"]')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('updates when error prop changes', () => {
      const {rerender} = render(<ErrorPage error={new Error('First error')} resetErrorBoundary={mockResetErrorBoundary} />);

      expect(screen.getByTestId('description')).toHaveTextContent('First error');

      rerender(<ErrorPage error={new Error('Second error')} resetErrorBoundary={mockResetErrorBoundary} />);

      expect(screen.getByTestId('description')).toHaveTextContent('Second error');
    });
  });

  describe('TypeScript interface compliance', () => {
    it('accepts all required props from ErrorPageProps interface', () => {
      const props = {
        error: new Error('Test'),
        resetErrorBoundary: mockResetErrorBoundary,
        className: 'custom-class'
      };

      expect(() => {
        render(<ErrorPage {...props} />);
      }).not.toThrow();
    });

    it('works without optional props', () => {
      expect(() => {
        render(<ErrorPage error={new Error('Test')} />);
      }).not.toThrow();
    });
  });

  describe('conditional rendering logic', () => {
    it('shows error name and message when both are present', () => {
      const namedError = new Error('Connection failed');
      namedError.name = 'NetworkError';

      render(<ErrorPage error={namedError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('NetworkError: Connection failed');
    });

    it('shows only message when error name is not present', () => {
      const unnamedError = new Error('Connection failed');
      unnamedError.name = '';

      render(<ErrorPage error={unnamedError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Connection failed');
      expect(description).not.toHaveTextContent(': Connection failed');
    });

    it('handles error with name but no message', () => {
      const errorWithoutMessage = new Error('');
      errorWithoutMessage.name = 'CustomError';

      render(<ErrorPage error={errorWithoutMessage} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      // Since errorMessage is empty (falsy), it won't show the name: format
      expect(description).toHaveTextContent('Please try refreshing the page');
      expect(description).not.toHaveTextContent('CustomError:');
    });
  });
});
