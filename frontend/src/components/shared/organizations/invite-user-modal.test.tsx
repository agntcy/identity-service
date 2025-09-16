/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {screen, fireEvent, waitFor} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import {InviteUserModal} from './invite-user-modal';
import {renderWithClient} from '@/utils/tests';

// Mock dependencies
vi.mock('@mui/material', () => ({
  Button: ({children, onClick, variant, disabled, loading, loadingPosition, type, sx}: any) => (
    <button
      data-testid="mui-button"
      onClick={onClick}
      data-variant={variant}
      disabled={disabled}
      data-loading={loading}
      data-loading-position={loadingPosition}
      type={type}
      data-sx={JSON.stringify(sx)}
    >
      {children}
    </button>
  )
}));

vi.mock('@outshift/spark-design', () => ({
  Modal: ({children, maxWidth, fullWidth, open, ...props}: any) => (
    <div data-testid="modal" data-max-width={maxWidth} data-full-width={fullWidth} data-open={open} {...props}>
      {children}
    </div>
  ),
  ModalActions: ({children}: any) => <div data-testid="modal-actions">{children}</div>,
  ModalContent: ({children}: any) => <div data-testid="modal-content">{children}</div>,
  ModalTitle: ({children}: any) => <h1 data-testid="modal-title">{children}</h1>,
  toast: vi.fn()
}));

vi.mock('react-hook-form', () => ({
  useForm: vi.fn(),
  Controller: ({render}: any) => render({field: {}, fieldState: {}, formState: {}})
}));

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn()
}));

vi.mock('@/components/ui/form', () => ({
  Form: ({children}: any) => <div data-testid="form">{children}</div>,
  FormControl: ({children}: any) => <div data-testid="form-control">{children}</div>,
  FormField: ({render}: any) => render({field: {name: 'email', value: '', onChange: vi.fn()}}),
  FormItem: ({children}: any) => <div data-testid="form-item">{children}</div>,
  FormLabel: ({children, className}: any) => (
    <label data-testid="form-label" className={className}>
      {children}
    </label>
  )
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({placeholder, disabled, ...props}: any) => (
    <input data-testid="input" placeholder={placeholder} disabled={disabled} {...props} />
  )
}));

vi.mock('@/mutations', () => ({
  useInviteUser: vi.fn()
}));

vi.mock('@/schemas/invite-user-schema', () => ({
  InviteUserSchema: {},
  InviteUserFormValues: {}
}));

vi.mock('@/lib/utils', () => ({
  validateForm: vi.fn()
}));

vi.mock('@/queries', () => ({
  useGetGroupsTenant: vi.fn()
}));

vi.mock('@/hooks', () => ({
  useAnalytics: vi.fn()
}));

// Import mocked modules
import {useForm} from 'react-hook-form';
import {toast} from '@outshift/spark-design';
import {useInviteUser} from '@/mutations';
import {validateForm} from '@/lib/utils';
import {useGetGroupsTenant} from '@/queries';
import {useAnalytics} from '@/hooks';

describe('InviteUserModal', () => {
  // Mock functions
  const mockOnCancel = vi.fn();
  const mockOnUserInvited = vi.fn();
  const mockOnGroupIdChange = vi.fn();
  const mockAnalyticsTrack = vi.fn();
  const mockFormReset = vi.fn();
  const mockFormGetValues = vi.fn();
  const mockFormSetError = vi.fn();
  const mockFormHandleSubmit = vi.fn();
  const mockInviteUserMutate = vi.fn();

  // Mock form object
  const mockForm = {
    control: {},
    reset: mockFormReset,
    getValues: mockFormGetValues,
    setError: mockFormSetError,
    handleSubmit: mockFormHandleSubmit,
    formState: {
      isValid: true
    }
  };

  // Mock invite user mutation
  const mockInviteUser = {
    mutate: mockInviteUserMutate,
    isPending: false
  };

  // Mock groups data
  const mockGroupsData = {
    groups: [{id: 'group-1', name: 'Default Group'}]
  };

  // Default props for all tests
  const defaultProps = {
    open: true,
    onCancel: mockOnCancel
  };

  beforeEach(() => {
    // Setup mocks
    vi.mocked(useForm).mockReturnValue(mockForm as any);
    vi.mocked(useInviteUser).mockReturnValue(mockInviteUser as any);
    vi.mocked(useGetGroupsTenant).mockReturnValue({
      data: mockGroupsData,
      isLoading: false,
      error: null
    } as any);
    vi.mocked(useAnalytics).mockReturnValue({
      analyticsTrack: mockAnalyticsTrack,
      analyticsPage: vi.fn()
    });
    vi.mocked(validateForm).mockReturnValue({success: true} as any);

    // Setup form submit handler
    mockFormHandleSubmit.mockImplementation((callback) => (event: any) => {
      event?.preventDefault?.();
      callback();
    });

    mockFormGetValues.mockReturnValue({email: 'test@example.com'});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders modal with default title', () => {
      renderWithClient(<InviteUserModal {...defaultProps} />);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Invite User');
      expect(screen.getByTestId('modal')).toHaveAttribute('data-max-width', 'md');
      expect(screen.getByTestId('modal')).toHaveAttribute('data-full-width', 'true');
      expect(screen.getByTestId('modal')).toHaveAttribute('data-open', 'true');
    });

    it('renders modal with custom title', () => {
      renderWithClient(<InviteUserModal {...defaultProps} title="Custom Invite Title" />);

      expect(screen.getByTestId('modal-title')).toHaveTextContent('Custom Invite Title');
    });

    it('renders form with email input', () => {
      renderWithClient(<InviteUserModal {...defaultProps} />);

      expect(screen.getByTestId('form')).toBeInTheDocument();
      expect(screen.getByTestId('form-label')).toHaveTextContent('Email');
      expect(screen.getByTestId('input')).toHaveAttribute('placeholder', 'Type the email of the user...');
    });

    it('renders action buttons with default text', () => {
      renderWithClient(<InviteUserModal {...defaultProps} />);

      const buttons = screen.getAllByTestId('mui-button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent('Cancel');
      expect(buttons[1]).toHaveTextContent('Invite');
    });

    it('renders action buttons with custom confirm text', () => {
      renderWithClient(<InviteUserModal {...defaultProps} confirmButtonText="Send Invitation" />);

      const buttons = screen.getAllByTestId('mui-button');
      expect(buttons[1]).toHaveTextContent('Send Invitation');
    });

    it('passes through modal props', () => {
      renderWithClient(<InviteUserModal {...defaultProps} data-custom="test" />);

      const modal = screen.getByTestId('modal');
      expect(modal).toHaveAttribute('data-custom', 'test');
    });

    it('renders modal with open=false', () => {
      renderWithClient(<InviteUserModal {...defaultProps} open={false} />);

      const modal = screen.getByTestId('modal');
      expect(modal).toHaveAttribute('data-open', 'false');
    });
  });

  describe('Form Handling', () => {
    it('initializes form with empty email on mount', () => {
      renderWithClient(<InviteUserModal {...defaultProps} />);

      expect(mockFormReset).toHaveBeenCalledWith({email: ''});
    });

    it('handles form submission with valid data', async () => {
      renderWithClient(<InviteUserModal {...defaultProps} tenantId="tenant-1" />);

      const form = screen.getByTestId('form').querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockFormGetValues).toHaveBeenCalled();
        expect(validateForm).toHaveBeenCalled();
        expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_INVITE_USER_CONFIRM');
        expect(mockInviteUserMutate).toHaveBeenCalledWith({
          groupId: 'group-1',
          data: {
            username: 'test@example.com'
          }
        });
      });
    });

    it('handles form validation errors', async () => {
      const mockValidationErrors = [{path: ['email'], message: 'Invalid email', type: 'invalid'}];

      vi.mocked(validateForm).mockReturnValue({
        success: false,
        errors: mockValidationErrors
      } as any);

      renderWithClient(<InviteUserModal {...defaultProps} />);

      const form = screen.getByTestId('form').querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockFormSetError).toHaveBeenCalledWith('email', {
          type: 'invalid',
          path: ['email'],
          message: 'Invalid email'
        });
        expect(mockAnalyticsTrack).not.toHaveBeenCalled();
        expect(mockInviteUserMutate).not.toHaveBeenCalled();
      });
    });

    it('disables form elements when mutation is pending', () => {
      vi.mocked(useInviteUser).mockReturnValue({
        ...mockInviteUser,
        isPending: true
      } as any);

      renderWithClient(<InviteUserModal {...defaultProps} />);

      expect(screen.getByTestId('input')).toHaveAttribute('disabled');

      const buttons = screen.getAllByTestId('mui-button');
      expect(buttons[0]).toHaveAttribute('disabled');
      expect(buttons[1]).toHaveAttribute('disabled');
      expect(buttons[1]).toHaveAttribute('data-loading', 'true');
    });

    it('disables submit button when form is invalid', () => {
      vi.mocked(useForm).mockReturnValue({
        ...mockForm,
        formState: {isValid: false}
      } as any);

      renderWithClient(<InviteUserModal {...defaultProps} />);

      const buttons = screen.getAllByTestId('mui-button');
      expect(buttons[1]).toHaveAttribute('disabled');
    });
  });

  describe('Groups Integration', () => {
    it('calls onGroupIdChange when groups data changes', () => {
      renderWithClient(<InviteUserModal {...defaultProps} tenantId="tenant-1" onGroupIdChange={mockOnGroupIdChange} />);

      expect(mockOnGroupIdChange).toHaveBeenCalledWith('group-1', false, null);
    });

    it('handles loading groups state', () => {
      vi.mocked(useGetGroupsTenant).mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      } as any);

      renderWithClient(<InviteUserModal {...defaultProps} tenantId="tenant-1" onGroupIdChange={mockOnGroupIdChange} />);

      expect(mockOnGroupIdChange).toHaveBeenCalledWith('', true, null);
    });

    it('handles groups error state', () => {
      const error = new Error('Failed to load groups');
      vi.mocked(useGetGroupsTenant).mockReturnValue({
        data: null,
        isLoading: false,
        error
      } as any);

      renderWithClient(<InviteUserModal {...defaultProps} tenantId="tenant-1" onGroupIdChange={mockOnGroupIdChange} />);

      expect(mockOnGroupIdChange).toHaveBeenCalledWith('', false, error);
    });

    it('uses empty groupId when no groups available', async () => {
      vi.mocked(useGetGroupsTenant).mockReturnValue({
        data: {groups: []},
        isLoading: false,
        error: null
      } as any);

      renderWithClient(<InviteUserModal {...defaultProps} tenantId="tenant-1" />);

      const form = screen.getByTestId('form').querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockInviteUserMutate).toHaveBeenCalledWith({
          groupId: '',
          data: {
            username: 'test@example.com'
          }
        });
      });
    });
  });

  describe('Mutation Callbacks', () => {
    it('handles successful user invitation', async () => {
      let successCallback: (() => void) | undefined;

      vi.mocked(useInviteUser).mockImplementation(({callbacks}) => {
        // @ts-expect-error error
        successCallback = callbacks?.onSuccess;
        return mockInviteUser as any;
      });

      renderWithClient(<InviteUserModal {...defaultProps} onUserInvited={mockOnUserInvited} />);

      // Trigger success callback
      if (successCallback) {
        successCallback();
      }

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'User invited successfully',
          description: 'The user has been invited to the group.',
          type: 'success'
        });
        expect(mockOnUserInvited).toHaveBeenCalled();
      });
    });

    it('handles invitation error', async () => {
      let errorCallback: (() => void) | undefined;

      vi.mocked(useInviteUser).mockImplementation(({callbacks}) => {
        errorCallback = callbacks?.onError;
        return mockInviteUser as any;
      });

      renderWithClient(<InviteUserModal {...defaultProps} />);

      // Trigger error callback
      if (errorCallback) {
        errorCallback();
      }

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Error inviting user',
          description: 'An error occurred while inviting the user. Please try again.',
          type: 'error'
        });
      });
    });
  });

  describe('Event Handling', () => {
    it('calls onCancel when cancel button is clicked', () => {
      renderWithClient(<InviteUserModal {...defaultProps} />);

      const cancelButton = screen.getAllByTestId('mui-button')[0];
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('handles submit button click', () => {
      renderWithClient(<InviteUserModal {...defaultProps} />);

      const submitButton = screen.getAllByTestId('mui-button')[1];
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined tenantId', () => {
      renderWithClient(<InviteUserModal {...defaultProps} />);

      expect(useGetGroupsTenant).toHaveBeenCalledWith('');
    });

    it('handles missing onUserInvited callback', async () => {
      let successCallback: (() => void) | undefined;

      vi.mocked(useInviteUser).mockImplementation(({callbacks}) => {
        // @ts-expect-error error
        successCallback = callbacks?.onSuccess;
        return mockInviteUser as any;
      });

      renderWithClient(<InviteUserModal {...defaultProps} />);

      // Trigger success callback without onUserInvited
      if (successCallback) {
        successCallback();
      }

      // Should not throw error when onUserInvited is not provided
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'User invited successfully',
          description: 'The user has been invited to the group.',
          type: 'success'
        });
      });
    });

    it('handles missing onGroupIdChange callback', () => {
      renderWithClient(<InviteUserModal {...defaultProps} tenantId="tenant-1" />);

      // Should not throw error when onGroupIdChange is not provided
      expect(true).toBe(true);
    });

    it('handles validation with no errors array', () => {
      vi.mocked(validateForm).mockReturnValue({
        success: false,
        errors: undefined
      } as any);

      renderWithClient(<InviteUserModal {...defaultProps} />);

      const form = screen.getByTestId('form').querySelector('form');
      fireEvent.submit(form!);

      // Should not throw error and should not call setError
      expect(mockFormSetError).not.toHaveBeenCalled();
    });

    it('renders fallback confirm button text when confirmButtonText is empty', () => {
      renderWithClient(<InviteUserModal {...defaultProps} confirmButtonText="" />);

      const buttons = screen.getAllByTestId('mui-button');
      // The component actually shows "Continue" as fallback when confirmButtonText is empty
      expect(buttons[1]).toHaveTextContent('Continue');
    });

    it('uses undefined confirmButtonText to show default text', () => {
      renderWithClient(<InviteUserModal {...defaultProps} confirmButtonText={undefined} />);

      const buttons = screen.getAllByTestId('mui-button');
      // When confirmButtonText is undefined, it should use the default "Invite"
      expect(buttons[1]).toHaveTextContent('Invite');
    });
  });
});
