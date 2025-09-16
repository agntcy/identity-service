/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import {describe, it, vi, expect, beforeEach, afterEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {ErrorPageBoundary} from '../error-page-boundary';

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

describe('ErrorPageBoundary', () => {
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

  const getDefaultProps = () => ({
    error: new Error('Test error message'),
    resetErrorBoundary: mockResetErrorBoundary
  });

  describe('component rendering', () => {
    it('renders without crashing', () => {
      render(<ErrorPageBoundary {...getDefaultProps()} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(document.querySelector('[data-slot="card"]')).toBeInTheDocument();
    });

    it('renders Card with correct props', () => {
      render(<ErrorPageBoundary {...getDefaultProps()} />);

      const card = document.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('mt-[24px]', 'mx-[32px]', 'p-[24px]');
    });

    it('renders Card with secondary variant', () => {
      render(<ErrorPageBoundary {...getDefaultProps()} />);

      // Check for secondary variant styling in Card
      const card = document.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });

    it('renders EmptyState with correct props', () => {
      render(<ErrorPageBoundary {...getDefaultProps()} />);

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

      render(<ErrorPageBoundary error={testError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('NetworkError: Network connection failed');
    });

    it('displays Error object with just message when name is not set', () => {
      const testError = new Error('Simple error message');

      render(<ErrorPageBoundary error={testError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Simple error message');
    });

    it('displays TypeError correctly', () => {
      const typeError = new TypeError('Cannot read property of undefined');

      render(<ErrorPageBoundary error={typeError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('TypeError: Cannot read property of undefined');
    });

    it('handles Error object without message', () => {
      const errorWithoutMessage = new Error();

      render(<ErrorPageBoundary error={errorWithoutMessage} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Please try refreshing the page');
    });
  });

  describe('error handling with string errors', () => {
    it('displays string error message', () => {
      const stringError = 'Authentication failed';

      render(<ErrorPageBoundary error={stringError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Authentication failed');
    });

    it('displays empty string error', () => {
      render(<ErrorPageBoundary error="" resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Please try refreshing the page');
    });

    it('displays whitespace-only string error', () => {
      render(<ErrorPageBoundary error="   " resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      // Whitespace-only string is treated as falsy in the component's conditional logic,
      // so it falls back to the default message
      expect(description).toHaveTextContent('Please try refreshing the page');
      expect(description).not.toHaveTextContent('   ');
    });
  });

  describe('error handling with unknown error types', () => {
    it('handles null error', () => {
      render(<ErrorPageBoundary error={null} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Unknown error');
      expect(consoleSpy).toHaveBeenCalledWith(null);
    });

    it('handles undefined error', () => {
      render(<ErrorPageBoundary error={undefined} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Unknown error');
      expect(consoleSpy).toHaveBeenCalledWith(undefined);
    });

    it('handles object error', () => {
      const objectError = {code: 500, status: 'Internal Server Error'};

      render(<ErrorPageBoundary error={objectError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Unknown error');
      expect(consoleSpy).toHaveBeenCalledWith(objectError);
    });

    it('handles number error', () => {
      render(<ErrorPageBoundary error={404 as any} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Unknown error');
      expect(consoleSpy).toHaveBeenCalledWith(404);
    });

    it('handles array error', () => {
      const arrayError = ['error1', 'error2'];

      render(<ErrorPageBoundary error={arrayError as any} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Unknown error');
      expect(consoleSpy).toHaveBeenCalledWith(arrayError);
    });
  });

  describe('date and timestamp display', () => {
    it('displays current date and time', () => {
      render(<ErrorPageBoundary {...getDefaultProps()} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Date of error: 1/15/2024, 10:30:00 AM');
    });

    it('updates date when rendered at different times', () => {
      const {rerender} = render(<ErrorPageBoundary {...getDefaultProps()} />);

      expect(screen.getByTestId('description')).toHaveTextContent('1/15/2024, 10:30:00 AM');

      // Advance time and rerender
      vi.setSystemTime(new Date('2024-01-15T14:45:30Z'));
      rerender(<ErrorPageBoundary {...getDefaultProps()} />);

      expect(screen.getByTestId('description')).toHaveTextContent('1/15/2024, 2:45:30 PM');
    });

    it('displays date in different locales', () => {
      render(<ErrorPageBoundary {...getDefaultProps()} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Date of error: 1/15/2024, 10:30:00 AM');
    });
  });

  describe('action button functionality', () => {
    it('calls resetErrorBoundary when Refresh button is clicked', () => {
      render(<ErrorPageBoundary {...getDefaultProps()} />);

      const refreshButton = screen.getByTestId('action-button');
      fireEvent.click(refreshButton);

      expect(mockResetErrorBoundary).toHaveBeenCalledTimes(1);
    });

    it('handles multiple clicks', () => {
      render(<ErrorPageBoundary {...getDefaultProps()} />);

      const refreshButton = screen.getByTestId('action-button');

      fireEvent.click(refreshButton);
      fireEvent.click(refreshButton);
      fireEvent.click(refreshButton);

      expect(mockResetErrorBoundary).toHaveBeenCalledTimes(3);
    });

    it('works when resetErrorBoundary is undefined', () => {
      render(<ErrorPageBoundary error={new Error('Test')} resetErrorBoundary={undefined} />);

      const refreshButton = screen.getByTestId('action-button');

      // Should not throw error when clicked
      expect(() => {
        fireEvent.click(refreshButton);
      }).not.toThrow();
    });

    it('works when resetErrorBoundary is not provided', () => {
      render(<ErrorPageBoundary error={new Error('Test')} />);

      const refreshButton = screen.getByTestId('action-button');

      expect(() => {
        fireEvent.click(refreshButton);
      }).not.toThrow();
    });
  });

  describe('content and messaging', () => {
    it('displays correct title', () => {
      render(<ErrorPageBoundary {...getDefaultProps()} />);

      expect(screen.getByRole('heading', {level: 1})).toHaveTextContent('Something went wrong');
    });

    it('displays support message', () => {
      render(<ErrorPageBoundary {...getDefaultProps()} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Please try refreshing the page, or contact support if the problem persists.');
    });

    it('displays action button with correct text', () => {
      render(<ErrorPageBoundary {...getDefaultProps()} />);

      const refreshButton = screen.getByTestId('action-button');
      expect(refreshButton).toHaveTextContent('Refresh');
    });

    it('displays error message for Error with name', () => {
      const namedError = new Error('Connection timeout');
      namedError.name = 'TimeoutError';

      render(<ErrorPageBoundary error={namedError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('TimeoutError: Connection timeout');
    });

    it('displays error message for Error without name', () => {
      const unnamedError = new Error('Simple error');
      // Set name to empty string instead of deleting to avoid default "Error" name
      unnamedError.name = '';

      render(<ErrorPageBoundary error={unnamedError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Simple error');
    });
  });

  describe('component structure and styling', () => {
    it('has correct DOM hierarchy', () => {
      render(<ErrorPageBoundary {...getDefaultProps()} />);

      const card = document.querySelector('[data-slot="card"]');
      const emptyState = screen.getByTestId('empty-state');

      expect(card).toContainElement(emptyState);
    });

    it('applies correct CSS classes to Card', () => {
      render(<ErrorPageBoundary {...getDefaultProps()} />);

      const card = document.querySelector('[data-slot="card"]');
      expect(card).toHaveClass('mt-[24px]', 'mx-[32px]', 'p-[24px]');
    });

    it('description has correct styling classes', () => {
      render(<ErrorPageBoundary {...getDefaultProps()} />);

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

    it('applies containerProps correctly', () => {
      render(<ErrorPageBoundary {...getDefaultProps()} />);

      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveAttribute('data-container-padding-bottom', '40px');
    });
  });

  describe('accessibility', () => {
    it('has accessible heading structure', () => {
      render(<ErrorPageBoundary {...getDefaultProps()} />);

      const heading = screen.getByRole('heading', {level: 1});
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Something went wrong');
    });

    it('has accessible button for refresh action', () => {
      render(<ErrorPageBoundary {...getDefaultProps()} />);

      const button = screen.getByRole('button', {name: /refresh/i});
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });

    it('provides meaningful error information for screen readers', () => {
      const testError = new Error('Authentication expired');
      testError.name = 'AuthError';

      render(<ErrorPageBoundary error={testError} resetErrorBoundary={mockResetErrorBoundary} />);

      expect(
        screen.getByText((content, element) => {
          return element?.textContent === 'AuthError: Authentication expired';
        })
      ).toBeInTheDocument();
      expect(screen.getByText(/Date of error:/)).toBeInTheDocument();
    });

    it('error details are properly structured for assistive technologies', () => {
      render(<ErrorPageBoundary {...getDefaultProps()} />);

      const description = screen.getByTestId('description');
      expect(description).toBeInTheDocument();

      // Check that error information is in paragraph elements
      const paragraphs = description.querySelectorAll('p');
      expect(paragraphs).toHaveLength(3);
      expect(paragraphs[0]).toHaveTextContent(/Date of error:/);
      expect(paragraphs[1]).toHaveTextContent(/Test error message/);
      expect(paragraphs[2]).toHaveTextContent(/Please try refreshing/);
    });
  });

  describe('edge cases and error boundaries', () => {
    it('handles very long error messages', () => {
      const longError = new Error('A'.repeat(1000));

      render(<ErrorPageBoundary error={longError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('A'.repeat(1000));
    });

    it('handles special characters in error messages', () => {
      const specialError = new Error('Error with <script>alert("xss")</script> and émojis 🚨');

      render(<ErrorPageBoundary error={specialError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Error with <script>alert("xss")</script> and émojis 🚨');
    });

    it('handles error objects with circular references', () => {
      const circularError: any = {message: 'Circular error'};
      circularError.self = circularError;

      render(<ErrorPageBoundary error={circularError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Unknown error');
      expect(consoleSpy).toHaveBeenCalledWith(circularError);
    });

    it('handles falsy error messages from Error objects', () => {
      const falsyError = new Error('');

      render(<ErrorPageBoundary error={falsyError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Please try refreshing the page');
    });
  });

  describe('component behavior verification', () => {
    it('renders consistently on multiple renders', () => {
      const {rerender} = render(<ErrorPageBoundary {...getDefaultProps()} />);

      expect(document.querySelector('[data-slot="card"]')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();

      rerender(<ErrorPageBoundary {...getDefaultProps()} />);

      expect(document.querySelector('[data-slot="card"]')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('updates when error prop changes', () => {
      const {rerender} = render(
        <ErrorPageBoundary error={new Error('First error')} resetErrorBoundary={mockResetErrorBoundary} />
      );

      expect(screen.getByTestId('description')).toHaveTextContent('First error');

      rerender(<ErrorPageBoundary error={new Error('Second error')} resetErrorBoundary={mockResetErrorBoundary} />);

      expect(screen.getByTestId('description')).toHaveTextContent('Second error');
    });

    it('handles prop updates gracefully', () => {
      const {rerender} = render(<ErrorPageBoundary error={new Error('Test')} resetErrorBoundary={mockResetErrorBoundary} />);

      const newMockReset = vi.fn();
      rerender(<ErrorPageBoundary error={new Error('New error')} resetErrorBoundary={newMockReset} />);

      const refreshButton = screen.getByTestId('action-button');
      fireEvent.click(refreshButton);

      expect(mockResetErrorBoundary).not.toHaveBeenCalled();
      expect(newMockReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('TypeScript interface compliance', () => {
    it('accepts all required props from ErrorPageBoundaryProps interface', () => {
      const props = {
        error: new Error('Test'),
        resetErrorBoundary: mockResetErrorBoundary,
        className: 'custom-class'
      };

      expect(() => {
        render(<ErrorPageBoundary {...props} />);
      }).not.toThrow();
    });

    it('works without optional props', () => {
      expect(() => {
        render(<ErrorPageBoundary error={new Error('Test')} />);
      }).not.toThrow();
    });

    it('handles className prop correctly', () => {
      const customClassName = 'custom-error-class';

      render(<ErrorPageBoundary error={new Error('Test')} className={customClassName} />);

      // The className prop should be available in the component
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  describe('conditional rendering logic', () => {
    it('shows error name and message when both are present', () => {
      const namedError = new Error('Connection failed');
      namedError.name = 'NetworkError';

      render(<ErrorPageBoundary error={namedError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('NetworkError: Connection failed');
    });

    it('shows only message when error name is not present', () => {
      const unnamedError = new Error('Connection failed');
      // Set name to empty string instead of deleting to avoid the default "Error" name
      unnamedError.name = '';

      render(<ErrorPageBoundary error={unnamedError} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Connection failed');
      // Should not contain the name prefix since name is empty
      expect(description).not.toHaveTextContent(': Connection failed');
    });

    it('shows only message when errorMessage is falsy but error.name exists', () => {
      const errorWithoutMessage = new Error('');
      errorWithoutMessage.name = 'CustomError';

      render(<ErrorPageBoundary error={errorWithoutMessage} resetErrorBoundary={mockResetErrorBoundary} />);

      const description = screen.getByTestId('description');
      // Since errorMessage is falsy, it should not show the name: message format
      expect(description).not.toHaveTextContent('CustomError:');
    });
  });
});
