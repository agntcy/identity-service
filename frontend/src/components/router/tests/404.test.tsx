/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, vi, expect, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import NotFound from '../404';

// Suppress uncaught exception warnings in tests
vi.stubGlobal('process', {
  ...process,
  on: vi.fn()
});

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock Spark Design EmptyState
vi.mock('@open-ui-kit/core', () => ({
  EmptyState: vi.fn(({variant, title, description, actionTitle, actionCallback, containerProps, ...props}) => (
    <div
      data-testid="empty-state"
      data-variant={variant}
      data-title={title}
      data-description={description}
      data-action-title={actionTitle}
      data-container-padding-bottom={containerProps?.paddingBottom}
      {...props}
    >
      <h1>{title}</h1>
      <p>{description}</p>
      <button onClick={actionCallback} data-testid="action-button">
        {actionTitle}
      </button>
    </div>
  ))
}));

// Don't mock the Card component - use the real one
// The actual Card component uses data-slot="card"

describe('NotFound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderNotFound = () => {
    return render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );
  };

  describe('component rendering', () => {
    it('renders without crashing', () => {
      renderNotFound();

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      // Check for the specific card element using data-slot
      expect(document.querySelector('[data-slot="card"]')).toBeInTheDocument();
    });

    it('renders Card with correct props', () => {
      renderNotFound();

      // Find the card by its data-slot attribute
      const card = document.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('mt-[24px]', 'mx-[32px]', 'p-[24px]');
    });

    it('renders EmptyState with correct props', () => {
      renderNotFound();

      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveAttribute('data-variant', 'warning');
      expect(emptyState).toHaveAttribute('data-title', '404: Page Not Found');
      expect(emptyState).toHaveAttribute(
        'data-description',
        "Sorry, we can't find the page you're looking for. It might have been removed or renamed, or maybe it never existed."
      );
      expect(emptyState).toHaveAttribute('data-action-title', 'Go Back');
      expect(emptyState).toHaveAttribute('data-container-padding-bottom', '40px');
    });
  });

  describe('content display', () => {
    it('displays correct title', () => {
      renderNotFound();

      expect(screen.getByRole('heading', {level: 1})).toHaveTextContent('404: Page Not Found');
    });

    it('displays correct description', () => {
      renderNotFound();

      const description = screen.getByText(/Sorry, we can't find the page you're looking for/);
      expect(description).toBeInTheDocument();
      expect(description.tagName.toLowerCase()).toBe('p');
    });

    it('displays action button with correct text', () => {
      renderNotFound();

      const actionButton = screen.getByTestId('action-button');
      expect(actionButton).toHaveTextContent('Go Back');
      expect(actionButton.tagName.toLowerCase()).toBe('button');
    });
  });

  describe('navigation functionality', () => {
    it('calls navigate(-1) when action button is clicked', () => {
      renderNotFound();

      const actionButton = screen.getByTestId('action-button');
      fireEvent.click(actionButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('handles multiple clicks correctly', () => {
      renderNotFound();

      const actionButton = screen.getByTestId('action-button');

      fireEvent.click(actionButton);
      fireEvent.click(actionButton);
      fireEvent.click(actionButton);

      expect(mockNavigate).toHaveBeenCalledTimes(3);
      expect(mockNavigate).toHaveBeenNthCalledWith(1, -1);
      expect(mockNavigate).toHaveBeenNthCalledWith(2, -1);
      expect(mockNavigate).toHaveBeenNthCalledWith(3, -1);
    });

    it('does not call navigate on component mount', () => {
      renderNotFound();

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('component structure', () => {
    it('has correct DOM hierarchy', () => {
      renderNotFound();

      const card = document.querySelector('[data-slot="card"]');
      const emptyState = screen.getByTestId('empty-state');

      expect(card).toContainElement(emptyState);
    });

    it('passes correct containerProps to EmptyState', () => {
      renderNotFound();

      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveAttribute('data-container-padding-bottom', '40px');
    });
  });

  describe('accessibility', () => {
    it('has accessible heading structure', () => {
      renderNotFound();

      const heading = screen.getByRole('heading', {level: 1});
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('404: Page Not Found');
    });

    it('has accessible button for navigation', () => {
      renderNotFound();

      const button = screen.getByRole('button', {name: /go back/i});
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });

    it('provides meaningful error message', () => {
      renderNotFound();

      const errorMessage = screen.getByText(/sorry, we can't find the page/i);
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toBeVisible();
    });
  });

  describe('component props and styling', () => {
    it('applies correct CSS classes to Card', () => {
      renderNotFound();

      const card = document.querySelector('[data-slot="card"]');
      expect(card).toHaveClass('mt-[24px]', 'mx-[32px]', 'p-[24px]');
    });

    it('applies correct Card styling classes', () => {
      renderNotFound();

      const card = document.querySelector('[data-slot="card"]');
      expect(card).toHaveClass('flex', 'flex-col', 'rounded-[8px]');
    });

    it('sets EmptyState variant to warning', () => {
      renderNotFound();

      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveAttribute('data-variant', 'warning');
    });
  });

  describe('error handling', () => {
    it('calls navigate and allows errors to propagate', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockNavigate.mockImplementationOnce(() => {
        throw new Error('Navigation error');
      });

      renderNotFound();

      const actionButton = screen.getByTestId('action-button');

      // Click the button - the error will be thrown but caught by React's error boundary
      fireEvent.click(actionButton);

      // Verify navigate was called despite the error
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(-1);

      consoleSpy.mockRestore();
    });

    it('successfully navigates when no errors occur', () => {
      renderNotFound();

      const actionButton = screen.getByTestId('action-button');
      fireEvent.click(actionButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('React component behavior', () => {
    it('is a functional component', () => {
      expect(typeof NotFound).toBe('function');
    });

    it('renders consistently on multiple renders', () => {
      const {rerender} = renderNotFound();

      expect(document.querySelector('[data-slot="card"]')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();

      rerender(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      expect(document.querySelector('[data-slot="card"]')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  describe('text content', () => {
    it('has correct static text content', () => {
      renderNotFound();

      // Title
      expect(screen.getByText('404: Page Not Found')).toBeInTheDocument();

      // Description
      expect(screen.getByText(/Sorry, we can't find the page you're looking for/)).toBeInTheDocument();
      expect(screen.getByText(/It might have been removed or renamed/)).toBeInTheDocument();
      expect(screen.getByText(/or maybe it never existed/)).toBeInTheDocument();

      // Action title
      expect(screen.getByText('Go Back')).toBeInTheDocument();
    });
  });

  describe('integration with real Card component', () => {
    it('renders with actual Card component behavior', () => {
      renderNotFound();

      const card = document.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('flex', 'flex-col', 'rounded-[8px]', 'bg-[#F5F8FD]', 'border-none');
    });

    it('contains EmptyState within Card', () => {
      renderNotFound();

      const card = document.querySelector('[data-slot="card"]');
      const emptyState = screen.getByTestId('empty-state');

      expect(card).toContainElement(emptyState);
    });
  });

  describe('component behavior verification', () => {
    it('renders correct component structure', () => {
      renderNotFound();

      // Verify the main container structure
      const card = document.querySelector('[data-slot="card"]');
      const emptyState = screen.getByTestId('empty-state');

      expect(card).toBeDefined();
      expect(emptyState).toBeDefined();
      expect(card).toContainElement(emptyState);
    });

    it('has proper semantic structure', () => {
      renderNotFound();

      // Check that we have exactly one h1
      const headings = screen.getAllByRole('heading', {level: 1});
      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent('404: Page Not Found');

      // Check that we have exactly one button
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent('Go Back');
    });
  });
});
