/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {describe, it, vi, beforeEach, expect} from 'vitest';
import {screen, fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom';
import Devices from './devices';
import {renderWithClient} from '@/utils/tests';
import {PATHS} from '@/router/paths';
import {Device} from '@/types/api/device';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: vi.fn()
  };
});

// Mock hooks
vi.mock('@/hooks', () => ({
  useAnalytics: vi.fn()
}));

// Mock mutations
vi.mock('@/mutations', () => ({
  useAddDevice: vi.fn()
}));

// Mock tanstack react-query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: vi.fn(),
    QueryClient: vi.fn().mockImplementation(() => ({
      invalidateQueries: vi.fn(),
      mount: vi.fn(),
      unmount: vi.fn(),
      clear: vi.fn(),
      getQueryData: vi.fn(),
      setQueryData: vi.fn()
    }))
  };
});

// Mock paths
vi.mock('@/router/paths', () => ({
  PATHS: {
    settings: {
      base: '/settings'
    },
    onboardDevice: {
      base: '/onboard-device'
    }
  }
}));

// Mock components
vi.mock('@/components/layout/base-page', () => ({
  BasePage: ({children, title, subNav, breadcrumbs, rightSideItems}: any) => (
    <div data-testid="base-page">
      <h1 data-testid="page-title">{title}</h1>
      <div data-testid="sub-nav">{JSON.stringify(subNav)}</div>
      <div data-testid="breadcrumbs">{JSON.stringify(breadcrumbs)}</div>
      <div data-testid="right-side-items">{rightSideItems}</div>
      {children}
    </div>
  )
}));

vi.mock('@/components/devices/list-devices', () => ({
  ListDevices: () => <div data-testid="list-devices">List Devices Component</div>
}));

vi.mock('@/components/ui/qr-code-modal', () => ({
  QRCodeModal: ({open, title, subtitle, link, onClose}: any) => (
    <div data-testid="qr-code-modal" data-open={open?.toString()} data-title={title} data-link={link || 'undefined'}>
      <div data-testid="qr-modal-subtitle">{subtitle}</div>
      <button data-testid="qr-modal-close" onClick={onClose}>
        Close
      </button>
    </div>
  )
}));

// Mock Spark Design
vi.mock('@cisco-eti/spark-design', () => ({
  Button: ({children, loading, loadingPosition, onClick, variant, startIcon, fullWidth, sx}: any) => (
    <button
      data-testid="add-device-button"
      data-loading={loading?.toString()}
      data-loading-position={loadingPosition}
      data-variant={variant}
      data-full-width={fullWidth?.toString()}
      data-sx={JSON.stringify(sx)}
      onClick={onClick}
    >
      {startIcon}
      {children}
    </button>
  ),
  toast: vi.fn()
}));

// Mock Lucide React
vi.mock('lucide-react', () => ({
  PlusIcon: ({className}: any) => (
    <span data-testid="plus-icon" className={className}>
      +
    </span>
  )
}));

const mockUseOutletContext = vi.mocked(await import('react-router-dom')).useOutletContext;
const mockUseAnalytics = vi.mocked(await import('@/hooks')).useAnalytics;
const mockUseAddDevice = vi.mocked(await import('@/mutations')).useAddDevice;
const mockUseQueryClient = vi.mocked(await import('@tanstack/react-query')).useQueryClient;
const mockToast = vi.mocked(await import('@cisco-eti/spark-design')).toast;

describe('Devices', () => {
  const mockSubNav = [
    {label: 'Devices', href: '/settings/devices'},
    {label: 'Users', href: '/settings/users'}
  ];

  const mockDevice: Device = {
    id: 'device-123',
    name: 'Test Device',
    createdAt: '2024-01-01T00:00:00.000Z'
  };

  const mockAnalyticsTrack = vi.fn();
  const mockMutate = vi.fn();
  const mockInvalidateQueries = vi.fn();
  const mockQueryClient = {invalidateQueries: mockInvalidateQueries};

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://test.example.com'
      },
      writable: true
    });

    mockUseOutletContext.mockReturnValue({
      subNav: mockSubNav
    });

    mockUseAnalytics.mockReturnValue({
      analyticsTrack: mockAnalyticsTrack,
      analyticsPage: vi.fn(),
      analyticsIdentify: vi.fn(),
      analyticsReset: vi.fn()
    });

    mockUseAddDevice.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isLoading: false,
      isSuccess: false,
      isError: false,
      status: 'idle',
      data: undefined,
      error: null,
      variables: undefined,
      reset: vi.fn(),
      failureCount: 0,
      failureReason: null,
      context: undefined
    } as unknown as import('@tanstack/react-query').UseMutationResult<any, Error, any, unknown>);

    mockUseQueryClient.mockReturnValue(mockQueryClient as any);
  });

  it('renders without crashing', () => {
    renderWithClient(<Devices />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('base-page')).toBeInTheDocument();
    expect(screen.getByTestId('page-title')).toHaveTextContent('Devices');
  });

  it('renders with correct props passed to BasePage', () => {
    renderWithClient(<Devices />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('page-title')).toHaveTextContent('Devices');

    const subNav = screen.getByTestId('sub-nav');
    expect(subNav).toHaveTextContent(JSON.stringify(mockSubNav));

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs).toHaveTextContent('"text":"Settings"');
    expect(breadcrumbs).toHaveTextContent('"link":"/settings"');
    expect(breadcrumbs).toHaveTextContent('"text":"Devices"');
  });

  it('renders correct breadcrumbs structure', () => {
    renderWithClient(<Devices />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbsText = screen.getByTestId('breadcrumbs').textContent;
    const breadcrumbs = JSON.parse(breadcrumbsText || '[]');

    expect(breadcrumbs).toHaveLength(2);
    expect(breadcrumbs[0]).toEqual({
      text: 'Settings',
      link: '/settings'
    });
    expect(breadcrumbs[1]).toEqual({
      text: 'Devices'
    });
  });

  it('renders Add Device button with correct props', () => {
    renderWithClient(<Devices />, {initialEntries: [PATHS.settings.base]});

    const addButton = screen.getByTestId('add-device-button');
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent('Add Device');
    expect(addButton).toHaveAttribute('data-loading', 'false');
    expect(addButton).toHaveAttribute('data-loading-position', 'start');
    expect(addButton).toHaveAttribute('data-variant', 'outlined');
    expect(addButton).toHaveAttribute('data-full-width', 'true');

    const plusIcon = screen.getByTestId('plus-icon');
    expect(plusIcon).toHaveClass('w-4', 'h-4');
  });

  it('renders Add Device button in loading state when mutation is pending', () => {
    mockUseAddDevice.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isLoading: true,
      isSuccess: false,
      isError: false,
      status: 'pending',
      data: undefined,
      error: null,
      variables: undefined,
      reset: vi.fn(),
      failureCount: 0,
      failureReason: null,
      context: undefined
    } as unknown as import('@tanstack/react-query').UseMutationResult<any, Error, any, unknown>);

    renderWithClient(<Devices />, {initialEntries: [PATHS.settings.base]});

    const addButton = screen.getByTestId('add-device-button');
    expect(addButton).toHaveAttribute('data-loading', 'true');
  });

  it('renders ListDevices component', () => {
    renderWithClient(<Devices />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('list-devices')).toBeInTheDocument();
    expect(screen.getByTestId('list-devices')).toHaveTextContent('List Devices Component');
  });

  it('renders QRCodeModal with initial state', () => {
    renderWithClient(<Devices />, {initialEntries: [PATHS.settings.base]});

    const qrModal = screen.getByTestId('qr-code-modal');
    expect(qrModal).toBeInTheDocument();
    expect(qrModal).toHaveAttribute('data-open', 'false');
    expect(qrModal).toHaveAttribute('data-title', 'Onboard Device');
    expect(qrModal).toHaveAttribute('data-link', 'undefined');

    const subtitle = screen.getByTestId('qr-modal-subtitle');
    expect(subtitle).toHaveTextContent('Scan the QR code below with your device to register it to your account.');
  });

  it('handles QR modal close and resets state', async () => {
    renderWithClient(<Devices />, {initialEntries: [PATHS.settings.base]});

    // First, trigger a successful device addition to open the modal
    const useAddDeviceCall = mockUseAddDevice.mock.calls[0][0];
    const successCallback = useAddDeviceCall.callbacks?.onSuccess;

    const mockSuccessResponse = {
      data: mockDevice,
      status: 201,
      statusText: 'Created',
      config: {
        url: '/api/devices',
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        } as any,
        timeout: 0,
        xsrfCookieName: 'XSRF-TOKEN',
        xsrfHeaderName: 'X-XSRF-TOKEN',
        maxContentLength: -1,
        maxBodyLength: -1
      },
      headers: {
        'Content-Type': 'application/json'
      } as any,
      request: {}
    };

    // Trigger success callback which should set tempDevice and open modal
    if (successCallback) {
      successCallback(mockSuccessResponse);
    }

    // Wait for React to process the state change
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Check if the modal is open after success callback
    let qrModal = screen.getByTestId('qr-code-modal');
    expect(qrModal).toHaveAttribute('data-open', 'true');

    // Verify the link is generated correctly
    const expectedLink = `https://test.example.com/onboard-device?id=${mockDevice.id}`;
    expect(qrModal).toHaveAttribute('data-link', expectedLink);

    // Now close the modal by clicking the close button
    const closeButton = screen.getByTestId('qr-modal-close');
    fireEvent.click(closeButton);

    // Wait for React to process the state change
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify that queryClient.invalidateQueries was called
    expect(mockInvalidateQueries).toHaveBeenCalledWith({queryKey: ['get-devices']});

    // Get the updated modal element after the state change
    qrModal = screen.getByTestId('qr-code-modal');

    // Verify the modal is now closed
    expect(qrModal).toHaveAttribute('data-open', 'false');

    // Verify link is reset to undefined (tempDevice is cleared)
    expect(qrModal).toHaveAttribute('data-link', 'undefined');
  });

  it('tracks analytics and calls mutation when Add Device button is clicked', () => {
    renderWithClient(<Devices />, {initialEntries: [PATHS.settings.base]});

    const addButton = screen.getByTestId('add-device-button');
    fireEvent.click(addButton);

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('CLICK_ADD_DEVICE');
    expect(mockMutate).toHaveBeenCalledWith({});
  });

  it('handles successful device addition', () => {
    renderWithClient(<Devices />, {initialEntries: [PATHS.settings.base]});

    // Get the success callback from the useAddDevice call
    const useAddDeviceCall = mockUseAddDevice.mock.calls[0][0];
    const successCallback = useAddDeviceCall.callbacks?.onSuccess;

    const mockSuccessResponse = {
      data: mockDevice,
      status: 201,
      statusText: 'Created',
      config: {
        url: '/api/devices',
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        } as any,
        timeout: 0,
        xsrfCookieName: 'XSRF-TOKEN',
        xsrfHeaderName: 'X-XSRF-TOKEN',
        maxContentLength: -1,
        maxBodyLength: -1
      },
      headers: {
        'Content-Type': 'application/json'
      } as any,
      request: {}
    };

    if (successCallback) {
      successCallback(mockSuccessResponse);
    }

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Onboarding Device',
      description: "Don't forget to scan the QR code with your device.",
      type: 'info'
    });
  });

  it('handles device addition error', () => {
    renderWithClient(<Devices />, {initialEntries: [PATHS.settings.base]});

    // Get the error callback from the useAddDevice call
    const useAddDeviceCall = mockUseAddDevice.mock.calls[0][0];
    const errorCallback = useAddDeviceCall.callbacks?.onError;

    if (errorCallback) {
      errorCallback();
    }

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error adding device',
      description: 'An error occurred while adding the device. Please try again.',
      type: 'error'
    });
  });

  it('generates correct onboard link when device is available', () => {
    renderWithClient(<Devices />, {initialEntries: [PATHS.settings.base]});

    // Simulate successful device creation
    const useAddDeviceCall = mockUseAddDevice.mock.calls[0][0];
    const successCallback = useAddDeviceCall.callbacks?.onSuccess;

    const mockSuccessResponse = {
      data: mockDevice,
      status: 201,
      statusText: 'Created',
      config: {
        url: '/api/devices',
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        } as any,
        timeout: 0,
        xsrfCookieName: 'XSRF-TOKEN',
        xsrfHeaderName: 'X-XSRF-TOKEN',
        maxContentLength: -1,
        maxBodyLength: -1
      },
      headers: {
        'Content-Type': 'application/json'
      } as any,
      request: {}
    };

    if (successCallback) {
      successCallback(mockSuccessResponse);
    }

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Onboarding Device',
      description: "Don't forget to scan the QR code with your device.",
      type: 'info'
    });
  });

  it('passes subNav from outlet context to BasePage', () => {
    const customSubNav = [
      {label: 'Custom Devices', href: '/custom-devices'},
      {label: 'Custom Users', href: '/custom-users'}
    ];

    mockUseOutletContext.mockReturnValue({
      subNav: customSubNav
    });

    renderWithClient(<Devices />, {initialEntries: [PATHS.settings.base]});

    const subNav = screen.getByTestId('sub-nav');
    expect(subNav).toHaveTextContent(JSON.stringify(customSubNav));
  });

  it('maintains consistent breadcrumb hierarchy', () => {
    renderWithClient(<Devices />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbsText = screen.getByTestId('breadcrumbs').textContent;
    const breadcrumbs = JSON.parse(breadcrumbsText || '[]');

    // First breadcrumb should have link
    expect(breadcrumbs[0]).toHaveProperty('link');

    // Last breadcrumb should not have link (current page)
    expect(breadcrumbs[1]).not.toHaveProperty('link');
  });

  it('uses correct PATHS constants', () => {
    renderWithClient(<Devices />, {initialEntries: [PATHS.settings.base]});

    const breadcrumbsText = screen.getByTestId('breadcrumbs').textContent;
    const breadcrumbs = JSON.parse(breadcrumbsText || '[]');

    expect(breadcrumbs[0].link).toBe('/settings');
  });

  it('renders all required UI elements', () => {
    renderWithClient(<Devices />, {initialEntries: [PATHS.settings.base]});

    expect(screen.getByTestId('base-page')).toBeInTheDocument();
    expect(screen.getByTestId('page-title')).toBeInTheDocument();
    expect(screen.getByTestId('sub-nav')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    expect(screen.getByTestId('right-side-items')).toBeInTheDocument();
    expect(screen.getByTestId('add-device-button')).toBeInTheDocument();
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    expect(screen.getByTestId('list-devices')).toBeInTheDocument();
    expect(screen.getByTestId('qr-code-modal')).toBeInTheDocument();
  });

  it('button has correct styling props', () => {
    renderWithClient(<Devices />, {initialEntries: [PATHS.settings.base]});

    const addButton = screen.getByTestId('add-device-button');
    const sxAttr = addButton.getAttribute('data-sx');
    const sx = JSON.parse(sxAttr || '{}');

    expect(sx).toEqual({fontWeight: '600 !important'});
  });
});
