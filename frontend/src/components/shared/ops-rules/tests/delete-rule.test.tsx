/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {screen, fireEvent, waitFor} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import {DeleteRule} from '../delete-rule';
import {renderWithClient} from '@/utils/tests';

// Mock dependencies
vi.mock('@/components/ui/confirm-modal', () => ({
  ConfirmModal: ({open, title, description, confirmButtonText, onCancel, onConfirm, buttonConfirmProps}: any) =>
    open ? (
      <div data-testid="confirm-modal">
        <h2 data-testid="modal-title">{title}</h2>
        <p data-testid="modal-description">{description}</p>
        <button data-testid="cancel-button" onClick={onCancel}>
          Cancel
        </button>
        <button
          data-testid="confirm-button"
          onClick={onConfirm}
          data-loading={buttonConfirmProps?.loading}
          data-loading-position={buttonConfirmProps?.loadingPosition}
          data-color={buttonConfirmProps?.color}
        >
          {confirmButtonText}
        </button>
      </div>
    ) : null
}));

vi.mock('@/hooks', () => ({
  useAnalytics: vi.fn()
}));

vi.mock('@/mutations', () => ({
  useDeleteRule: vi.fn()
}));

vi.mock('@outshift/spark-design', () => ({
  toast: vi.fn()
}));

// Import mocked modules
import {useAnalytics} from '@/hooks';
import {useDeleteRule} from '@/mutations';
import {toast} from '@outshift/spark-design';

describe('DeleteRule', () => {
  const mockOnClose = vi.fn();
  const mockAnalyticsTrack = vi.fn();
  const mockMutate = vi.fn();

  // Mock data
  const mockPolicy = {
    id: 'policy-123',
    name: 'Test Policy',
    description: 'Test policy description'
  };

  const mockRule = {
    id: 'rule-456',
    name: 'Test Rule',
    description: 'Test rule description'
  };

  // Default mock implementations
  const defaultAnalyticsMock = {
    analyticsTrack: mockAnalyticsTrack
  };

  const defaultDeleteRuleMock = {
    mutate: mockMutate,
    isPending: false,
    isError: false,
    error: null
  };

  beforeEach(() => {
    vi.mocked(useAnalytics).mockReturnValue(defaultAnalyticsMock as any);
    vi.mocked(useDeleteRule).mockReturnValue(defaultDeleteRuleMock as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders ConfirmModal when open is true', () => {
      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={mockRule} onClose={mockOnClose} />);

      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Delete Rule');
      expect(screen.getByTestId('modal-description')).toHaveTextContent(
        'Are you sure you want to delete this rule? This action cannot be undone.'
      );
      expect(screen.getByTestId('confirm-button')).toHaveTextContent('Delete');
    });

    it('does not render when open is false', () => {
      renderWithClient(<DeleteRule open={false} policy={mockPolicy} rule={mockRule} onClose={mockOnClose} />);

      expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
    });

    it('renders with correct button props', () => {
      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={mockRule} onClose={mockOnClose} />);

      const confirmButton = screen.getByTestId('confirm-button');
      expect(confirmButton).toHaveAttribute('data-loading', 'false');
      expect(confirmButton).toHaveAttribute('data-loading-position', 'start');
      expect(confirmButton).toHaveAttribute('data-color', 'negative');
    });

    it('shows loading state when mutation is pending', () => {
      vi.mocked(useDeleteRule).mockReturnValue({
        ...defaultDeleteRuleMock,
        isPending: true
      } as any);

      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={mockRule} onClose={mockOnClose} />);

      const confirmButton = screen.getByTestId('confirm-button');
      expect(confirmButton).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when cancel button is clicked', () => {
      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={mockRule} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('cancel-button'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls handleConfirm when confirm button is clicked', () => {
      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={mockRule} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('confirm-button'));

      expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_CONFIRM_DELETE_RULE_POLICY');
      expect(mockMutate).toHaveBeenCalledWith({
        policyId: mockPolicy.id,
        ruleId: mockRule.id
      });
    });

    it('does not call mutate when rule id is missing', () => {
      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={undefined} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('confirm-button'));

      expect(mockAnalyticsTrack).not.toHaveBeenCalled();
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('does not call mutate when policy id is missing', () => {
      renderWithClient(<DeleteRule open={true} policy={undefined} rule={mockRule} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('confirm-button'));

      expect(mockAnalyticsTrack).not.toHaveBeenCalled();
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('does not call mutate when both policy and rule are missing', () => {
      renderWithClient(<DeleteRule open={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('confirm-button'));

      expect(mockAnalyticsTrack).not.toHaveBeenCalled();
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe('Mutation Callbacks', () => {
    it('calls success callback and shows success toast on successful deletion', () => {
      // @ts-expect-error error
      vi.mocked(useDeleteRule).mockImplementation((options: any) => {
        // Simulate calling the success callback
        setTimeout(() => {
          options.callbacks.onSuccess();
        }, 0);

        return {
          ...defaultDeleteRuleMock,
          mutate: vi.fn()
        };
      });

      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={mockRule} onClose={mockOnClose} />);

      // Wait for the success callback to be processed
      return waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Rule deleted successfully',
          description: 'The rule has been deleted.',
          type: 'success'
        });
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('calls error callback and shows error toast on deletion error', () => {
      // @ts-expect-error error
      vi.mocked(useDeleteRule).mockImplementation((options: any) => {
        // Simulate calling the error callback
        setTimeout(() => {
          options.callbacks.onError();
        }, 0);

        return {
          ...defaultDeleteRuleMock,
          mutate: vi.fn()
        };
      });

      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={mockRule} onClose={mockOnClose} />);

      return waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Error deleting rule',
          description: 'There was an error deleting the rule. Please try again.',
          type: 'error'
        });
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Analytics Tracking', () => {
    it('tracks analytics event when confirm is clicked with valid data', () => {
      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={mockRule} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('confirm-button'));

      expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_CONFIRM_DELETE_RULE_POLICY');
    });

    it('does not track analytics when rule is missing', () => {
      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={undefined} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('confirm-button'));

      expect(mockAnalyticsTrack).not.toHaveBeenCalled();
    });

    it('does not track analytics when policy is missing', () => {
      renderWithClient(<DeleteRule open={true} policy={undefined} rule={mockRule} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('confirm-button'));

      expect(mockAnalyticsTrack).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onClose callback gracefully', () => {
      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={mockRule} />);

      // Should not throw error when onClose is not provided
      fireEvent.click(screen.getByTestId('cancel-button'));
      expect(true).toBe(true); // Test passes if no error is thrown
    });

    it('handles missing onClose in success callback gracefully', () => {
      // @ts-expect-error error
      vi.mocked(useDeleteRule).mockImplementation((options: any) => {
        setTimeout(() => {
          options.callbacks.onSuccess();
        }, 0);

        return {
          ...defaultDeleteRuleMock,
          mutate: vi.fn()
        };
      });

      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={mockRule} />);

      return waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Rule deleted successfully',
          description: 'The rule has been deleted.',
          type: 'success'
        });
        // Should not throw error when onClose is not provided
        expect(true).toBe(true);
      });
    });

    it('handles missing onClose in error callback gracefully', () => {
      // @ts-expect-error error
      vi.mocked(useDeleteRule).mockImplementation((options: any) => {
        setTimeout(() => {
          options.callbacks.onError();
        }, 0);

        return {
          ...defaultDeleteRuleMock,
          mutate: vi.fn()
        };
      });

      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={mockRule} />);

      return waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Error deleting rule',
          description: 'There was an error deleting the rule. Please try again.',
          type: 'error'
        });
        // Should not throw error when onClose is not provided
        expect(true).toBe(true);
      });
    });

    it('handles rule with only partial data', () => {
      const partialRule = {id: 'rule-123'}; // Missing name and description

      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={partialRule as any} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('confirm-button'));

      expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_CONFIRM_DELETE_RULE_POLICY');
      expect(mockMutate).toHaveBeenCalledWith({
        policyId: mockPolicy.id,
        ruleId: partialRule.id
      });
    });

    it('handles policy with only partial data', () => {
      const partialPolicy = {id: 'policy-123'}; // Missing name and description

      renderWithClient(<DeleteRule open={true} policy={partialPolicy as any} rule={mockRule} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('confirm-button'));

      expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_CONFIRM_DELETE_RULE_POLICY');
      expect(mockMutate).toHaveBeenCalledWith({
        policyId: partialPolicy.id,
        ruleId: mockRule.id
      });
    });
  });

  describe('UseDeleteRule Hook Integration', () => {
    it('initializes useDeleteRule with correct callbacks', () => {
      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={mockRule} onClose={mockOnClose} />);

      expect(useDeleteRule).toHaveBeenCalledWith({
        callbacks: {
          onSuccess: expect.any(Function),
          onError: expect.any(Function)
        }
      });
    });

    it('passes correct mutation parameters', () => {
      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={mockRule} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('confirm-button'));

      expect(mockMutate).toHaveBeenCalledWith({
        policyId: mockPolicy.id,
        ruleId: mockRule.id
      });
    });

    it('uses isPending state for loading button', () => {
      vi.mocked(useDeleteRule).mockReturnValue({
        ...defaultDeleteRuleMock,
        isPending: true
      } as any);

      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={mockRule} onClose={mockOnClose} />);

      const confirmButton = screen.getByTestId('confirm-button');
      expect(confirmButton).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('Callback Dependencies', () => {
    it('callback works correctly with different rule IDs in separate tests', () => {
      const ruleA = {id: 'rule-A', name: 'Rule A'};

      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={ruleA} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('confirm-button'));
      expect(mockMutate).toHaveBeenCalledWith({
        policyId: mockPolicy.id,
        ruleId: ruleA.id
      });
    });

    it('callback works correctly with different rule IDs - second test', () => {
      const ruleB = {id: 'rule-B', name: 'Rule B'};

      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={ruleB} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('confirm-button'));
      expect(mockMutate).toHaveBeenCalledWith({
        policyId: mockPolicy.id,
        ruleId: ruleB.id
      });
    });

    it('callback works correctly with different policy IDs in separate tests', () => {
      const policyA = {id: 'policy-A', name: 'Policy A'};

      renderWithClient(<DeleteRule open={true} policy={policyA} rule={mockRule} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('confirm-button'));
      expect(mockMutate).toHaveBeenCalledWith({
        policyId: policyA.id,
        ruleId: mockRule.id
      });
    });

    it('callback works correctly with different policy IDs - second test', () => {
      const policyB = {id: 'policy-B', name: 'Policy B'};

      renderWithClient(<DeleteRule open={true} policy={policyB} rule={mockRule} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('confirm-button'));
      expect(mockMutate).toHaveBeenCalledWith({
        policyId: policyB.id,
        ruleId: mockRule.id
      });
    });

    it('maintains callback stability with same props', () => {
      renderWithClient(<DeleteRule open={true} policy={mockPolicy} rule={mockRule} onClose={mockOnClose} />);

      // Multiple clicks should work consistently
      fireEvent.click(screen.getByTestId('confirm-button'));
      expect(mockMutate).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId('confirm-button'));
      expect(mockMutate).toHaveBeenCalledTimes(2);

      // Both calls should have the same parameters
      expect(mockMutate).toHaveBeenNthCalledWith(1, {
        policyId: mockPolicy.id,
        ruleId: mockRule.id
      });
      expect(mockMutate).toHaveBeenNthCalledWith(2, {
        policyId: mockPolicy.id,
        ruleId: mockRule.id
      });
    });
  });
});
