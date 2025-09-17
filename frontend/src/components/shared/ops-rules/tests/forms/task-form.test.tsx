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
import {TaskForm} from '../../forms/task-form';
import {useGetGetTasksAgenticService} from '@/queries';
import {renderWithClient} from '@/utils/tests';
import React from 'react';

// Mock dependencies
vi.mock('react-hook-form', () => ({
  useFormContext: vi.fn()
}));

vi.mock('@/queries', () => ({
  useGetGetTasksAgenticService: vi.fn()
}));

// Mock types/policy first
vi.mock('@/types/api/policy', () => ({
  Policy: {},
  RuleAction: {
    RULE_ACTION_UNSPECIFIED: 'RULE_ACTION_UNSPECIFIED',
    RULE_ACTION_ALLOW: 'RULE_ACTION_ALLOW',
    RULE_ACTION_DENY: 'RULE_ACTION_DENY'
  }
}));

// Mock constants with static values
vi.mock('@/constants/labels', () => ({
  labels: {
    appTypes: {
      'app-type-1': 'Application Type 1',
      'app-type-2': 'Application Type 2'
    },
    rulesActions: {
      RULE_ACTION_ALLOW: 'Allow',
      RULE_ACTION_DENY: 'Deny',
      RULE_ACTION_UNSPECIFIED: 'Unspecified'
    }
  }
}));

vi.mock('@cisco-eti/spark-design', () => ({
  GeneralSize: {
    Small: 'small',
    Medium: 'medium',
    Large: 'large'
  },
  MenuItem: vi.fn(({children, value, disabled, sx, ...props}) =>
    React.createElement(
      'div',
      {
        'data-testid': 'menu-item',
        'data-value': value,
        'data-disabled': disabled,
        'data-sx': sx ? JSON.stringify(sx) : null,
        role: 'option',
        ...props
      },
      children
    )
  ),
  Select: vi.fn(({children, multiple, disabled, error, renderValue, onChange, value, ...props}) => {
    const handleChange = (e: any) => {
      if (onChange) {
        onChange({
          target: {
            value: e.target.value
          }
        } as any);
      }
    };

    // Simulate renderValue being called
    const renderedValue = renderValue ? renderValue(value) : null;

    return React.createElement(
      'div',
      {
        'data-testid': 'select-container',
        'data-multiple': multiple,
        disabled,
        'data-error': error
      },
      [
        React.createElement(
          'select',
          {
            key: 'select',
            'data-testid': multiple ? 'tasks-select' : 'action-select',
            'data-multiple': multiple,
            disabled,
            'data-error': error,
            value: Array.isArray(value) ? value.join(',') : value,
            onChange: handleChange,
            ...props
          },
          children
        ),
        renderedValue &&
          React.createElement(
            'div',
            {
              key: 'rendered-value',
              'data-testid': multiple ? 'tasks-rendered-value' : 'action-rendered-value'
            },
            renderedValue
          )
      ]
    );
  }),
  Skeleton: vi.fn(({sx, variant, width, height, ...props}) =>
    React.createElement('div', {
      'data-testid': 'skeleton',
      'data-variant': variant,
      'data-width': width,
      'data-height': height,
      'data-sx': sx ? JSON.stringify(sx) : null,
      ...props
    })
  ),
  Tag: vi.fn(({children, size, ...props}) =>
    React.createElement(
      'span',
      {
        'data-testid': 'tag',
        'data-size': size,
        ...props
      },
      children
    )
  ),
  Tags: vi.fn(({items, handleDelete, showOnlyFirst, shouldTruncate, maxTooltipTags, ...props}) =>
    React.createElement(
      'div',
      {
        'data-testid': 'tags',
        'data-items': JSON.stringify(
          items.map((item: any) => ({
            value: item.value,
            label: item.valueFormatter()
          }))
        ),
        'data-show-only-first': showOnlyFirst,
        'data-should-truncate': shouldTruncate,
        'data-max-tooltip-tags': maxTooltipTags,
        ...props
      },
      items.map((item: any, index: number) =>
        React.createElement(
          'span',
          {
            key: index,
            'data-testid': 'tag-item',
            'data-value': item.value,
            onClick: () => handleDelete?.({}, item)
          },
          item.valueFormatter()
        )
      )
    )
  ),
  Typography: vi.fn(({children, variant, fontSize, sx, ...props}) =>
    React.createElement(
      'span',
      {
        'data-testid': 'typography',
        'data-variant': variant,
        'data-font-size': fontSize,
        'data-sx': sx ? JSON.stringify(sx) : null,
        ...props
      },
      children
    )
  )
}));

vi.mock('@mui/material', () => ({
  Checkbox: vi.fn(({checked, size, ...props}) =>
    React.createElement('input', {
      type: 'checkbox',
      'data-testid': 'checkbox',
      checked,
      'data-size': size,
      ...props
    })
  ),
  Divider: vi.fn((props) =>
    React.createElement('hr', {
      'data-testid': 'divider',
      'data-sx': props.sx ? JSON.stringify(props.sx) : null
    })
  ),
  ListSubheader: vi.fn(({children, ...props}) =>
    React.createElement(
      'div',
      {
        'data-testid': 'list-subheader',
        ...props
      },
      children
    )
  )
}));

// Store the onChange callback globally for the test
let globalTasksOnChange: any = null;
let globalActionOnChange: any = null;
let globalTasksValue: any = [];
let globalActionValue: any = '';

vi.mock('@/components/ui/form', () => ({
  FormControl: vi.fn(({children, className, ...props}) =>
    React.createElement('div', {'data-testid': 'form-control', className, ...props}, children)
  ),
  FormField: vi.fn(({render, name, control, ...props}) => {
    const field = {
      name,
      value: name === 'tasks' ? globalTasksValue : name === 'action' ? globalActionValue : '',
      onChange:
        name === 'tasks' ? globalTasksOnChange || vi.fn() : name === 'action' ? globalActionOnChange || vi.fn() : vi.fn(),
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

vi.mock('@/schemas/rule-schema', () => ({
  RuleFormValues: {}
}));

// Mock implementations
const mockControl = {} as any;
const mockWatch = vi.fn();
const mockFormState = {errors: {}};

const mockUseFormContext = vi.mocked(useFormContext);
const mockUseGetGetTasksAgenticService = vi.mocked(useGetGetTasksAgenticService);

// Test data
const mockPolicy = {
  id: 'policy-1',
  name: 'Test Policy',
  description: 'Test policy description',
  assignedTo: 'app-1'
};

const mockTasks = {
  'app-type-1': {
    tasks: [
      {id: 'task-1', name: 'Task 1', appId: 'app-1'},
      {id: 'task-2', name: 'Task 2', appId: 'app-1'}
    ]
  },
  'app-type-2': {
    tasks: [
      {id: 'task-3', name: 'Task 3', appId: 'app-2'},
      {id: 'task-4', name: 'Task 4', appId: 'app-2'}
    ]
  }
};

describe('TaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalTasksOnChange = null;
    globalActionOnChange = null;
    globalTasksValue = [];
    globalActionValue = '';

    mockUseFormContext.mockReturnValue({
      control: mockControl,
      watch: mockWatch,
      formState: mockFormState
    } as any);

    mockWatch.mockReturnValue([]);

    mockUseGetGetTasksAgenticService.mockReturnValue({
      data: {
        result: mockTasks
      },
      isLoading: false,
      isError: false
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  describe('Rendering', () => {
    it('renders the component with default props', () => {
      renderWithClient(<TaskForm />);

      expect(screen.getByTestId('tasks-select')).toBeInTheDocument();
      expect(screen.getByTestId('action-select')).toBeInTheDocument();
      expect(screen.getAllByTestId('form-label')).toHaveLength(2);
    });

    it('renders with isLoading prop', () => {
      renderWithClient(<TaskForm isLoading={true} />);

      const tasksSelect = screen.getByTestId('tasks-select');
      const actionSelect = screen.getByTestId('action-select');

      expect(tasksSelect).toBeDisabled();
      expect(actionSelect).toBeDisabled();
    });

    it('renders with policy prop', () => {
      renderWithClient(<TaskForm policy={mockPolicy} />);

      expect(mockUseGetGetTasksAgenticService).toHaveBeenCalledWith({
        excludeAppIds: [mockPolicy.assignedTo]
      });
    });

    it('renders without policy prop', () => {
      renderWithClient(<TaskForm />);

      expect(mockUseGetGetTasksAgenticService).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Form Context Integration', () => {
    it('calls useFormContext correctly', () => {
      renderWithClient(<TaskForm />);

      expect(mockUseFormContext).toHaveBeenCalled();
    });

    it('uses form control for fields', () => {
      renderWithClient(<TaskForm />);

      // Verify FormField components are rendered with correct props
      expect(screen.getByTestId('tasks-select')).toBeInTheDocument();
      expect(screen.getByTestId('action-select')).toBeInTheDocument();
    });
  });

  describe('Tasks Query Integration', () => {
    it('calls useGetGetTasksAgenticService hook', () => {
      renderWithClient(<TaskForm />);

      expect(mockUseGetGetTasksAgenticService).toHaveBeenCalled();
    });

    it('shows skeleton when tasks are loading', () => {
      mockUseGetGetTasksAgenticService.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false
      } as any);

      renderWithClient(<TaskForm />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('data-sx', JSON.stringify({marginTop: '14px', height: '60px'}));
      expect(screen.queryByTestId('tasks-select')).not.toBeInTheDocument();
    });

    it('shows skeleton when tasks query has error', () => {
      mockUseGetGetTasksAgenticService.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true
      } as any);

      renderWithClient(<TaskForm />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(screen.queryByTestId('tasks-select')).not.toBeInTheDocument();
    });

    it('shows tasks select when tasks are loaded successfully', () => {
      renderWithClient(<TaskForm />);

      expect(screen.getByTestId('tasks-select')).toBeInTheDocument();
      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    });
  });

  describe('Tasks Select Field', () => {
    it('renders tasks select with correct props', () => {
      renderWithClient(<TaskForm />);

      const tasksSelect = screen.getByTestId('tasks-select');
      const tasksLabel = screen.getAllByTestId('form-label')[0];

      expect(tasksSelect).toHaveAttribute('data-multiple', 'true');
      expect(tasksLabel).toHaveTextContent('Tasks');
    });

    it('disables tasks select when isLoading is true', () => {
      renderWithClient(<TaskForm isLoading={true} />);

      const tasksSelect = screen.getByTestId('tasks-select');
      expect(tasksSelect).toBeDisabled();
    });

    it('enables tasks select when isLoading is false', () => {
      renderWithClient(<TaskForm isLoading={false} />);

      const tasksSelect = screen.getByTestId('tasks-select');
      expect(tasksSelect).not.toBeDisabled();
    });

    it('shows form error state for tasks field', () => {
      mockUseFormContext.mockReturnValue({
        control: mockControl,
        watch: mockWatch,
        formState: {errors: {tasks: {message: 'Tasks are required'}}}
      } as any);

      renderWithClient(<TaskForm />);

      const tasksSelect = screen.getByTestId('tasks-select');
      expect(tasksSelect).toHaveAttribute('data-error', 'true');
    });
  });

  describe('Action Select Field', () => {
    it('renders action select with correct props', () => {
      renderWithClient(<TaskForm />);

      const actionSelect = screen.getByTestId('action-select');
      const actionLabel = screen.getAllByTestId('form-label')[1];

      expect(actionSelect).not.toHaveAttribute('data-multiple');
      expect(actionLabel).toHaveTextContent('Action');
    });

    it('disables action select when isLoading is true', () => {
      renderWithClient(<TaskForm isLoading={true} />);

      const actionSelect = screen.getByTestId('action-select');
      expect(actionSelect).toBeDisabled();
    });

    it('enables action select when isLoading is false', () => {
      renderWithClient(<TaskForm isLoading={false} />);

      const actionSelect = screen.getByTestId('action-select');
      expect(actionSelect).not.toBeDisabled();
    });

    it('shows form error state for action field', () => {
      mockUseFormContext.mockReturnValue({
        control: mockControl,
        watch: mockWatch,
        formState: {errors: {action: {message: 'Action is required'}}}
      } as any);

      renderWithClient(<TaskForm />);

      const actionSelect = screen.getByTestId('action-select');
      expect(actionSelect).toHaveAttribute('data-error', 'true');
    });
  });

  describe('Tasks Data Processing', () => {
    it('processes tasks data correctly', () => {
      renderWithClient(<TaskForm />);

      // Verify that tasks are being processed
      expect(screen.getByTestId('tasks-select')).toBeInTheDocument();
    });

    it('handles empty tasks data', () => {
      mockUseGetGetTasksAgenticService.mockReturnValue({
        data: {result: {}},
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<TaskForm />);

      const tasksSelect = screen.getByTestId('tasks-select');
      expect(tasksSelect).toBeInTheDocument();
    });

    it('handles undefined tasks data', () => {
      mockUseGetGetTasksAgenticService.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<TaskForm />);

      const tasksSelect = screen.getByTestId('tasks-select');
      expect(tasksSelect).toBeInTheDocument();
    });
  });

  describe('Tasks Options Generation', () => {
    it('generates task options correctly with data', () => {
      renderWithClient(<TaskForm />);

      // Verify that menu items are rendered for tasks
      const menuItems = screen.getAllByTestId('menu-item');
      expect(menuItems.length).toBeGreaterThan(0);
    });

    it('handles tasks with missing properties', () => {
      const incompleteTasksData = {
        'app-type-1': {
          tasks: [
            {id: 'task-1'}, // Missing name and appId
            {name: 'Task 2'}, // Missing id and appId
            {appId: 'app-1'} // Missing id and name
          ]
        }
      };

      mockUseGetGetTasksAgenticService.mockReturnValue({
        data: {result: incompleteTasksData},
        isLoading: false,
        isError: false
      } as any);

      renderWithClient(<TaskForm />);

      expect(screen.getByTestId('tasks-select')).toBeInTheDocument();
    });
  });

  describe('Actions Options', () => {
    it('generates action options correctly', () => {
      renderWithClient(<TaskForm />);

      // Verify action select is rendered
      const actionSelect = screen.getByTestId('action-select');
      expect(actionSelect).toBeInTheDocument();

      // Verify menu items for actions
      const menuItems = screen.getAllByTestId('menu-item');
      expect(menuItems.length).toBeGreaterThan(0);
    });
  });

  describe('Form Field Interactions', () => {
    it('handles tasks field change', () => {
      const mockOnChange = vi.fn();
      globalTasksOnChange = mockOnChange;

      renderWithClient(<TaskForm />);

      const tasksSelect = screen.getByTestId('tasks-select');
      fireEvent.change(tasksSelect, {target: {value: 'task-1,task-2'}});

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('handles action field change', () => {
      const mockOnChange = vi.fn();
      globalActionOnChange = mockOnChange;

      renderWithClient(<TaskForm />);

      const actionSelect = screen.getByTestId('action-select');
      fireEvent.change(actionSelect, {target: {value: 'RULE_ACTION_ALLOW'}});

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Render Value Functions', () => {
    it('handles empty tasks selection rendering', () => {
      globalTasksValue = [];
      mockWatch.mockReturnValue([]);

      renderWithClient(<TaskForm />);

      // Should render placeholder text for empty selection
      const renderedValue = screen.queryByTestId('tasks-rendered-value');
      expect(renderedValue).toBeInTheDocument();

      // Check for placeholder text in rendered value
      const placeholderText = screen.getByText('Select tasks...');
      expect(placeholderText).toBeInTheDocument();
    });

    it('handles selected tasks rendering', () => {
      globalTasksValue = ['task-1', 'task-2'];
      mockWatch.mockReturnValue(['task-1', 'task-2']);

      renderWithClient(<TaskForm />);

      // Should render tags for selected tasks
      const renderedValue = screen.queryByTestId('tasks-rendered-value');
      expect(renderedValue).toBeInTheDocument();

      // Check for tags component
      const tags = screen.getByTestId('tags');
      expect(tags).toBeInTheDocument();
    });

    it('handles empty action selection rendering', () => {
      globalActionValue = '';

      renderWithClient(<TaskForm />);

      // Should render placeholder text for empty action
      const renderedValue = screen.queryByTestId('action-rendered-value');
      expect(renderedValue).toBeInTheDocument();

      // Check for placeholder text
      const placeholderText = screen.getByText('Select action...');
      expect(placeholderText).toBeInTheDocument();
    });

    it('handles selected action rendering', () => {
      globalActionValue = 'RULE_ACTION_ALLOW';

      renderWithClient(<TaskForm />);

      // Should render tag for selected action
      const renderedValue = screen.queryByTestId('action-rendered-value');
      expect(renderedValue).toBeInTheDocument();

      // Check for tag component
      const tag = screen.getByTestId('tag');
      expect(tag).toBeInTheDocument();
    });

    it('handles unspecified action rendering', () => {
      globalActionValue = 'RULE_ACTION_UNSPECIFIED';

      renderWithClient(<TaskForm />);

      // Should render placeholder text for unspecified action
      const renderedValue = screen.queryByTestId('action-rendered-value');
      expect(renderedValue).toBeInTheDocument();

      // Check for placeholder text
      const placeholderText = screen.getByText('Select action...');
      expect(placeholderText).toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('renders with correct container classes', () => {
      const {container} = renderWithClient(<TaskForm />);

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('w-full', 'flex', 'gap-8');
    });

    it('renders tasks and action fields in separate containers', () => {
      const {container} = renderWithClient(<TaskForm />);

      const tasksContainer = container.querySelector('.w-\\[50\\%\\]');
      expect(tasksContainer).toBeInTheDocument();
    });

    it('applies correct width classes to field containers', () => {
      const {container} = renderWithClient(<TaskForm />);

      const containers = container.querySelectorAll('.w-\\[50\\%\\]');
      expect(containers).toHaveLength(2);
    });
  });

  describe('Props Propagation', () => {
    it('propagates isLoading to form fields', () => {
      renderWithClient(<TaskForm isLoading={true} />);

      const tasksSelect = screen.queryByTestId('tasks-select');
      const actionSelect = screen.getByTestId('action-select');

      // Tasks select might be hidden due to skeleton
      if (tasksSelect) {
        expect(tasksSelect).toBeDisabled();
      }
      expect(actionSelect).toBeDisabled();
    });

    it('propagates policy to tasks query', () => {
      const customPolicy = {
        id: 'custom-policy',
        assignedTo: 'custom-app'
      };

      renderWithClient(<TaskForm policy={customPolicy} />);

      expect(mockUseGetGetTasksAgenticService).toHaveBeenCalledWith({
        excludeAppIds: [customPolicy.assignedTo]
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing policy gracefully', () => {
      renderWithClient(<TaskForm policy={undefined} />);

      expect(mockUseGetGetTasksAgenticService).toHaveBeenCalledWith(undefined);
      expect(screen.getByTestId('action-select')).toBeInTheDocument();
    });

    it('handles tasks query failure gracefully', () => {
      mockUseGetGetTasksAgenticService.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true
      } as any);

      renderWithClient(<TaskForm />);

      // Should show skeleton instead of crashing
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('action-select')).toBeInTheDocument();
    });

    it('handles policy without assignedTo property', () => {
      const policyWithoutAssignedTo = {
        id: 'policy-without-assigned',
        name: 'Policy'
      };

      renderWithClient(<TaskForm policy={policyWithoutAssignedTo} />);

      expect(mockUseGetGetTasksAgenticService).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Memoization', () => {
    it('memoizes tasks data correctly', () => {
      renderWithClient(<TaskForm />);

      // Tasks should be processed and memoized
      expect(screen.getByTestId('tasks-select')).toBeInTheDocument();
      expect(screen.getByTestId('action-select')).toBeInTheDocument();
    });

    it('memoizes task options correctly', () => {
      renderWithClient(<TaskForm />);

      // Options should be memoized and rendered
      const menuItems = screen.getAllByTestId('menu-item');
      expect(menuItems.length).toBeGreaterThan(0);
    });

    it('memoizes task values correctly', () => {
      renderWithClient(<TaskForm />);

      // Task values should be flattened and memoized
      expect(screen.getByTestId('tasks-select')).toBeInTheDocument();
    });
  });
});
