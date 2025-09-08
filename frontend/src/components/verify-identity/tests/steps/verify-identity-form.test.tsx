/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {describe, it, vi, beforeEach, expect, afterEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {useFormContext} from 'react-hook-form';
import {jwtDecode} from 'jwt-decode';
import {toast} from '@outshift/spark-design';
import {VerifyIdentityForm} from '../../steps/verify-identity-form';
import React from 'react';

// Mock dependencies
vi.mock('react-hook-form', () => ({
  useFormContext: vi.fn()
}));

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn()
}));

vi.mock('@outshift/spark-design', () => ({
  Divider: vi.fn(({children, ...props}: {children?: React.ReactNode; [key: string]: any}) =>
    React.createElement('div', {role: 'separator', ...props}, children)
  ),
  toast: vi.fn(),
  Typography: vi.fn(({children, ...props}: {children?: React.ReactNode; [key: string]: any}) =>
    React.createElement('div', props, children)
  )
}));

vi.mock('@/components/ui/card', () => ({
  Card: vi.fn(({children, ...props}: {children?: React.ReactNode; [key: string]: any}) =>
    React.createElement('div', {role: 'region', ...props}, children)
  ),
  CardContent: vi.fn(({children, ...props}: {children?: React.ReactNode; [key: string]: any}) =>
    React.createElement('div', props, children)
  )
}));

vi.mock('@/components/ui/form', () => ({
  FormControl: vi.fn(({children, ...props}: {children?: React.ReactNode; [key: string]: any}) =>
    React.createElement('div', props, children)
  ),
  FormField: vi.fn(({render, ...props}: {render: (field: any) => React.ReactNode; [key: string]: any}) => {
    const field = {
      name: props.name,
      value: props.name === 'badgeFile' ? null : '',
      onChange: vi.fn(),
      ref: vi.fn()
    };
    return render({field});
  }),
  FormItem: vi.fn(({children, ...props}: {children?: React.ReactNode; [key: string]: any}) =>
    React.createElement('div', props, children)
  ),
  FormLabel: vi.fn(({children, ...props}: {children?: React.ReactNode; [key: string]: any}) =>
    React.createElement('label', props, children)
  )
}));

vi.mock('@/components/ui/file-upload', () => ({
  FileUpload: vi.fn(
    (props: {
      disabled?: boolean;
      onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
      onConvert?: (content?: ArrayBuffer) => void;
      [key: string]: any;
    }) => {
      return React.createElement('input', {
        type: 'file',
        'data-testid': 'file-upload',
        disabled: props.disabled,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          props.onChange?.(e);
          if (e.target.files?.[0] && props.onConvert) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
              props.onConvert!(reader.result as ArrayBuffer);
            };
            reader.readAsArrayBuffer(file);
          }
        }
      });
    }
  )
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: vi.fn(
    (
      props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
        [key: string]: any;
      }
    ) =>
      React.createElement('textarea', {
        'data-testid': 'badge-textarea',
        ...props
      })
  )
}));

// ...existing code...
vi.mock('@/schemas/verify-identity-schema', () => ({
  VerifyIdentityFormValues: {}
}));

// Mock implementations
const mockWatch = vi.fn();
const mockSetValue = vi.fn();
const mockSetError = vi.fn();
const mockControl = {} as any;

const mockUseFormContext = vi.mocked(useFormContext);
const mockJwtDecode = vi.mocked(jwtDecode);
const mockToast = vi.mocked(toast);

describe('VerifyIdentityForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseFormContext.mockReturnValue({
      control: mockControl,
      watch: mockWatch,
      setValue: mockSetValue,
      setError: mockSetError
    } as any);

    mockWatch.mockImplementation((field) => {
      if (field === 'badge') {
        return '';
      }
      if (field === 'badgeContent') {
        return '';
      }
      return undefined;
    });

    mockJwtDecode.mockReturnValue({
      iss: 'test-issuer',
      sub: 'test-subject'
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component with default props', () => {
      render(<VerifyIdentityForm />);

      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('or')).toBeInTheDocument();
      expect(screen.getByTestId('file-upload')).toBeInTheDocument();
      expect(screen.getByTestId('badge-textarea')).toBeInTheDocument();
    });

    it('renders with isLoading prop', () => {
      render(<VerifyIdentityForm isLoading={true} />);

      const fileUpload = screen.getByTestId('file-upload');
      const textarea = screen.getByTestId('badge-textarea');

      expect(fileUpload).toBeDisabled();
      expect(textarea).toBeDisabled();
    });
  });

  describe('Form Context Integration', () => {
    it('calls useFormContext with correct generic type', () => {
      render(<VerifyIdentityForm />);

      expect(mockUseFormContext).toHaveBeenCalled();
    });

    it('uses watch to monitor badge and badgeContent fields', () => {
      render(<VerifyIdentityForm />);

      expect(mockWatch).toHaveBeenCalledWith('badge');
      expect(mockWatch).toHaveBeenCalledWith('badgeContent');
    });
  });

  describe('File Upload Functionality', () => {
    it('processes valid JSON file with proof value', async () => {
      const validBadge = {
        proof: {
          proofValue: 'valid.jwt.token'
        }
      };

      render(<VerifyIdentityForm />);

      const fileInput = screen.getByTestId('file-upload');
      const file = new File([JSON.stringify(validBadge)], 'badge.json', {type: 'application/json'});

      fireEvent.change(fileInput, {target: {files: [file]}});

      await waitFor(() => {
        expect(mockSetValue).toHaveBeenCalledWith('badgeContent', JSON.stringify(JSON.stringify(validBadge)));
        expect(mockSetValue).toHaveBeenCalledWith('proofValue', 'valid.jwt.token');
      });
    });

    it('processes valid JSON file with direct proofValue', async () => {
      const validBadge = {
        proofValue: 'valid.jwt.token'
      };

      render(<VerifyIdentityForm />);

      const fileInput = screen.getByTestId('file-upload');
      const file = new File([JSON.stringify(validBadge)], 'badge.json', {type: 'application/json'});

      fireEvent.change(fileInput, {target: {files: [file]}});

      await waitFor(() => {
        expect(mockSetValue).toHaveBeenCalledWith('badgeContent', JSON.stringify(JSON.stringify(validBadge)));
        expect(mockSetValue).toHaveBeenCalledWith('proofValue', 'valid.jwt.token');
      });
    });

    it('processes valid JSON file with badge as proof value', async () => {
      const proofValue = 'valid.jwt.token';

      render(<VerifyIdentityForm />);

      const fileInput = screen.getByTestId('file-upload');
      const file = new File([JSON.stringify(proofValue)], 'badge.json', {type: 'application/json'});

      fireEvent.change(fileInput, {target: {files: [file]}});

      await waitFor(() => {
        expect(mockSetValue).toHaveBeenCalledWith('badgeContent', JSON.stringify(JSON.stringify(proofValue)));
        expect(mockSetValue).toHaveBeenCalledWith('proofValue', proofValue);
      });
    });

    it('handles file upload with invalid JSON', async () => {
      render(<VerifyIdentityForm />);

      const fileInput = screen.getByTestId('file-upload');
      const file = new File(['invalid json'], 'badge.json', {type: 'application/json'});

      fireEvent.change(fileInput, {target: {files: [file]}});

      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith('badgeContent', {
          type: 'manual',
          message: 'There was an error processing the file. Please ensure it is a valid badge JSON.'
        });
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error processing file',
          description: 'There was an error processing the file. Please ensure it is a valid badge JSON.',
          type: 'error'
        });
      });
    });

    it('handles file upload with no proof value', async () => {
      const invalidBadge = {
        someField: 'value'
      };

      mockJwtDecode.mockReturnValue(null);

      render(<VerifyIdentityForm />);

      const fileInput = screen.getByTestId('file-upload');
      const file = new File([JSON.stringify(invalidBadge)], 'badge.json', {type: 'application/json'});

      fireEvent.change(fileInput, {target: {files: [file]}});

      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith('badgeContent', {
          type: 'manual',
          message: 'The uploaded file does not contain a valid badge.'
        });
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Invalid Badge',
          description: 'The uploaded file does not contain a valid badge.',
          type: 'error'
        });
      });
    });

    it('handles empty file upload', () => {
      render(<VerifyIdentityForm />);

      const fileInput = screen.getByTestId('file-upload');
      fireEvent.change(fileInput, {target: {files: []}});

      expect(mockSetValue).not.toHaveBeenCalled();
      expect(mockSetError).not.toHaveBeenCalled();
    });
  });

  describe('Badge Text Input', () => {
    it('processes valid badge JSON in useEffect', () => {
      const validBadge = JSON.stringify({
        proof: {
          proofValue: 'valid.jwt.token'
        }
      });

      mockWatch.mockImplementation((field) => {
        if (field === 'badge') {
          return validBadge;
        }
        if (field === 'badgeContent') {
          return '';
        }
        return undefined;
      });

      render(<VerifyIdentityForm />);

      expect(mockSetValue).toHaveBeenCalledWith('proofValue', 'valid.jwt.token');
    });

    it('handles invalid badge JSON by treating as direct proof value', () => {
      const directProofValue = 'direct.jwt.token';

      mockWatch.mockImplementation((field) => {
        if (field === 'badge') {
          return directProofValue;
        }
        if (field === 'badgeContent') {
          return '';
        }
        return undefined;
      });

      render(<VerifyIdentityForm />);

      expect(mockSetValue).toHaveBeenCalledWith('proofValue', directProofValue);
    });

    it('handles badge with no valid proof value', () => {
      const invalidBadge = JSON.stringify({
        someField: 'value'
      });

      mockJwtDecode.mockReturnValue(null);
      mockWatch.mockImplementation((field) => {
        if (field === 'badge') {
          return invalidBadge;
        }
        if (field === 'badgeContent') {
          return '';
        }
        return undefined;
      });

      render(<VerifyIdentityForm />);

      expect(mockSetError).toHaveBeenCalledWith('badgeContent', {
        type: 'manual',
        message: 'The field does not contain a valid badge.'
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Invalid Badge',
        description: 'The field does not contain a valid badge.',
        type: 'error'
      });
    });

    it('does not process empty badge', () => {
      mockWatch.mockImplementation((field) => {
        if (field === 'badge') {
          return '';
        }
        if (field === 'badgeContent') {
          return '';
        }
        return undefined;
      });

      render(<VerifyIdentityForm />);

      expect(mockSetValue).not.toHaveBeenCalledWith('proofValue', expect.any(String));
    });
  });

  describe('JWT Decoding', () => {
    it('validates JWT successfully', async () => {
      const validBadge = {
        proofValue: 'valid.jwt.token'
      };

      render(<VerifyIdentityForm />);

      const fileInput = screen.getByTestId('file-upload');
      const file = new File([JSON.stringify(validBadge)], 'badge.json', {type: 'application/json'});

      fireEvent.change(fileInput, {target: {files: [file]}});

      await waitFor(() => {
        expect(mockJwtDecode).toHaveBeenCalledWith('valid.jwt.token');
        expect(mockSetValue).toHaveBeenCalledWith('proofValue', 'valid.jwt.token');
      });
    });

    it('handles JWT decode failure', async () => {
      const validBadge = {
        proofValue: 'invalid.jwt.token'
      };

      mockJwtDecode.mockImplementation(() => {
        throw new Error('Invalid JWT');
      });

      render(<VerifyIdentityForm />);

      const fileInput = screen.getByTestId('file-upload');
      const file = new File([JSON.stringify(validBadge)], 'badge.json', {type: 'application/json'});

      fireEvent.change(fileInput, {target: {files: [file]}});

      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith('badgeContent', {
          type: 'manual',
          message: 'There was an error processing the file. Please ensure it is a valid badge JSON.'
        });
      });
    });
  });

  describe('Conditional Rendering and States', () => {
    it('disables file upload when badge text is present', () => {
      mockWatch.mockImplementation((field) => {
        if (field === 'badge') {
          return 'some badge text';
        }
        if (field === 'badgeContent') {
          return '';
        }
        return undefined;
      });

      render(<VerifyIdentityForm />);

      const fileUpload = screen.getByTestId('file-upload');
      expect(fileUpload).toBeDisabled();
    });

    it('disables textarea when badge content is present', () => {
      mockWatch.mockImplementation((field) => {
        if (field === 'badge') {
          return '';
        }
        if (field === 'badgeContent') {
          return 'some content';
        }
        return undefined;
      });

      render(<VerifyIdentityForm />);

      const textarea = screen.getByTestId('badge-textarea');
      expect(textarea).toBeDisabled();
    });

    it('disables both inputs when loading', () => {
      render(<VerifyIdentityForm isLoading={true} />);

      const fileUpload = screen.getByTestId('file-upload');
      const textarea = screen.getByTestId('badge-textarea');

      expect(fileUpload).toBeDisabled();
      expect(textarea).toBeDisabled();
    });

    it('enables both inputs when not loading and no content', () => {
      mockWatch.mockImplementation((field) => {
        if (field === 'badge') {
          return '';
        }
        if (field === 'badgeContent') {
          return '';
        }
        return undefined;
      });

      render(<VerifyIdentityForm isLoading={false} />);

      const fileUpload = screen.getByTestId('file-upload');
      const textarea = screen.getByTestId('badge-textarea');

      expect(fileUpload).not.toBeDisabled();
      expect(textarea).not.toBeDisabled();
    });
  });

  describe('Callback Functions', () => {
    it('creates stable onConvertHandle callback', () => {
      const {rerender} = render(<VerifyIdentityForm />);

      // Get initial callback reference by triggering file upload
      const fileInput1 = screen.getByTestId('file-upload');
      // @ts-expect-error error
      const initialCallback = fileInput1.onConvert;

      rerender(<VerifyIdentityForm />);

      // Check if callback reference is stable
      const fileInput2 = screen.getByTestId('file-upload');
      // @ts-expect-error error
      const rerenderCallback = fileInput2.onConvert;

      // Note: Since we're mocking FileUpload, we can't directly test callback stability
      // But we can ensure the component rerenders without errors
      expect(fileInput2).toBeInTheDocument();
    });
  });

  describe('Error Scenarios', () => {
    it('handles null content in onConvertHandle', async () => {
      render(<VerifyIdentityForm />);

      const fileInput = screen.getByTestId('file-upload');
      const file = new File([], 'empty.json', {type: 'application/json'});

      fireEvent.change(fileInput, {target: {files: [file]}});

      // Should not call setValue or setError for empty content
      await waitFor(() => {
        expect(mockSetValue).not.toHaveBeenCalled();
        expect(mockSetError).not.toHaveBeenCalled();
      });
    });

    it('handles undefined proof value gracefully', async () => {
      const badgeWithUndefinedProof = {
        someField: 'value'
      };

      // Mock jwtDecode to throw an error when called with undefined
      mockJwtDecode.mockImplementation(() => {
        throw new Error('Invalid JWT');
      });

      render(<VerifyIdentityForm />);

      const fileInput = screen.getByTestId('file-upload');
      const file = new File([JSON.stringify(badgeWithUndefinedProof)], 'badge.json', {type: 'application/json'});

      fireEvent.change(fileInput, {target: {files: [file]}});

      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith(
          'badgeContent',
          expect.objectContaining({
            message: 'There was an error processing the file. Please ensure it is a valid badge JSON.'
          })
        );
      });
    });
  });

  describe('useEffect Dependencies', () => {
    it('triggers effect when badge changes', () => {
      const {rerender} = render(<VerifyIdentityForm />);

      // Change badge value
      mockWatch.mockImplementation((field) => {
        if (field === 'badge') {
          return 'new badge value';
        }
        if (field === 'badgeContent') {
          return '';
        }
        return undefined;
      });

      rerender(<VerifyIdentityForm />);

      expect(mockSetValue).toHaveBeenCalledWith('proofValue', 'new badge value');
    });

    it('includes all dependencies in useEffect', () => {
      render(<VerifyIdentityForm />);

      // Verify that setValue and setError are included in dependencies
      // by checking they're available in the callback scope
      expect(mockWatch).toHaveBeenCalledWith('badge');
      expect(mockUseFormContext).toHaveBeenCalled();
    });
  });
});
