/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import {describe, it, vi, expect, beforeEach, afterEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {AuthError} from '../auth-error';

// Mock Spark Design EmptyState
vi.mock('@open-ui-kit/core', () => ({
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

describe('AuthError', () => {
  let mockResetErrorBoundary: ReturnType<typeof vi.fn>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockResetErrorBoundary = vi.fn();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Mock Date to ensure consistent timestamps in tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  // Move defaultProps inside a function to avoid the initialization issue
  const getDefaultProps = () => ({
    error: new Error('Test error message'),
    resetErrorBoundary: mockResetErrorBoundary
  });

  describe('component rendering', () => {
    it('renders without crashing', () => {
      render(<AuthError {...getDefaultProps()} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(document.querySelector('[data-slot="card"]')).toBeInTheDocument();
    });

    it('renders Card with correct props', () => {
      render(<AuthError {...getDefaultProps()} />);

      const card = document.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('mt-[24px]', 'mx-[32px]', 'p-[24px]');
    });

    it('renders EmptyState with correct props', () => {
      render(<AuthError {...getDefaultProps()} />);

      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveAttribute('data-variant', 'warning');
      expect(emptyState).toHaveAttribute('data-title', 'Something went wrong');
      expect(emptyState).toHaveAttribute('data-action-title', 'Refresh');
      expect(emptyState).toHaveAttribute('data-container-padding-bottom', '40px');
    });
  });

  describe('error handling with Error objects', () => {
    it('displays Error object with name and message', () => {
      const testError = new Error('Network connection failed');
      testError.name = 'NetworkError';

      render(<AuthError error={testError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('NetworkError: Network connection failed');
    });

    it('displays Error object with just message when name is not set', () => {
      const testError = new Error('Simple error message');
      // Don't set testError.name explicitly

      render(<AuthError error={testError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Simple error message');
    });

    it('displays TypeError correctly', () => {
      const typeError = new TypeError('Cannot read property of undefined');

      render(<AuthError error={typeError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('TypeError: Cannot read property of undefined');
    });
  });

  describe('error handling with string errors', () => {
    it('displays string error message', () => {
      const stringError = 'Authentication failed';

      render(<AuthError error={stringError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Authentication failed');
    });

    it('displays empty string error', () => {
      render(<AuthError error="" resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Please try refreshing the page');
    });
  });

  describe('error handling with unknown error types', () => {
    it('handles null error', () => {
      render(<AuthError error={null} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Unknown error');
      expect(consoleSpy).toHaveBeenCalledWith(null);
    });

    it('handles undefined error', () => {
      render(<AuthError error={undefined} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Unknown error');
      expect(consoleSpy).toHaveBeenCalledWith(undefined);
    });

    it('handles object error', () => {
      const objectError = {code: 500, status: 'Internal Server Error'};

      render(<AuthError error={objectError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Unknown error');
      expect(consoleSpy).toHaveBeenCalledWith(objectError);
    });

    it('handles number error', () => {
      render(<AuthError error={404 as any} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Unknown error');
      expect(consoleSpy).toHaveBeenCalledWith(404);
    });
  });

  describe('date and timestamp display', () => {
    it('displays current date and time', () => {
      render(<AuthError {...getDefaultProps()} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Date of error: 1/15/2024, 10:30:00 AM');
    });

    it('updates date when rendered at different times', () => {
      const {rerender} = render(<AuthError {...getDefaultProps()} />);

      expect(screen.getByTestId('description')).toHaveTextContent('1/15/2024, 10:30:00 AM');

      // Advance time and rerender
      vi.setSystemTime(new Date('2024-01-15T14:45:30Z'));
      rerender(<AuthError {...getDefaultProps()} />);

      expect(screen.getByTestId('description')).toHaveTextContent('1/15/2024, 2:45:30 PM');
    });
  });

  describe('action button functionality', () => {
    it('calls resetErrorBoundary when Refresh button is clicked', () => {
      render(<AuthError {...getDefaultProps()} />);

      const refreshButton = screen.getByTestId('action-button');
      fireEvent.click(refreshButton);

      expect(mockResetErrorBoundary).toHaveBeenCalledTimes(1);
    });

    it('handles multiple clicks', () => {
      render(<AuthError {...getDefaultProps()} />);

      const refreshButton = screen.getByTestId('action-button');

      fireEvent.click(refreshButton);
      fireEvent.click(refreshButton);
      fireEvent.click(refreshButton);

      expect(mockResetErrorBoundary).toHaveBeenCalledTimes(3);
    });

    it('works when resetErrorBoundary is undefined', () => {
      render(<AuthError error={new Error('Test')} resetErrorBoundary={undefined} />);

      const refreshButton = screen.getByTestId('action-button');

      // Should not throw error when clicked
      expect(() => {
        fireEvent.click(refreshButton);
      }).not.toThrow();
    });

    it('works when resetErrorBoundary is not provided', () => {
      render(<AuthError error={new Error('Test')} />);

      const refreshButton = screen.getByTestId('action-button');

      expect(() => {
        fireEvent.click(refreshButton);
      }).not.toThrow();
    });
  });

  describe('content and messaging', () => {
    it('displays correct title', () => {
      render(<AuthError {...getDefaultProps()} />);

      expect(screen.getByRole('heading', {level: 1})).toHaveTextContent('Something went wrong');
    });

    it('displays support message', () => {
      render(<AuthError {...getDefaultProps()} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Please try refreshing the page, or contact support if the problem persists.');
    });

    it('displays action button with correct text', () => {
      render(<AuthError {...getDefaultProps()} />);

      const refreshButton = screen.getByTestId('action-button');
      expect(refreshButton).toHaveTextContent('Refresh');
    });
  });

  describe('component structure and styling', () => {
    it('has correct DOM hierarchy', () => {
      render(<AuthError {...getDefaultProps()} />);

      const card = document.querySelector('[data-slot="card"]');
      const emptyState = screen.getByTestId('empty-state');

      expect(card).toContainElement(emptyState);
    });

    it('applies correct CSS classes', () => {
      render(<AuthError {...getDefaultProps()} />);

      const card = document.querySelector('[data-slot="card"]');
      expect(card).toHaveClass('mt-[24px]', 'mx-[32px]', 'p-[24px]');
    });

    it('description has correct styling classes', () => {
      render(<AuthError {...getDefaultProps()} />);

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
      render(<AuthError {...getDefaultProps()} />);

      const heading = screen.getByRole('heading', {level: 1});
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Something went wrong');
    });

    it('has accessible button for refresh action', () => {
      render(<AuthError {...getDefaultProps()} />);

      const button = screen.getByRole('button', {name: /refresh/i});
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });

    it('provides meaningful error information for screen readers', () => {
      const testError = new Error('Authentication expired');
      testError.name = 'AuthError';

      render(<AuthError error={testError} resetErrorBoundary={mockResetErrorBoundary} />);

      // Error details should be accessible - use a function matcher for split text
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

      render(<AuthError error={longError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('A'.repeat(1000));
    });

    it('handles special characters in error messages', () => {
      const specialError = new Error('Error with <script>alert("xss")</script> and émojis 🚨');

      render(<AuthError error={specialError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Error with <script>alert("xss")</script> and émojis 🚨');
    });

    it('handles error objects with circular references', () => {
      const circularError: any = {message: 'Circular error'};
      circularError.self = circularError;

      render(<AuthError error={circularError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Unknown error');
      expect(consoleSpy).toHaveBeenCalledWith(circularError);
    });
  });

  describe('component behavior verification', () => {
    it('renders consistently on multiple renders', () => {
      const {rerender} = render(<AuthError {...getDefaultProps()} />);

      expect(document.querySelector('[data-slot="card"]')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();

      rerender(<AuthError {...getDefaultProps()} />);

      expect(document.querySelector('[data-slot="card"]')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('updates when error prop changes', () => {
      const {rerender} = render(<AuthError error={new Error('First error')} resetErrorBoundary={mockResetErrorBoundary} />);

      expect(screen.getByTestId('description')).toHaveTextContent('First error');

      rerender(<AuthError error={new Error('Second error')} resetErrorBoundary={mockResetErrorBoundary} />);

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
        render(<AuthError {...props} />);
      }).not.toThrow();
    });

    it('works without optional props', () => {
      expect(() => {
        render(<AuthError error={new Error('Test')} />);
      }).not.toThrow();
    });
  });
});
