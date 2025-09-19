/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {describe, it, vi, beforeEach, expect, afterEach} from 'vitest';
import {screen, fireEvent, cleanup} from '@testing-library/react';
import {useFormContext} from 'react-hook-form';
import {RuleForm} from '../../forms/rule-form';
import {useGetDevices} from '@/queries';
import {renderWithClient} from '@/utils/tests';
import React from 'react';

// Mock dependencies
vi.mock('react-hook-form', () => ({
  useFormContext: vi.fn()
}));

vi.mock('@/queries', () => ({
  useGetDevices: vi.fn()
}));

vi.mock('@open-ui-kit/core', () => ({
  Checkbox: vi.fn(({children, disabled, checked, onChange, id, ...props}) =>
    React.createElement('input', {
      type: 'checkbox',
      'data-testid': 'needs-approval-checkbox',
      disabled,
      checked,
      onChange: (e: {target: {checked: any}}) => {
        onChange?.(e.target.checked);
      },
      id,
      ...props
    })
  ),
  IconButton: vi.fn(({children, sx, ...props}) =>
    React.createElement(
      'button',
      {
        'data-testid': 'info-button',
        'data-sx': sx ? JSON.stringify(sx) : null,
        ...props
      },
      children
    )
  ),
  Skeleton: vi.fn(({sx, ...props}) =>
    React.createElement('div', {
      'data-testid': 'skeleton',
      'data-sx': JSON.stringify(sx),
      ...props
    })
  )
}));

// Store the onChange callback globally for the test
let globalOnChange: any = null;

vi.mock('@/components/ui/form', () => ({
  FormControl: vi.fn(({children, ...props}) =>
    React.createElement('div', {'data-testid': 'form-control', ...props}, children)
  ),
  FormField: vi.fn(({render, name, control, ...props}) => {
    const field = {
      name,
      value: name === 'needsApproval' ? false : '',
      onChange: name === 'needsApproval' ? globalOnChange || vi.fn() : vi.fn(),
      ref: vi.fn()
    };
    return render({field});
  }),
  FormItem: vi.fn(({children, className, ...props}) =>
    React.createElement('div', {'data-testid': 'form-item', className, ...props}, children)
  ),
  FormLabel: vi.fn(({children, className, ...props}) =>
    React.createElement('label', {'data-testid': 'form-label', className, ...props}, children)
  )
}));

vi.mock('@/components/ui/input', () => ({
  Input: vi.fn((props) =>
    React.createElement('input', {
      'data-testid': `input-${props.placeholder?.includes('name') ? 'name' : 'description'}`,
      ...props
    })
  )
}));

vi.mock('../../forms/task-form', () => ({
  TaskForm: vi.fn(({isLoading, policy}) =>
    React.createElement('div', {
      'data-testid': 'task-form',
      'data-loading': isLoading,
      'data-policy-id': policy?.id || null
    })
  )
}));

vi.mock('lucide-react', () => ({
  InfoIcon: vi.fn((props) =>
    React.createElement('svg', {
      'data-testid': 'info-icon',
      className: props.className,
      ...props
    })
  )
}));

vi.mock('@/schemas/rule-schema', () => ({
  RuleFormValues: {}
}));

// Fix the policy mock to include RuleAction
vi.mock('@/types/api/policy', () => ({
  Policy: {},
  RuleAction: {
    RULE_ACTION_UNSPECIFIED: 'RULE_ACTION_UNSPECIFIED',
    RULE_ACTION_ALLOW: 'RULE_ACTION_ALLOW',
    RULE_ACTION_DENY: 'RULE_ACTION_DENY'
  }
}));

// Mock constants that depend on RuleAction
vi.mock('@/constants/labels', () => ({
  labels: {
    rulesActions: {
      RULE_ACTION_UNSPECIFIED: 'Unspecified',
      RULE_ACTION_ALLOW: 'Allow',
      RULE_ACTION_DENY: 'Deny'
    }
  }
}));

// Mock implementations
const mockControl = {} as any;

const mockUseFormContext = vi.mocked(useFormContext);
const mockUseGetDevices = vi.mocked(useGetDevices);

// Test data
const mockPolicy = {
  id: 'policy-1',
  name: 'Test Policy',
  description: 'Test policy description'
};

describe('RuleForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalOnChange = null;

    mockUseFormContext.mockReturnValue({
      control: mockControl
    } as any);

    mockUseGetDevices.mockReturnValue({
      data: {
        devices: [
          {id: 'device-1', name: 'Device 1'},
          {id: 'device-2', name: 'Device 2'}
        ]
      },
      isLoading: false,
      isError: false
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup(); // Clean up DOM after each test
  });

  describe('Rendering', () => {
    it('renders the component with default props', () => {
      renderWithClient(<RuleForm />);

      expect(screen.getByTestId('input-name')).toBeInTheDocument();
      expect(screen.getByTestId('input-description')).toBeInTheDocument();
      expect(screen.getByTestId('task-form')).toBeInTheDocument();
      expect(screen.getByTestId('needs-approval-checkbox')).toBeInTheDocument();
      expect(screen.getByTestId('info-button')).toBeInTheDocument();
    });

    it('renders with isLoading prop', () => {
      renderWithClient(<RuleForm isLoading={true} />);

      const nameInput = screen.getByTestId('input-name');
      const descriptionInput = screen.getByTestId('input-description');
      const taskForm = screen.getByTestId('task-form');

      expect(nameInput).toBeDisabled();
      expect(descriptionInput).toBeDisabled();
      expect(taskForm).toHaveAttribute('data-loading', 'true');
    });

    it('renders with policy prop', () => {
      renderWithClient(<RuleForm policy={mockPolicy} />);

      const taskForm = screen.getByTestId('task-form');
      expect(taskForm).toHaveAttribute('data-policy-id', mockPolicy.id);
    });

    it('applies correct CSS classes', () => {
      renderWithClient(<RuleForm />);

      const formItems = screen.getAllByTestId('form-item');
      const formLabels = screen.getAllByTestId('form-label');

      expect(formItems[0]).toHaveClass('w-full');
      expect(formLabels[0]).toHaveClass('form-label');
    });
  });

  describe('Form Context Integration', () => {
    it('calls useFormContext with correct generic type', () => {
      renderWithClient(<RuleForm />);

      expect(mockUseFormContext).toHaveBeenCalled();
    });

    it('passes control to FormField components', () => {
      renderWithClient(<RuleForm />);

      // Verify that FormField components receive the control prop
      // This is implicitly tested through the mock implementation
      expect(screen.getByTestId('input-name')).toBeInTheDocument();
      expect(screen.getByTestId('input-description')).toBeInTheDocument();
      expect(screen.getByTestId('needs-approval-checkbox')).toBeInTheDocument();
    });
  });

  describe('Name and Description Fields', () => {
    it('renders name field with correct props', () => {
      renderWithClient(<RuleForm />);

      const nameInput = screen.getByTestId('input-name');
      const nameLabel = screen.getAllByTestId('form-label')[0];

      expect(nameInput).toHaveAttribute('placeholder', 'Type the name...');
      expect(nameLabel).toHaveTextContent('Name');
    });

    it('renders description field with correct props', () => {
      renderWithClient(<RuleForm />);

      const descriptionInput = screen.getByTestId('input-description');
      const descriptionLabel = screen.getAllByTestId('form-label')[1];

      expect(descriptionInput).toHaveAttribute('placeholder', 'Type the description...');
      expect(descriptionLabel).toHaveTextContent('Description');
    });

    it('disables inputs when isLoading is true', () => {
      renderWithClient(<RuleForm isLoading={true} />);

      const nameInput = screen.getByTestId('input-name');
      const descriptionInput = screen.getByTestId('input-description');

      expect(nameInput).toBeDisabled();
      expect(descriptionInput).toBeDisabled();
    });

    it('enables inputs when isLoading is false', () => {
      renderWithClient(<RuleForm isLoading={false} />);

      const nameInput = screen.getByTestId('input-name');
      const descriptionInput = screen.getByTestId('input-description');

      expect(nameInput).not.toBeDisabled();
      expect(descriptionInput).not.toBeDisabled();
    });
  });

  describe('TaskForm Integration', () => {
    it('passes isLoading prop to TaskForm', () => {
      renderWithClient(<RuleForm isLoading={true} />);

      const taskForm = screen.getByTestId('task-form');
      expect(taskForm).toHaveAttribute('data-loading', 'true');
    });

    it('passes policy prop to TaskForm', () => {
      renderWithClient(<RuleForm policy={mockPolicy} />);

      const taskForm = screen.getByTestId('task-form');
      expect(taskForm).toHaveAttribute('data-policy-id', mockPolicy.id);
    });

    it('renders TaskForm without policy', () => {
      renderWithClient(<RuleForm />);

      const taskForm = screen.getByTestId('task-form');
      expect(taskForm).not.toHaveAttribute('data-policy-id');
    });
  });

  describe('Device Query Integration', () => {
    it('calls useGetDevices hook', () => {
      renderWithClient(<RuleForm />);

      expect(mockUseGetDevices).toHaveBeenCalled();
    });

    it('shows skeleton when devices are loading', () => {
      mockUseGetDevices.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false
      } as any);

      renderWithClient(<RuleForm />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute(
        'data-sx',
        JSON.stringify({
          marginTop: '14px',
          height: '50px',
          width: '50px'
        })
      );

      expect(screen.queryByTestId('needs-approval-checkbox')).not.toBeInTheDocument();
    });

    it('shows skeleton when devices query has error', () => {
      mockUseGetDevices.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true
      } as any);

      renderWithClient(<RuleForm />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toBeInTheDocument();

      expect(screen.queryByTestId('needs-approval-checkbox')).not.toBeInTheDocument();
    });

    it('shows needs approval checkbox when devices are loaded successfully', () => {
      renderWithClient(<RuleForm />);

      expect(screen.getByTestId('needs-approval-checkbox')).toBeInTheDocument();
      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    });
  });

  describe('Needs Approval Checkbox', () => {
    it('renders checkbox with correct props when devices are available', () => {
      renderWithClient(<RuleForm />);

      const checkbox = screen.getByTestId('needs-approval-checkbox');
      const label = screen.getAllByTestId('form-label')[2];

      expect(checkbox).not.toBeDisabled();
      expect(checkbox).toHaveAttribute('id', 'needs-approval-checkbox');
      expect(label).toHaveTextContent('Needs Approval?');
    });

    it('disables checkbox when no devices are available', () => {
      mockUseGetDevices.mockReturnValue({
        data: {
          devices: []
        },
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<RuleForm />);

      const checkbox = screen.getByTestId('needs-approval-checkbox');
      expect(checkbox).toBeDisabled();
    });

    it('disables checkbox when devices data is undefined', () => {
      mockUseGetDevices.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<RuleForm />);

      const checkbox = screen.getByTestId('needs-approval-checkbox');
      expect(checkbox).toBeDisabled();
    });

    it('disables checkbox when devices array is undefined', () => {
      mockUseGetDevices.mockReturnValue({
        data: {
          devices: undefined
        },
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<RuleForm />);

      const checkbox = screen.getByTestId('needs-approval-checkbox');
      expect(checkbox).toBeDisabled();
    });

    it('enables checkbox when devices are available', () => {
      mockUseGetDevices.mockReturnValue({
        data: {
          devices: [{id: 'device-1', name: 'Device 1'}]
        },
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<RuleForm />);

      const checkbox = screen.getByTestId('needs-approval-checkbox');
      expect(checkbox).not.toBeDisabled();
    });

    it('handles checkbox change events', () => {
      const mockOnChange = vi.fn();
      globalOnChange = mockOnChange; // Set the global onChange function

      renderWithClient(<RuleForm />);

      const checkbox = screen.getByTestId('needs-approval-checkbox');
      fireEvent.click(checkbox); // Use click instead of change for better simulation

      expect(mockOnChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Info Icon and Button', () => {
    it('renders info button', () => {
      renderWithClient(<RuleForm />);

      const infoButton = screen.getByTestId('info-button');
      expect(infoButton).toBeInTheDocument();
    });

    it('renders info icon with correct props', () => {
      renderWithClient(<RuleForm />);

      const infoIcon = screen.getByTestId('info-icon');
      expect(infoIcon).toBeInTheDocument();
      expect(infoIcon).toHaveClass('w-4', 'h-4');
    });
  });

  describe('hasDevices Memoization', () => {
    it('calculates hasDevices correctly with devices', () => {
      mockUseGetDevices.mockReturnValue({
        data: {
          devices: [
            {id: 'device-1', name: 'Device 1'},
            {id: 'device-2', name: 'Device 2'}
          ]
        },
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<RuleForm />);

      const checkbox = screen.getByTestId('needs-approval-checkbox');
      expect(checkbox).not.toBeDisabled();
    });

    it('calculates hasDevices correctly without devices', () => {
      mockUseGetDevices.mockReturnValue({
        data: {
          devices: []
        },
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<RuleForm />);

      const checkbox = screen.getByTestId('needs-approval-checkbox');
      expect(checkbox).toBeDisabled();
    });

    it('handles null/undefined data gracefully', () => {
      mockUseGetDevices.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<RuleForm />);

      const checkbox = screen.getByTestId('needs-approval-checkbox');
      expect(checkbox).toBeDisabled();
    });

    it('calculates hasDevices correctly with devices enabled state', () => {
      // Test with devices
      mockUseGetDevices.mockReturnValue({
        data: {
          devices: [{id: 'device-1', name: 'Device 1'}]
        },
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<RuleForm />);

      const checkbox = screen.getByTestId('needs-approval-checkbox');
      expect(checkbox).not.toBeDisabled();
    });

    it('calculates hasDevices correctly with devices disabled state', () => {
      // Test with no devices
      mockUseGetDevices.mockReturnValue({
        data: {
          devices: []
        },
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<RuleForm />);

      const checkbox = screen.getByTestId('needs-approval-checkbox');
      expect(checkbox).toBeDisabled();
    });
  });

  describe('Layout and Structure', () => {
    it('renders with correct container class', () => {
      const {container} = renderWithClient(<RuleForm />);

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('space-y-6', 'w-full');
    });

    it('renders name and description in flex container', () => {
      const {container} = renderWithClient(<RuleForm />);

      const flexContainer = container.querySelector('.w-full.flex.gap-8');
      expect(flexContainer).toBeInTheDocument();
    });

    it('renders checkbox in flex container with proper alignment', () => {
      renderWithClient(<RuleForm />);

      const checkboxFormControls = screen.getAllByTestId('form-control');
      const checkboxContainer = checkboxFormControls[2]; // The third form-control is for the checkbox

      const flexContainer = checkboxContainer.querySelector('.flex.items-center');
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering Logic', () => {
    it('shows skeleton when isLoadingDevices is true', () => {
      mockUseGetDevices.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false
      } as any);

      renderWithClient(<RuleForm />);

      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('needs-approval-checkbox')).not.toBeInTheDocument();
    });

    it('shows skeleton when isErrorDevices is true', () => {
      mockUseGetDevices.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true
      } as any);

      renderWithClient(<RuleForm />);

      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('needs-approval-checkbox')).not.toBeInTheDocument();
    });

    it('shows checkbox when both isLoadingDevices and isErrorDevices are false', () => {
      renderWithClient(<RuleForm />);

      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
      expect(screen.getByTestId('needs-approval-checkbox')).toBeInTheDocument();
    });
  });

  describe('Props Propagation', () => {
    it('propagates isLoading to all relevant components', () => {
      renderWithClient(<RuleForm isLoading={true} />);

      const nameInput = screen.getByTestId('input-name');
      const descriptionInput = screen.getByTestId('input-description');
      const taskForm = screen.getByTestId('task-form');

      expect(nameInput).toBeDisabled();
      expect(descriptionInput).toBeDisabled();
      expect(taskForm).toHaveAttribute('data-loading', 'true');
    });

    it('propagates policy to TaskForm component', () => {
      const customPolicy = {
        id: 'custom-policy',
        name: 'Custom Policy'
      };

      renderWithClient(<RuleForm policy={customPolicy} />);

      const taskForm = screen.getByTestId('task-form');
      expect(taskForm).toHaveAttribute('data-policy-id', customPolicy.id);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing policy gracefully', () => {
      renderWithClient(<RuleForm policy={undefined} />);

      const taskForm = screen.getByTestId('task-form');
      expect(taskForm).not.toHaveAttribute('data-policy-id');
      expect(taskForm).toBeInTheDocument();
    });

    it('handles devices query failure gracefully', () => {
      mockUseGetDevices.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true
      } as any);

      renderWithClient(<RuleForm />);

      // Should show skeleton instead of crashing
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('handles empty devices array', () => {
      mockUseGetDevices.mockReturnValue({
        data: {
          devices: []
        },
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<RuleForm />);

      const checkbox = screen.getByTestId('needs-approval-checkbox');
      expect(checkbox).toBeDisabled();
    });

    it('handles undefined devices property', () => {
      mockUseGetDevices.mockReturnValue({
        data: {},
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<RuleForm />);

      const checkbox = screen.getByTestId('needs-approval-checkbox');
      expect(checkbox).toBeDisabled();
    });
  });
});
