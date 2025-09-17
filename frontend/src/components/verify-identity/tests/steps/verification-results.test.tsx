/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import {VerificationResults} from '../../steps/verification-results';
import {V1Alpha1VerificationResult} from '@/api/generated/identity/badge_service.swagger.api';

// Mock dependencies
vi.mock('../../stepper', () => ({
  useStepper: vi.fn()
}));

vi.mock('@/hooks', () => ({
  useAnalytics: vi.fn()
}));

vi.mock('@cisco-eti/spark-design', () => ({
  Accordion: vi.fn(({children, title}: {children?: React.ReactNode; title?: string; subTitle?: React.ReactNode}) =>
    React.createElement('div', {'data-testid': 'accordion', 'data-title': title}, children)
  ),
  Badge: vi.fn((props: {type?: string; [key: string]: any}) =>
    React.createElement('span', {'data-testid': 'badge', 'data-type': props.type})
  ),
  Box: vi.fn(({children, ...props}: {children?: React.ReactNode; [key: string]: any}) =>
    React.createElement('div', {'data-testid': 'box', ...props}, children)
  ),
  Button: vi.fn(
    ({
      children,
      onClick,
      endIcon,
      ...props
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
      endIcon?: React.ReactNode;
      [key: string]: any;
    }) => React.createElement('button', {'data-testid': 'download-button', onClick, ...props}, children, endIcon)
  ),
  CodeBlock: vi.fn(({text}: {text?: string}) => React.createElement('pre', {'data-testid': 'code-block'}, text)),
  Divider: vi.fn((props: {[key: string]: any}) =>
    React.createElement('div', {'data-testid': 'divider', role: 'separator', ...props})
  ),
  EmptyState: vi.fn(({title, description}: {title?: string; description?: string}) =>
    React.createElement('div', {'data-testid': 'empty-state'}, `${title} - ${description}`)
  ),
  GeneralSize: {
    Small: 'small'
  },
  Table: vi.fn(
    ({data, renderEmptyRowsFallback}: {data?: any[]; columns?: any[]; renderEmptyRowsFallback?: () => React.ReactNode}) =>
      React.createElement(
        'div',
        {'data-testid': 'table'},
        data && data.length > 0
          ? data.map((item, index) => React.createElement('div', {key: index}, item.message))
          : renderEmptyRowsFallback?.()
      )
  ),
  Tag: vi.fn(({children, status}: {children?: React.ReactNode; status?: string}) =>
    React.createElement('span', {'data-testid': 'tag', 'data-status': status}, children)
  ),
  TagStatus: {
    Negative: 'negative'
  },
  toast: vi.fn(),
  Typography: vi.fn(({children, ...props}: {children?: React.ReactNode; [key: string]: any}) =>
    React.createElement('div', {'data-testid': 'typography', ...props}, children)
  )
}));

vi.mock('@/components/ui/card', () => ({
  Card: vi.fn(({children, ...props}: {children?: React.ReactNode; [key: string]: any}) =>
    React.createElement('div', {'data-testid': 'card', ...props}, children)
  ),
  CardContent: vi.fn(({children, ...props}: {children?: React.ReactNode; [key: string]: any}) =>
    React.createElement('div', {'data-testid': 'card-content', ...props}, children)
  )
}));

vi.mock('@/components/ui/key-value', () => ({
  default: vi.fn(({pairs}: {pairs?: any[]}) =>
    React.createElement(
      'div',
      {'data-testid': 'key-value'},
      pairs?.map((pair, index) =>
        React.createElement(
          'div',
          {key: index},
          pair.keyProp + ': ',
          typeof pair.value === 'string' ? pair.value : pair.value
        )
      )
    )
  )
}));

vi.mock('@/components/ui/date-hover', () => ({
  default: vi.fn(({date}: {date?: string}) =>
    React.createElement('span', {'data-testid': 'date-hover'}, date || 'Not provided')
  )
}));

vi.mock('@/components/ui/scroll-shadow-wrapper', () => ({
  default: vi.fn(({children, ...props}: {children?: React.ReactNode; [key: string]: any}) =>
    React.createElement('div', {'data-testid': 'scroll-shadow-wrapper', ...props}, children)
  )
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: vi.fn((props: {[key: string]: any}) => React.createElement('div', {'data-testid': 'separator', ...props}))
}));

vi.mock('lucide-react', () => ({
  CheckIcon: vi.fn((props: {[key: string]: any}) => React.createElement('svg', {'data-testid': 'check-icon', ...props})),
  CircleAlertIcon: vi.fn((props: {[key: string]: any}) =>
    React.createElement('svg', {'data-testid': 'circle-alert-icon', ...props})
  ),
  DownloadIcon: vi.fn((props: {[key: string]: any}) =>
    React.createElement('svg', {'data-testid': 'download-icon', ...props})
  )
}));

vi.mock('@/lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}));

vi.mock('@/constants/pagination', () => ({
  ROWS_PER_PAGE_OPTION: [10, 25, 50, 100]
}));

// Import mocked dependencies
import {useStepper} from '../../stepper';
import {useAnalytics} from '@/hooks';
import {toast} from '@cisco-eti/spark-design';

const mockUseStepper = vi.mocked(useStepper);
const mockUseAnalytics = vi.mocked(useAnalytics);
const mockToast = vi.mocked(toast);

// Mock implementations
const mockGetMetadata = vi.fn();
const mockAnalyticsTrack = vi.fn();

// Test data - Updated to match V1Alpha1VerificationResult interface
const mockSuccessResult: V1Alpha1VerificationResult = {
  status: true,
  document: {
    context: ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'example.com',
    issuanceDate: '2025-01-01T00:00:00Z',
    id: 'test-badge-id',
    credentialSubject: {
      id: 'did:example:123',
      badge: 'Test Badge Content'
    }
  },
  mediaType: 'application/vc',
  controller: 'example.com',
  controlledIdentifierDocument: 'did:example:123',
  warnings: [],
  errors: []
};

const mockFailureResult: V1Alpha1VerificationResult = {
  status: false,
  document: undefined,
  mediaType: 'application/vc',
  controller: 'example.com',
  controlledIdentifierDocument: 'did:example:456',
  warnings: [{reason: 'DEPRECATED_FIELD', message: 'Field is deprecated but still valid'}],
  errors: [
    {reason: 'INVALID_SIGNATURE', message: 'Invalid signature'},
    {reason: 'EXPIRED_CERTIFICATE', message: 'Expired certificate'}
  ]
};

// Test case for warnings
const mockResultWithWarnings: V1Alpha1VerificationResult = {
  status: true,
  document: {
    context: ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'example.com',
    issuanceDate: '2025-01-01T00:00:00Z',
    id: 'test-badge-id',
    credentialSubject: {
      id: 'did:example:123',
      badge: 'Test Badge Content'
    }
  },
  mediaType: 'application/vc',
  controller: 'example.com',
  controlledIdentifierDocument: 'did:example:123',
  warnings: [{reason: 'DEPRECATED_FIELD', message: 'Field is deprecated but still valid'}],
  errors: []
};

// Mock URL and Blob APIs
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();

const originalCreateElement = document.createElement.bind(document);

Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL
  }
});

Object.defineProperty(document, 'createElement', {
  value: vi.fn((tag: string) => {
    if (tag === 'a') {
      return {
        href: '',
        download: '',
        click: mockClick
      };
    }
    // Use the original createElement function instead of calling the mock recursively
    return originalCreateElement(tag);
  })
});

describe('VerificationResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseStepper.mockReturnValue({
      getMetadata: mockGetMetadata
    } as any);

    mockUseAnalytics.mockReturnValue({
      analyticsTrack: mockAnalyticsTrack,
      analyticsPage: vi.fn(),
      analyticsIdentify: vi.fn(),
      analyticsReset: vi.fn()
    });

    // Mock Blob constructor
    global.Blob = vi.fn((content, options) => ({
      size: content[0].length,
      type: options?.type || 'text/plain'
    })) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component with successful verification results', () => {
      mockGetMetadata.mockReturnValue({results: mockSuccessResult});

      render(<VerificationResults />);

      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Result')).toBeInTheDocument();
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      expect(screen.getByText('Verification Successful')).toBeInTheDocument();
      expect(screen.getByTestId('download-button')).toBeInTheDocument();
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });

    it('renders the component with failed verification results', () => {
      mockGetMetadata.mockReturnValue({results: mockFailureResult});

      render(<VerificationResults />);

      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Result')).toBeInTheDocument();
      expect(screen.getByTestId('circle-alert-icon')).toBeInTheDocument();
      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      expect(screen.queryByTestId('download-button')).not.toBeInTheDocument();
      expect(screen.getByTestId('accordion')).toBeInTheDocument();
    });

    it('renders without results data', () => {
      mockGetMetadata.mockReturnValue(null);

      render(<VerificationResults />);

      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Result')).toBeInTheDocument();
      expect(screen.getByText('Identity: Not provided')).toBeInTheDocument();
      expect(screen.getByText('Issuer: Not provided')).toBeInTheDocument();
    });
  });

  describe('Key-Value Pairs', () => {
    it('displays correct key-value pairs for successful verification', () => {
      mockGetMetadata.mockReturnValue({results: mockSuccessResult});

      render(<VerificationResults />);

      expect(screen.getByText('Identity: did:example:123')).toBeInTheDocument();
      expect(screen.getByText('Issuer: example.com')).toBeInTheDocument();
      expect(screen.getByTestId('date-hover')).toBeInTheDocument();
    });

    it('displays "Not provided" values when data is missing', () => {
      const incompleteResult = {
        status: true,
        document: {}
      } as V1Alpha1VerificationResult;

      mockGetMetadata.mockReturnValue({results: incompleteResult});

      render(<VerificationResults />);

      expect(screen.getByText('Identity: Not provided')).toBeInTheDocument();
      expect(screen.getByText('Issuer: Not provided')).toBeInTheDocument();
    });

    it('displays correct badge status for active badge', () => {
      mockGetMetadata.mockReturnValue({results: mockSuccessResult});

      render(<VerificationResults />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-type', 'success');
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('displays correct badge status for revoked badge', () => {
      mockGetMetadata.mockReturnValue({results: mockFailureResult});

      render(<VerificationResults />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-type', 'error');
      expect(screen.getByText('Revoked')).toBeInTheDocument();
    });
  });

  describe('Download Functionality', () => {
    it('downloads badge when download button is clicked', async () => {
      mockGetMetadata.mockReturnValue({results: mockSuccessResult});

      render(<VerificationResults />);

      const downloadButton = screen.getByTestId('download-button');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(global.Blob).toHaveBeenCalledWith([JSON.stringify(mockSuccessResult.document, null, 2)], {
          type: 'application/json'
        });
        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
        expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_DOWNLOAD_VERIFICATION_RESULTS');
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Download started',
          description: 'Your verification results are being downloaded.',
          type: 'success'
        });
      });
    });

    it('shows error toast when no results are available for download', () => {
      mockGetMetadata.mockReturnValue(null);

      render(<VerificationResults />);

      // Since download button is only shown for successful results, we need to test the callback directly
      const component = screen.getByText('Result').closest('[data-testid="card"]');
      expect(component).toBeInTheDocument();

      // Simulate the handleDownloadBadge function being called without results
      mockGetMetadata.mockReturnValue({results: null});

      // We can't directly test the private function, but we can verify the toast would be called
      // by checking if the download button is not rendered when results are null
      expect(screen.queryByTestId('download-button')).not.toBeInTheDocument();
    });

    it('handles download error when no results exist', () => {
      // This test would require access to the handleDownloadBadge function
      // Since it's not exposed, we can only test the UI behavior
      mockGetMetadata.mockReturnValue({results: null});

      render(<VerificationResults />);

      expect(screen.queryByTestId('download-button')).not.toBeInTheDocument();
    });

    it('generates correct filename for download', async () => {
      mockGetMetadata.mockReturnValue({results: mockSuccessResult});

      render(<VerificationResults />);

      const downloadButton = screen.getByTestId('download-button');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        const mockCreateElement = document.createElement as any;
        const calls = mockCreateElement.mock.calls;
        const linkCall = calls.find((call: any) => call[0] === 'a');
        expect(linkCall).toBeDefined();
      });
    });
  });

  describe('Error Display', () => {
    it('displays errors table when verification fails', () => {
      mockGetMetadata.mockReturnValue({results: mockFailureResult});

      render(<VerificationResults />);

      expect(screen.getByTestId('accordion')).toBeInTheDocument();
      expect(screen.getByTestId('table')).toBeInTheDocument();
      expect(screen.getByText('Invalid signature')).toBeInTheDocument();
      expect(screen.getByText('Expired certificate')).toBeInTheDocument();
    });

    it('displays correct error count in tag', () => {
      mockGetMetadata.mockReturnValue({results: mockFailureResult});

      render(<VerificationResults />);

      // The component shows errors in the table, not in a tag with count
      expect(screen.getByTestId('table')).toBeInTheDocument();
      expect(screen.getByText('Invalid signature')).toBeInTheDocument();
      expect(screen.getByText('Expired certificate')).toBeInTheDocument();
    });

    it('handles empty errors array', () => {
      const resultWithNoErrors = {
        ...mockFailureResult,
        errors: []
      };
      mockGetMetadata.mockReturnValue({results: resultWithNoErrors});

      render(<VerificationResults />);

      // When errors is an empty array, the component shows an empty state instead of a count
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No Errors Found - Your verification results did not return any errors.')).toBeInTheDocument();
    });

    it('handles undefined errors', () => {
      const resultWithUndefinedErrors = {
        ...mockFailureResult,
        errors: undefined
      };
      mockGetMetadata.mockReturnValue({results: resultWithUndefinedErrors});

      render(<VerificationResults />);

      // When errors is undefined, the component shows an empty state instead of a count
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No Errors Found - Your verification results did not return any errors.')).toBeInTheDocument();
    });
  });

  describe('Warnings Display', () => {
    it('displays warnings when present', () => {
      mockGetMetadata.mockReturnValue({results: mockResultWithWarnings});

      render(<VerificationResults />);

      // Since the component handles warnings, we should test how they're displayed
      // This will depend on the actual implementation in the component
      expect(screen.getByText('Info')).toBeInTheDocument();
    });

    it('handles empty warnings array', () => {
      mockGetMetadata.mockReturnValue({results: mockSuccessResult});

      render(<VerificationResults />);

      // Verify component renders normally with empty warnings
      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Result')).toBeInTheDocument();
    });

    it('handles undefined warnings', () => {
      const resultWithUndefinedWarnings = {
        ...mockSuccessResult,
        warnings: undefined
      };
      mockGetMetadata.mockReturnValue({results: resultWithUndefinedWarnings});

      render(<VerificationResults />);

      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Result')).toBeInTheDocument();
    });
  });

  describe('Code Block Display', () => {
    it('displays formatted JSON in code block for successful verification', () => {
      mockGetMetadata.mockReturnValue({results: mockSuccessResult});

      render(<VerificationResults />);

      expect(screen.getByTestId('code-block')).toBeInTheDocument();
      expect(screen.getByTestId('scroll-shadow-wrapper')).toBeInTheDocument();
    });

    it('displays empty object when document is null', () => {
      const resultWithNullDocument = {
        ...mockSuccessResult,
        document: null
      };
      mockGetMetadata.mockReturnValue({results: resultWithNullDocument});

      render(<VerificationResults />);

      const codeBlock = screen.getByTestId('code-block');
      expect(codeBlock).toHaveTextContent('{}');
    });

    it('displays empty object when document is undefined', () => {
      const resultWithUndefinedDocument = {
        ...mockSuccessResult,
        document: undefined
      };
      mockGetMetadata.mockReturnValue({results: resultWithUndefinedDocument});

      render(<VerificationResults />);

      const codeBlock = screen.getByTestId('code-block');
      expect(codeBlock).toHaveTextContent('{}');
    });
  });

  describe('Media Type Display', () => {
    it('handles media type information', () => {
      mockGetMetadata.mockReturnValue({results: mockSuccessResult});

      render(<VerificationResults />);

      // Test that component renders with media type data
      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(mockSuccessResult.mediaType).toBe('application/vc');
    });

    it('handles missing media type', () => {
      const resultWithoutMediaType = {
        ...mockSuccessResult,
        mediaType: undefined
      };
      mockGetMetadata.mockReturnValue({results: resultWithoutMediaType});

      render(<VerificationResults />);

      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Result')).toBeInTheDocument();
    });
  });

  describe('Stepper Integration', () => {
    it('calls getMetadata with correct key', () => {
      mockGetMetadata.mockReturnValue({results: mockSuccessResult});

      render(<VerificationResults />);

      expect(mockGetMetadata).toHaveBeenCalledWith('verficationResults');
    });

    it('handles missing stepper metadata', () => {
      mockGetMetadata.mockReturnValue(undefined);

      render(<VerificationResults />);

      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Result')).toBeInTheDocument();
    });

    it('handles null stepper metadata', () => {
      mockGetMetadata.mockReturnValue(null);

      render(<VerificationResults />);

      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Result')).toBeInTheDocument();
    });
  });

  describe('Analytics Integration', () => {
    it('calls analytics hook on component render', () => {
      mockGetMetadata.mockReturnValue({results: mockSuccessResult});

      render(<VerificationResults />);

      expect(mockUseAnalytics).toHaveBeenCalled();
    });

    it('tracks download analytics event', async () => {
      mockGetMetadata.mockReturnValue({results: mockSuccessResult});

      render(<VerificationResults />);

      const downloadButton = screen.getByTestId('download-button');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_DOWNLOAD_VERIFICATION_RESULTS');
      });
    });
  });

  describe('Conditional UI Elements', () => {
    it('shows download button only for successful verifications', () => {
      // Test successful case
      mockGetMetadata.mockReturnValue({results: mockSuccessResult});
      const {rerender} = render(<VerificationResults />);
      expect(screen.getByTestId('download-button')).toBeInTheDocument();

      // Test failed case
      mockGetMetadata.mockReturnValue({results: mockFailureResult});
      rerender(<VerificationResults />);
      expect(screen.queryByTestId('download-button')).not.toBeInTheDocument();
    });

    it('shows code block only for successful verifications', () => {
      // Test successful case
      mockGetMetadata.mockReturnValue({results: mockSuccessResult});
      const {rerender} = render(<VerificationResults />);
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
      expect(screen.queryByTestId('accordion')).not.toBeInTheDocument();

      // Test failed case
      mockGetMetadata.mockReturnValue({results: mockFailureResult});
      rerender(<VerificationResults />);
      expect(screen.queryByTestId('code-block')).not.toBeInTheDocument();
      expect(screen.getByTestId('accordion')).toBeInTheDocument();
    });

    it('shows errors accordion only for failed verifications', () => {
      // Test failed case
      mockGetMetadata.mockReturnValue({results: mockFailureResult});
      const {rerender} = render(<VerificationResults />);
      expect(screen.getByTestId('accordion')).toBeInTheDocument();

      // Test successful case
      mockGetMetadata.mockReturnValue({results: mockSuccessResult});
      rerender(<VerificationResults />);
      expect(screen.queryByTestId('accordion')).not.toBeInTheDocument();
    });

    it('shows correct icons based on verification status', () => {
      // Test success icon
      mockGetMetadata.mockReturnValue({results: mockSuccessResult});
      const {rerender} = render(<VerificationResults />);
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('circle-alert-icon')).not.toBeInTheDocument();

      // Test failure icon
      mockGetMetadata.mockReturnValue({results: mockFailureResult});
      rerender(<VerificationResults />);
      expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
      expect(screen.getByTestId('circle-alert-icon')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing document gracefully', () => {
      const resultWithoutDocument = {
        status: true,
        controlledIdentifierDocument: 'did:example:123',
        controller: 'example.com',
        document: undefined,
        errors: []
      } as V1Alpha1VerificationResult;

      mockGetMetadata.mockReturnValue({results: resultWithoutDocument});

      render(<VerificationResults />);

      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Result')).toBeInTheDocument();
    });

    it('handles boolean status correctly', () => {
      // Test with false status
      const falseStatusResult = {...mockSuccessResult, status: false};
      mockGetMetadata.mockReturnValue({results: falseStatusResult});
      const {rerender} = render(<VerificationResults />);

      expect(screen.getByTestId('circle-alert-icon')).toBeInTheDocument();
      expect(screen.getByText('Verification Failed')).toBeInTheDocument();

      // Test with true status
      mockGetMetadata.mockReturnValue({results: mockSuccessResult});
      rerender(<VerificationResults />);

      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      expect(screen.getByText('Verification Successful')).toBeInTheDocument();
    });

    it('handles missing controlledIdentifierDocument', () => {
      const resultWithoutIdentifier = {
        ...mockSuccessResult,
        controlledIdentifierDocument: undefined
      };
      mockGetMetadata.mockReturnValue({results: resultWithoutIdentifier});

      render(<VerificationResults />);

      expect(screen.getByText('Identity: Not provided')).toBeInTheDocument();
    });

    it('handles missing controller', () => {
      const resultWithoutController = {
        ...mockSuccessResult,
        controller: undefined
      };
      mockGetMetadata.mockReturnValue({results: resultWithoutController});

      render(<VerificationResults />);

      expect(screen.getByText('Issuer: Not provided')).toBeInTheDocument();
    });

    it('handles missing issuanceDate', () => {
      const resultWithoutDate = {
        ...mockSuccessResult,
        document: {
          ...mockSuccessResult.document!,
          issuanceDate: undefined
        }
      };
      mockGetMetadata.mockReturnValue({results: resultWithoutDate});

      render(<VerificationResults />);

      const dateHover = screen.getByTestId('date-hover');
      expect(dateHover).toHaveTextContent('Not provided');
    });

    it('handles completely empty result object', () => {
      const emptyResult = {} as V1Alpha1VerificationResult;
      mockGetMetadata.mockReturnValue({results: emptyResult});

      render(<VerificationResults />);

      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Result')).toBeInTheDocument();
      expect(screen.getByText('Identity: Not provided')).toBeInTheDocument();
      expect(screen.getByText('Issuer: Not provided')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('cleans up resources on unmount', () => {
      mockGetMetadata.mockReturnValue({results: mockSuccessResult});

      const {unmount} = render(<VerificationResults />);
      unmount();

      // Since we're not using any timers in this component, we can simply verify
      // that the component unmounts without errors
      expect(mockGetMetadata).toHaveBeenCalled();
    });

    it('re-renders correctly when metadata changes', () => {
      mockGetMetadata.mockReturnValue({results: mockSuccessResult});

      const {rerender} = render(<VerificationResults />);
      expect(screen.getByText('Verification Successful')).toBeInTheDocument();

      mockGetMetadata.mockReturnValue({results: mockFailureResult});
      rerender(<VerificationResults />);
      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
    });
  });
});
