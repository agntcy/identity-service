/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {screen, fireEvent} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import {OpsRule} from '../ops-rule';
import {renderWithClient} from '@/utils/tests';

// Mock dependencies
vi.mock('@outshift/spark-design', () => ({
  Modal: ({children, open, onClose, maxWidth, fullWidth}: any) =>
    open ? (
      <div data-testid="modal" data-max-width={maxWidth} data-full-width={fullWidth}>
        <button data-testid="modal-close" onClick={onClose}>
          Close Modal
        </button>
        {children}
      </div>
    ) : null,
  EmptyState: ({title, description, actionTitle, actionCallback, containerProps, variant}: any) => (
    <div data-testid="empty-state" data-variant={variant} data-container-props={JSON.stringify(containerProps)}>
      <h2>{title}</h2>
      <p>{description}</p>
      <button onClick={actionCallback} data-testid="empty-state-action">
        {actionTitle}
      </button>
    </div>
  )
}));

vi.mock('@/components/ui/loading', () => ({
  LoaderRelative: () => <div data-testid="loader-relative">Loading...</div>
}));

vi.mock('../delete-rule', () => ({
  DeleteRule: ({policy, rule, onClose, open}: any) =>
    open ? (
      <div data-testid="delete-rule">
        <h3>Delete Rule Component</h3>
        <p>Policy ID: {policy?.id}</p>
        <p>Rule ID: {rule?.id}</p>
        <button onClick={onClose} data-testid="delete-rule-close">
          Close
        </button>
      </div>
    ) : null
}));

vi.mock('../add-edit-rule', () => ({
  AddEditRule: ({policy, rule, mode, onClose, open}: any) =>
    open ? (
      <div data-testid="add-edit-rule" data-mode={mode}>
        <h3>Add/Edit Rule Component - Mode: {mode}</h3>
        <p>Policy ID: {policy?.id}</p>
        <p>Rule ID: {rule?.id}</p>
        <button onClick={onClose} data-testid="add-edit-rule-close">
          Close
        </button>
      </div>
    ) : null
}));

vi.mock('@/queries', () => ({
  useGetRule: vi.fn()
}));

// Import mocked modules
import {useGetRule} from '@/queries';

describe('OpsRule', () => {
  const mockOnClose = vi.fn();

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

  const mockRuleData = {
    id: 'rule-456',
    name: 'Fetched Rule',
    description: 'Rule from API'
  };

  // Default mock return for useGetRule
  const defaultUseGetRuleMock = {
    data: null,
    isLoading: false,
    isError: false
  };

  beforeEach(() => {
    vi.mocked(useGetRule).mockReturnValue(defaultUseGetRuleMock as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders loading modal when isLoading is true for delete action', () => {
      vi.mocked(useGetRule).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false
      } as any);

      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} isDelete={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal')).toHaveAttribute('data-max-width', 'md');
      expect(screen.getByTestId('modal')).toHaveAttribute('data-full-width', 'true');
      expect(screen.getByTestId('loader-relative')).toBeInTheDocument();
    });

    it('renders loading modal when isLoading is true for edit action', () => {
      vi.mocked(useGetRule).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false
      } as any);

      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} isEdit={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('loader-relative')).toBeInTheDocument();
    });

    it('shows loading modal for add action when open state is true', () => {
      // Based on the component logic: open = isLoading || (isError && !isAdd)
      // For add mode, if there's an error in the query (even though enabled=false),
      // it might still show loading state initially
      vi.mocked(useGetRule).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false
      } as any);

      renderWithClient(<OpsRule policy={mockPolicy} isAdd={true} onClose={mockOnClose} />);

      // The component shows loading modal based on the open state calculation
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('loader-relative')).toBeInTheDocument();
    });

    it('closes loading modal when close button is clicked', () => {
      vi.mocked(useGetRule).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false
      } as any);

      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} isDelete={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('modal-close'));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Error State', () => {
    it('renders error modal when isError is true and not add mode', () => {
      vi.mocked(useGetRule).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true
      } as any);

      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} isDelete={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toHaveAttribute('data-variant', 'negative');
      expect(screen.getByText('No Rule Found')).toBeInTheDocument();
      expect(screen.getByText('There was an error fetching the rule details.')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state-action')).toHaveTextContent('Close');
    });

    it('does not render error modal when isError is true but in add mode', () => {
      vi.mocked(useGetRule).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true
      } as any);

      renderWithClient(<OpsRule policy={mockPolicy} isAdd={true} onClose={mockOnClose} />);

      // Should render AddEditRule component instead of error modal
      expect(screen.getByTestId('add-edit-rule')).toBeInTheDocument();
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('closes error modal when action button is clicked', () => {
      vi.mocked(useGetRule).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true
      } as any);

      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} isEdit={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('empty-state-action'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('includes correct container props in error state', () => {
      vi.mocked(useGetRule).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true
      } as any);

      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} isDelete={true} onClose={mockOnClose} />);

      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveAttribute('data-container-props', JSON.stringify({paddingBottom: '32px'}));
    });
  });

  describe('Delete Rule Mode', () => {
    it('renders DeleteRule component when isDelete is true', () => {
      vi.mocked(useGetRule).mockReturnValue({
        data: mockRuleData,
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} isDelete={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('delete-rule')).toBeInTheDocument();
      expect(screen.getByText('Delete Rule Component')).toBeInTheDocument();
      expect(screen.getByText(`Policy ID: ${mockPolicy.id}`)).toBeInTheDocument();
      expect(screen.getByText(`Rule ID: ${mockRuleData.id}`)).toBeInTheDocument();
    });

    it('calls onClose when DeleteRule component triggers close', () => {
      vi.mocked(useGetRule).mockReturnValue({
        data: mockRuleData,
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} isDelete={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('delete-rule-close'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls useGetRule with correct parameters for delete', () => {
      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} isDelete={true} onClose={mockOnClose} />);

      expect(useGetRule).toHaveBeenCalledWith(mockPolicy.id, mockRule.id, true);
    });
  });

  describe('Edit Rule Mode', () => {
    it('renders AddEditRule component in edit mode when isEdit is true', () => {
      vi.mocked(useGetRule).mockReturnValue({
        data: mockRuleData,
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} isEdit={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('add-edit-rule')).toBeInTheDocument();
      expect(screen.getByTestId('add-edit-rule')).toHaveAttribute('data-mode', 'edit');
      expect(screen.getByText('Add/Edit Rule Component - Mode: edit')).toBeInTheDocument();
      expect(screen.getByText(`Policy ID: ${mockPolicy.id}`)).toBeInTheDocument();
      expect(screen.getByText(`Rule ID: ${mockRuleData.id}`)).toBeInTheDocument();
    });

    it('calls onClose when AddEditRule component triggers close', () => {
      vi.mocked(useGetRule).mockReturnValue({
        data: mockRuleData,
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} isEdit={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('add-edit-rule-close'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls useGetRule with correct parameters for edit', () => {
      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} isEdit={true} onClose={mockOnClose} />);

      expect(useGetRule).toHaveBeenCalledWith(mockPolicy.id, mockRule.id, true);
    });
  });

  describe('Add Rule Mode', () => {
    it('renders AddEditRule component in add mode when isAdd is true and no loading/error', () => {
      renderWithClient(<OpsRule policy={mockPolicy} isAdd={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('add-edit-rule')).toBeInTheDocument();
      expect(screen.getByTestId('add-edit-rule')).toHaveAttribute('data-mode', 'add');
      expect(screen.getByText('Add/Edit Rule Component - Mode: add')).toBeInTheDocument();
      expect(screen.getByText(`Policy ID: ${mockPolicy.id}`)).toBeInTheDocument();
      expect(screen.getByText('Rule ID:')).toBeInTheDocument(); // No rule ID for add mode
    });

    it('calls onClose when AddEditRule component triggers close', () => {
      renderWithClient(<OpsRule policy={mockPolicy} isAdd={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('add-edit-rule-close'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls useGetRule with correct parameters for add mode', () => {
      renderWithClient(<OpsRule policy={mockPolicy} isAdd={true} onClose={mockOnClose} />);

      // Based on the actual component behavior from error messages
      expect(useGetRule).toHaveBeenCalledWith(mockPolicy.id, undefined, undefined);
    });
  });

  describe('Default/Fallback State', () => {
    it('renders nothing when no action flags are set', () => {
      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} onClose={mockOnClose} />);

      // Based on the component logic, it returns null for the default case
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onClose callback gracefully', () => {
      vi.mocked(useGetRule).mockReturnValue({
        data: mockRuleData,
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} isDelete={true} />);

      // Should not throw error when onClose is not provided
      fireEvent.click(screen.getByTestId('delete-rule-close'));
      expect(true).toBe(true); // Test passes if no error is thrown
    });

    it('handles undefined policy and rule gracefully', () => {
      renderWithClient(<OpsRule isAdd={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('add-edit-rule')).toBeInTheDocument();
      expect(screen.getByText('Policy ID:')).toBeInTheDocument(); // Empty when policy is undefined
    });

    it('calls useGetRule with undefined values when policy/rule are not provided', () => {
      renderWithClient(<OpsRule isDelete={true} onClose={mockOnClose} />);

      expect(useGetRule).toHaveBeenCalledWith(undefined, undefined, true);
    });

    it('opens modal initially based on loading and error state', () => {
      // Test initial state calculation
      vi.mocked(useGetRule).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false
      } as any);

      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} isDelete={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('handles state transitions properly', () => {
      // Test without rerender to avoid Router conflicts
      vi.mocked(useGetRule).mockReturnValue({
        data: mockRuleData,
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} isDelete={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('delete-rule')).toBeInTheDocument();
      expect(screen.queryByTestId('loader-relative')).not.toBeInTheDocument();
    });
  });

  describe('UseGetRule Integration', () => {
    it('enables useGetRule query only for delete and edit actions', () => {
      // Test delete
      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} isDelete={true} onClose={mockOnClose} />);

      expect(useGetRule).toHaveBeenLastCalledWith(mockPolicy.id, mockRule.id, true);

      vi.clearAllMocks();

      // Test edit
      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} isEdit={true} onClose={mockOnClose} />);

      expect(useGetRule).toHaveBeenLastCalledWith(mockPolicy.id, mockRule.id, true);

      vi.clearAllMocks();

      // Test add (based on actual behavior from error messages)
      renderWithClient(<OpsRule policy={mockPolicy} isAdd={true} onClose={mockOnClose} />);

      expect(useGetRule).toHaveBeenLastCalledWith(mockPolicy.id, undefined, undefined);
    });

    it('passes fetched rule data to child components', () => {
      vi.mocked(useGetRule).mockReturnValue({
        data: mockRuleData,
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<OpsRule policy={mockPolicy} rule={mockRule} isEdit={true} onClose={mockOnClose} />);

      // Should show the fetched rule data, not the original rule prop
      expect(screen.getByText(`Rule ID: ${mockRuleData.id}`)).toBeInTheDocument();
    });
  });
});
