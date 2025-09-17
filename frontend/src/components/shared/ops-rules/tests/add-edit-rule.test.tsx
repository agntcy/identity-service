/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable indent */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {useForm} from 'react-hook-form';
import {AddEditRule} from '../add-edit-rule';
import {useCreateRule, useUpdateRule} from '@/mutations';
import {useAnalytics} from '@/hooks';
import {validateForm} from '@/lib/utils';
import {toast} from '@cisco-eti/spark-design';
import {Policy, Rule, RuleAction} from '@/types/api/policy';

// Mock dependencies
vi.mock('react-hook-form', () => ({
  useForm: vi.fn(),
  useFormContext: vi.fn()
}));

vi.mock('@/mutations', () => ({
  useCreateRule: vi.fn(),
  useUpdateRule: vi.fn()
}));

vi.mock('@/hooks', () => ({
  useAnalytics: vi.fn()
}));

vi.mock('@/lib/utils', () => ({
  validateForm: vi.fn()
}));

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(() => vi.fn())
}));

vi.mock('zod', () => ({
  default: {
    infer: vi.fn()
  },
  z: {
    infer: vi.fn()
  }
}));

vi.mock('@/schemas/rule-schema', () => ({
  RuleSchema: {},
  RuleFormValues: {}
}));

vi.mock('@cisco-eti/spark-design', () => ({
  Button: vi.fn(({children, onClick, type, disabled, loading, variant, sx, loadingPosition, ...props}) =>
    React.createElement(
      'button',
      {
        'data-testid': `button-${variant || 'default'}`,
        onClick,
        type,
        disabled: disabled || loading,
        'data-loading': loading,
        'data-loading-position': loadingPosition,
        'data-sx': JSON.stringify(sx),
        role: 'button',
        ...props
      },
      children
    )
  ),
  Modal: vi.fn(({children, open, onClose, maxWidth, fullWidth, ...props}) =>
    open
      ? React.createElement(
          'div',
          {
            'data-testid': 'modal',
            'data-max-width': maxWidth,
            'data-full-width': fullWidth,
            onClick: (e: React.MouseEvent) => {
              if (e.target === e.currentTarget) {
                onClose?.();
              }
            },
            ...props
          },
          children
        )
      : null
  ),
  ModalTitle: vi.fn(({children, ...props}) => React.createElement('h2', {'data-testid': 'modal-title', ...props}, children)),
  ModalContent: vi.fn(({children, ...props}) =>
    React.createElement('div', {'data-testid': 'modal-content', ...props}, children)
  ),
  ModalActions: vi.fn(({children, ...props}) =>
    React.createElement('div', {'data-testid': 'modal-actions', ...props}, children)
  ),
  toast: vi.fn()
}));

vi.mock('@/components/ui/form', () => ({
  Form: vi.fn(({children, onSubmit, ...props}) =>
    React.createElement(
      'form',
      {
        'data-testid': 'form',
        role: 'form',
        onSubmit: (e: {preventDefault: () => void}) => {
          e.preventDefault();
          // Call the onSubmit prop that Form receives
          if (onSubmit) {
            onSubmit(e);
          }
        },
        ...props
      },
      children
    )
  ),
  FormField: vi.fn(({render, ...props}) => {
    const field = {
      name: props.name,
      value: '',
      onChange: vi.fn(),
      ref: vi.fn()
    };
    return render({field});
  }),
  FormItem: vi.fn(({children, ...props}) => React.createElement('div', props, children)),
  FormLabel: vi.fn(({children, ...props}) => React.createElement('label', props, children)),
  FormControl: vi.fn(({children, ...props}) => React.createElement('div', props, children)),
  FormMessage: vi.fn(({children, ...props}) => React.createElement('div', props, children))
}));

// Mock queries that RuleForm uses
vi.mock('@/queries', () => ({
  useGetDevices: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false
  })),
  useGetTasks: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false
  }))
}));

// Mock the RuleForm component completely
vi.mock('../forms/rule-form', () => ({
  RuleForm: vi.fn(({policy}) => React.createElement('div', {'data-testid': 'rule-form', 'data-policy-id': policy?.id}))
}));

// Mock implementations
const mockFormValues = {
  name: 'Test Rule',
  description: 'Test description',
  needsApproval: false,
  tasks: ['task-1'],
  action: 'GRANT'
};

// Store the onSubmit callback to call it when form is submitted
let storedOnSubmit: any = null;

const mockForm = {
  getValues: vi.fn(() => mockFormValues),
  setError: vi.fn(),
  reset: vi.fn(),
  handleSubmit: vi.fn((onSubmit) => {
    storedOnSubmit = onSubmit;
    return (e: {preventDefault: () => void}) => {
      e?.preventDefault?.();
      // Call the onSubmit function when form is submitted
      onSubmit();
    };
  }),
  formState: {
    isValid: true
  }
};

const mockCreateRule = {
  mutate: vi.fn(),
  isPending: false
};

const mockUpdateRule = {
  mutate: vi.fn(),
  isPending: false
};

const mockAnalyticsTrack = vi.fn();

const mockUseForm = vi.mocked(useForm);
const mockUseCreateRule = vi.mocked(useCreateRule);
const mockUseUpdateRule = vi.mocked(useUpdateRule);
const mockUseAnalytics = vi.mocked(useAnalytics);
const mockValidateForm = vi.mocked(validateForm);
const mockToast = vi.mocked(toast);

// Test data
const mockPolicy: Policy = {
  id: 'policy-1',
  name: 'Test Policy',
  description: 'Test policy description'
} as Policy;

const mockRule: Rule = {
  id: 'rule-1',
  name: 'Test Rule',
  description: 'Test rule description',
  needsApproval: true,
  tasks: [{id: 'task-1', name: 'Test Task'}],
  action: RuleAction.RULE_ACTION_ALLOW
} as Rule;

describe('AddEditRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseForm.mockReturnValue(mockForm as any);
    mockUseCreateRule.mockReturnValue(mockCreateRule as any);
    mockUseUpdateRule.mockReturnValue(mockUpdateRule as any);
    mockUseAnalytics.mockReturnValue({
      analyticsTrack: mockAnalyticsTrack,
      analyticsPage: vi.fn(),
      analyticsIdentify: vi.fn(),
      analyticsReset: vi.fn()
    });
    mockValidateForm.mockReturnValue({success: true});

    // Reset mock form state
    mockForm.formState.isValid = true;
    storedOnSubmit = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component in add mode', () => {
      render(<AddEditRule open={true} policy={mockPolicy} mode="add" />);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Add Rule');
      expect(screen.getByTestId('rule-form')).toBeInTheDocument();
      expect(screen.getByTestId('button-tertariary')).toHaveTextContent('Cancel');
      expect(screen.getByTestId('button-default')).toHaveTextContent('Save');
    });

    it('renders the component in edit mode', () => {
      render(<AddEditRule open={true} policy={mockPolicy} rule={mockRule} mode="edit" />);

      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Rule');
    });

    it('does not render when modal is closed', () => {
      render(<AddEditRule open={false} policy={mockPolicy} />);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('renders with correct modal props', () => {
      render(<AddEditRule open={true} policy={mockPolicy} />);

      const modal = screen.getByTestId('modal');
      expect(modal).toHaveAttribute('data-max-width', 'xl');
      expect(modal).toHaveAttribute('data-full-width', 'true');
    });
  });

  describe('Form Initialization', () => {
    it('initializes form with correct default values', () => {
      render(<AddEditRule open={true} policy={mockPolicy} mode="add" />);

      expect(mockUseForm).toHaveBeenCalledWith({
        resolver: expect.any(Function),
        mode: 'all',
        defaultValues: {
          name: undefined,
          description: undefined,
          needsApproval: false,
          tasks: []
        }
      });
    });

    it('resets form with rule data in edit mode', () => {
      render(<AddEditRule open={true} policy={mockPolicy} rule={mockRule} mode="edit" />);

      expect(mockForm.reset).toHaveBeenCalledWith({
        name: mockRule.name,
        description: mockRule.description,
        needsApproval: mockRule.needsApproval,
        tasks: ['task-1'],
        action: mockRule.action
      });
    });

    it('does not reset form when rule is not provided', () => {
      render(<AddEditRule open={true} policy={mockPolicy} mode="edit" />);

      expect(mockForm.reset).not.toHaveBeenCalled();
    });

    it('handles missing tasks in rule data', () => {
      const ruleWithoutTasks = {...mockRule, tasks: undefined};
      render(<AddEditRule open={true} policy={mockPolicy} rule={ruleWithoutTasks} mode="edit" />);

      expect(mockForm.reset).toHaveBeenCalledWith(
        expect.objectContaining({
          tasks: []
        })
      );
    });
  });

  describe('Form Submission - Add Mode', () => {
    it('submits form to create rule', () => {
      const onClose = vi.fn();
      render(<AddEditRule open={true} policy={mockPolicy} mode="add" onClose={onClose} />);

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      // Manually call the stored onSubmit callback since our mock Form doesn't automatically call it
      if (storedOnSubmit) {
        storedOnSubmit();
      }

      expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_ADD_RULE_POLICY');
      expect(mockCreateRule.mutate).toHaveBeenCalledWith({
        id: mockPolicy.id,
        data: {
          name: mockFormValues.name,
          description: mockFormValues.description,
          needsApproval: mockFormValues.needsApproval,
          tasks: [...mockFormValues.tasks],
          action: mockFormValues.action
        }
      });
    });

    it('handles missing policy id', () => {
      render(<AddEditRule open={true} mode="add" />);

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      // Manually call the stored onSubmit callback
      if (storedOnSubmit) {
        storedOnSubmit();
      }

      expect(mockCreateRule.mutate).toHaveBeenCalledWith({
        id: '',
        data: expect.any(Object)
      });
    });
  });

  describe('Form Submission - Edit Mode', () => {
    it('submits form to update rule', () => {
      render(<AddEditRule open={true} policy={mockPolicy} rule={mockRule} mode="edit" />);

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      // Manually call the stored onSubmit callback
      if (storedOnSubmit) {
        storedOnSubmit();
      }

      expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_EDIT_RULE_POLICY');
      expect(mockUpdateRule.mutate).toHaveBeenCalledWith({
        policyId: mockPolicy.id,
        ruleId: mockRule.id,
        data: {
          name: mockFormValues.name,
          description: mockFormValues.description,
          needsApproval: mockFormValues.needsApproval,
          tasks: [...mockFormValues.tasks],
          action: mockFormValues.action
        }
      });
    });

    it('does not submit when rule id is missing', () => {
      const ruleWithoutId = {...mockRule, id: undefined};
      render(<AddEditRule open={true} policy={mockPolicy} rule={ruleWithoutId} mode="edit" />);

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      // Manually call the stored onSubmit callback
      if (storedOnSubmit) {
        storedOnSubmit();
      }

      expect(mockUpdateRule.mutate).not.toHaveBeenCalled();
    });

    it('does not submit when policy id is missing', () => {
      render(<AddEditRule open={true} rule={mockRule} mode="edit" />);

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      // Manually call the stored onSubmit callback
      if (storedOnSubmit) {
        storedOnSubmit();
      }

      expect(mockUpdateRule.mutate).not.toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('handles validation errors', () => {
      const validationErrors = [
        {path: ['name'], message: 'Name is required'},
        {path: ['description'], message: 'Description is required'}
      ];

      mockValidateForm.mockReturnValue({
        success: false,
        // @ts-expect-error error
        errors: validationErrors
      });

      render(<AddEditRule open={true} policy={mockPolicy} mode="add" />);

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      // Manually call the stored onSubmit callback
      if (storedOnSubmit) {
        storedOnSubmit();
      }

      expect(mockForm.setError).toHaveBeenCalledWith('name', {
        type: 'manual',
        path: ['name'],
        message: 'Name is required'
      });
      expect(mockForm.setError).toHaveBeenCalledWith('description', {
        type: 'manual',
        path: ['description'],
        message: 'Description is required'
      });
      expect(mockCreateRule.mutate).not.toHaveBeenCalled();
    });

    it('proceeds with submission when validation passes', () => {
      mockValidateForm.mockReturnValue({success: true});

      render(<AddEditRule open={true} policy={mockPolicy} mode="add" />);

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      // Manually call the stored onSubmit callback
      if (storedOnSubmit) {
        storedOnSubmit();
      }

      expect(mockCreateRule.mutate).toHaveBeenCalled();
    });
  });

  describe('Mutation Callbacks', () => {
    it('handles create rule success', () => {
      const onClose = vi.fn();

      render(<AddEditRule open={true} policy={mockPolicy} onClose={onClose} />);

      // Get the callbacks passed to useCreateRule
      const createRuleCall = mockUseCreateRule.mock.calls[0];
      // @ts-expect-error error
      const callbacks = createRuleCall[0].callbacks;

      // Simulate success callback
      // @ts-expect-error error
      callbacks.onSuccess();

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Rule created successfully',
        description: 'The rule has been created.',
        type: 'success'
      });
      expect(onClose).toHaveBeenCalled();
    });

    it('handles create rule error', () => {
      const onClose = vi.fn();

      render(<AddEditRule open={true} policy={mockPolicy} onClose={onClose} />);

      // Get the callbacks passed to useCreateRule
      const createRuleCall = mockUseCreateRule.mock.calls[0];
      // @ts-expect-error error
      const callbacks = createRuleCall[0].callbacks;

      // Simulate error callback
      // @ts-expect-error error
      callbacks.onError();

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error creating rule',
        description: 'There was an error creating the rule. Please try again.',
        type: 'error'
      });
      expect(onClose).toHaveBeenCalled();
    });

    it('handles update rule success', () => {
      const onClose = vi.fn();

      render(<AddEditRule open={true} policy={mockPolicy} rule={mockRule} mode="edit" onClose={onClose} />);

      // Get the callbacks passed to useUpdateRule
      const updateRuleCall = mockUseUpdateRule.mock.calls[0];
      // @ts-expect-error error
      const callbacks = updateRuleCall[0].callbacks;

      // Simulate success callback
      // @ts-expect-error error
      callbacks.onSuccess();

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Rule updated successfully',
        description: 'The rule has been updated.',
        type: 'success'
      });
      expect(onClose).toHaveBeenCalled();
    });

    it('handles update rule error', () => {
      const onClose = vi.fn();

      render(<AddEditRule open={true} policy={mockPolicy} rule={mockRule} mode="edit" onClose={onClose} />);

      // Get the callbacks passed to useUpdateRule
      const updateRuleCall = mockUseUpdateRule.mock.calls[0];
      // @ts-expect-error error
      const callbacks = updateRuleCall[0].callbacks;

      // Simulate error callback
      // @ts-expect-error error
      callbacks.onError();

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error updating rule',
        description: 'There was an error updating the rule. Please try again.',
        type: 'error'
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Button States and Interactions', () => {
    it('disables cancel button when create is pending', () => {
      mockUseCreateRule.mockReturnValue({
        ...mockCreateRule,
        isPending: true
      } as any);

      render(<AddEditRule open={true} policy={mockPolicy} />);

      const cancelButton = screen.getByTestId('button-tertariary');
      expect(cancelButton).toBeDisabled();
    });

    it('disables and shows loading on save button when create is pending', () => {
      mockUseCreateRule.mockReturnValue({
        ...mockCreateRule,
        isPending: true
      } as any);

      render(<AddEditRule open={true} policy={mockPolicy} />);

      const saveButton = screen.getByTestId('button-default');
      expect(saveButton).toBeDisabled();
      expect(saveButton).toHaveAttribute('data-loading', 'true');
    });

    it('disables save button when form is invalid', () => {
      mockForm.formState.isValid = false;

      render(<AddEditRule open={true} policy={mockPolicy} />);

      const saveButton = screen.getByTestId('button-default');
      expect(saveButton).toBeDisabled();
    });

    it('calls onClose when cancel button is clicked', () => {
      const onClose = vi.fn();
      render(<AddEditRule open={true} policy={mockPolicy} onClose={onClose} />);

      const cancelButton = screen.getByTestId('button-tertariary');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('applies correct styling to buttons', () => {
      render(<AddEditRule open={true} policy={mockPolicy} />);

      const cancelButton = screen.getByTestId('button-tertariary');
      const saveButton = screen.getByTestId('button-default');

      expect(cancelButton).toHaveAttribute('data-sx', '{"fontWeight":"600 !important"}');
      expect(saveButton).toHaveAttribute('data-sx', '{"fontWeight":"600 !important"}');
    });
  });

  describe('Modal Interactions', () => {
    it('calls onClose when modal backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<AddEditRule open={true} policy={mockPolicy} onClose={onClose} />);

      const modal = screen.getByTestId('modal');
      fireEvent.click(modal);

      expect(onClose).toHaveBeenCalled();
    });

    it('does not call onClose when modal content is clicked', () => {
      const onClose = vi.fn();
      render(<AddEditRule open={true} policy={mockPolicy} onClose={onClose} />);

      const modalContent = screen.getByTestId('modal-content');
      fireEvent.click(modalContent);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Component Integration', () => {
    it('passes policy to RuleForm component', () => {
      render(<AddEditRule open={true} policy={mockPolicy} />);

      const ruleForm = screen.getByTestId('rule-form');
      expect(ruleForm).toHaveAttribute('data-policy-id', mockPolicy.id);
    });

    it('renders form with correct props', () => {
      render(<AddEditRule open={true} policy={mockPolicy} />);

      expect(screen.getByTestId('form')).toBeInTheDocument();
    });
  });

  describe('useEffect Dependencies', () => {
    it('resets form when rule changes', () => {
      const {rerender} = render(<AddEditRule open={true} policy={mockPolicy} rule={mockRule} mode="edit" />);

      // Clear previous calls
      mockForm.reset.mockClear();

      const newRule = {...mockRule, name: 'Updated Rule'};
      rerender(<AddEditRule open={true} policy={mockPolicy} rule={newRule} mode="edit" />);

      expect(mockForm.reset).toHaveBeenCalledWith({
        name: newRule.name,
        description: newRule.description,
        needsApproval: newRule.needsApproval,
        tasks: ['task-1'],
        action: newRule.action
      });
    });

    it('resets form when mode changes', () => {
      const {rerender} = render(<AddEditRule open={true} policy={mockPolicy} rule={mockRule} mode="add" />);

      // Clear previous calls
      mockForm.reset.mockClear();

      rerender(<AddEditRule open={true} policy={mockPolicy} rule={mockRule} mode="edit" />);

      expect(mockForm.reset).toHaveBeenCalledWith({
        name: mockRule.name,
        description: mockRule.description,
        needsApproval: mockRule.needsApproval,
        tasks: ['task-1'],
        action: mockRule.action
      });
    });
  });
});
