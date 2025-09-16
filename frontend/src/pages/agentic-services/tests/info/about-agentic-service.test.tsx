/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {screen, cleanup} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import AboutAgenticService from '../../info/about-agentic-service';
import {renderWithClient} from '@/utils/tests';
import {V1Alpha1App, V1Alpha1AppType, V1Alpha1AppStatus} from '@/api/generated/identity/app_service.swagger.api';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: vi.fn()
  };
});

// Mock components
vi.mock('@/components/agentic-services/info/about', () => ({
  ContentAboutAgenticService: ({app}: {app: V1Alpha1App}) => (
    <div data-testid="content-about-agentic-service" data-app={JSON.stringify(app)}>
      ContentAboutAgenticService
    </div>
  )
}));

const mockUseOutletContext = vi.mocked((await import('react-router-dom')).useOutletContext);

describe('AboutAgenticService', () => {
  const mockApp: V1Alpha1App = {
    id: 'service-123',
    name: 'Test Agentic Service',
    description: 'Test agentic service description',
    type: V1Alpha1AppType.APP_TYPE_AGENT_A2A,
    status: V1Alpha1AppStatus.APP_STATUS_ACTIVE,
    resolverMetadataId: 'did:example:123',
    apiKey: 'test-api-key',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders without crashing when app is provided', () => {
    mockUseOutletContext.mockReturnValue({app: mockApp});

    renderWithClient(<AboutAgenticService />);

    expect(screen.getByTestId('content-about-agentic-service')).toBeInTheDocument();
  });

  it('renders ContentAboutAgenticService with correct app prop', () => {
    mockUseOutletContext.mockReturnValue({app: mockApp});

    renderWithClient(<AboutAgenticService />);

    const contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(mockApp));
  });

  it('returns null when app is not provided', () => {
    mockUseOutletContext.mockReturnValue({});

    const {container} = renderWithClient(<AboutAgenticService />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('content-about-agentic-service')).not.toBeInTheDocument();
  });

  it('returns null when app is null', () => {
    mockUseOutletContext.mockReturnValue({app: null});

    const {container} = renderWithClient(<AboutAgenticService />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('content-about-agentic-service')).not.toBeInTheDocument();
  });

  it('returns null when app is undefined', () => {
    mockUseOutletContext.mockReturnValue({app: undefined});

    const {container} = renderWithClient(<AboutAgenticService />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('content-about-agentic-service')).not.toBeInTheDocument();
  });

  it('returns null when outlet context is empty', () => {
    mockUseOutletContext.mockReturnValue({});

    const {container} = renderWithClient(<AboutAgenticService />);

    expect(container.firstChild).toBeNull();
  });

  it('returns null when outlet context is null', () => {
    mockUseOutletContext.mockReturnValue(null as any);

    // Check what actually happens instead of expecting an error
    const {container} = renderWithClient(<AboutAgenticService />);

    // If the component handles null gracefully, it should return null
    // If it throws, this test will fail and show us the actual behavior
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('content-about-agentic-service')).not.toBeInTheDocument();
  });

  it('returns null when outlet context is undefined', () => {
    mockUseOutletContext.mockReturnValue(undefined as any);

    // Check what actually happens instead of expecting an error
    const {container} = renderWithClient(<AboutAgenticService />);

    // If the component handles undefined gracefully, it should return null
    // If it throws, this test will fail and show us the actual behavior
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('content-about-agentic-service')).not.toBeInTheDocument();
  });

  it('calls useOutletContext hook', () => {
    mockUseOutletContext.mockReturnValue({app: mockApp});

    renderWithClient(<AboutAgenticService />);

    expect(mockUseOutletContext).toHaveBeenCalledTimes(1);
  });

  it('handles minimal app object', () => {
    const minimalApp: V1Alpha1App = {
      id: 'minimal-123',
      name: 'Minimal Service'
    };

    mockUseOutletContext.mockReturnValue({app: minimalApp});

    renderWithClient(<AboutAgenticService />);

    const contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(minimalApp));
  });

  it('handles app with empty string values', () => {
    const appWithEmptyStrings: V1Alpha1App = {
      ...mockApp,
      name: '',
      description: '',
      apiKey: ''
    };

    mockUseOutletContext.mockReturnValue({app: appWithEmptyStrings});

    renderWithClient(<AboutAgenticService />);

    const contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(appWithEmptyStrings));
  });

  it('handles app with undefined optional properties', () => {
    const appWithUndefinedValues: V1Alpha1App = {
      id: 'test-123',
      name: 'Test Service',
      description: undefined,
      type: undefined,
      resolverMetadataId: undefined,
      apiKey: undefined,
      status: undefined,
      createdAt: undefined,
      updatedAt: undefined
    };

    mockUseOutletContext.mockReturnValue({app: appWithUndefinedValues});

    renderWithClient(<AboutAgenticService />);

    const contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(appWithUndefinedValues));
  });

  // Individual tests for each app type to avoid DOM accumulation
  it('handles APP_TYPE_UNSPECIFIED', () => {
    const appWithType: V1Alpha1App = {...mockApp, type: V1Alpha1AppType.APP_TYPE_UNSPECIFIED};
    mockUseOutletContext.mockReturnValue({app: appWithType});

    renderWithClient(<AboutAgenticService />);

    const contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(appWithType));
  });

  it('handles APP_TYPE_AGENT_A2A', () => {
    const appWithType: V1Alpha1App = {...mockApp, type: V1Alpha1AppType.APP_TYPE_AGENT_A2A};
    mockUseOutletContext.mockReturnValue({app: appWithType});

    renderWithClient(<AboutAgenticService />);

    const contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(appWithType));
  });

  it('handles APP_TYPE_AGENT_OASF', () => {
    const appWithType: V1Alpha1App = {...mockApp, type: V1Alpha1AppType.APP_TYPE_AGENT_OASF};
    mockUseOutletContext.mockReturnValue({app: appWithType});

    renderWithClient(<AboutAgenticService />);

    const contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(appWithType));
  });

  it('handles APP_TYPE_MCP_SERVER', () => {
    const appWithType: V1Alpha1App = {...mockApp, type: V1Alpha1AppType.APP_TYPE_MCP_SERVER};
    mockUseOutletContext.mockReturnValue({app: appWithType});

    renderWithClient(<AboutAgenticService />);

    const contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(appWithType));
  });

  // Individual tests for each app status to avoid DOM accumulation
  it('handles APP_STATUS_UNSPECIFIED', () => {
    const appWithStatus: V1Alpha1App = {...mockApp, status: V1Alpha1AppStatus.APP_STATUS_UNSPECIFIED};
    mockUseOutletContext.mockReturnValue({app: appWithStatus});

    renderWithClient(<AboutAgenticService />);

    const contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(appWithStatus));
  });

  it('handles APP_STATUS_ACTIVE', () => {
    const appWithStatus: V1Alpha1App = {...mockApp, status: V1Alpha1AppStatus.APP_STATUS_ACTIVE};
    mockUseOutletContext.mockReturnValue({app: appWithStatus});

    renderWithClient(<AboutAgenticService />);

    const contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(appWithStatus));
  });

  it('handles APP_STATUS_PENDING', () => {
    const appWithStatus: V1Alpha1App = {...mockApp, status: V1Alpha1AppStatus.APP_STATUS_PENDING};
    mockUseOutletContext.mockReturnValue({app: appWithStatus});

    renderWithClient(<AboutAgenticService />);

    const contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(appWithStatus));
  });

  it('handles APP_STATUS_REVOKED', () => {
    const appWithStatus: V1Alpha1App = {...mockApp, status: V1Alpha1AppStatus.APP_STATUS_REVOKED};
    mockUseOutletContext.mockReturnValue({app: appWithStatus});

    renderWithClient(<AboutAgenticService />);

    const contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(appWithStatus));
  });

  it('handles app with DID resolver metadata', () => {
    const appWithDID: V1Alpha1App = {
      ...mockApp,
      resolverMetadataId: 'did:web:example.com:identity:apps:service-123'
    };

    mockUseOutletContext.mockReturnValue({app: appWithDID});

    renderWithClient(<AboutAgenticService />);

    const contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(appWithDID));
  });

  it('handles app with ISO date strings', () => {
    const appWithDates: V1Alpha1App = {
      ...mockApp,
      createdAt: '2023-12-25T10:30:00.000Z',
      updatedAt: '2024-01-15T14:45:30.123Z'
    };

    mockUseOutletContext.mockReturnValue({app: appWithDates});

    renderWithClient(<AboutAgenticService />);

    const contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(appWithDates));
  });

  it('handles outlet context with additional properties', () => {
    const contextWithExtraProps = {
      app: mockApp,
      extraProp: 'should not affect component',
      anotherProp: 123
    };

    mockUseOutletContext.mockReturnValue(contextWithExtraProps);

    renderWithClient(<AboutAgenticService />);

    const contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(mockApp));
  });

  it('renders different apps in separate test instances', () => {
    // Test 1: Render with first app
    const firstApp: V1Alpha1App = {
      ...mockApp,
      id: 'first-123',
      name: 'First Service'
    };
    mockUseOutletContext.mockReturnValue({app: firstApp});
    renderWithClient(<AboutAgenticService />);

    let contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(firstApp));

    cleanup(); // Clean up DOM

    // Test 2: Render with second app in fresh DOM
    const secondApp: V1Alpha1App = {
      ...mockApp,
      id: 'second-123',
      name: 'Second Service',
      type: V1Alpha1AppType.APP_TYPE_MCP_SERVER
    };
    mockUseOutletContext.mockReturnValue({app: secondApp});
    renderWithClient(<AboutAgenticService />);

    contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(secondApp));
  });

  it('component renders as functional component', () => {
    mockUseOutletContext.mockReturnValue({app: mockApp});

    const component = renderWithClient(<AboutAgenticService />);
    expect(component.container.firstChild).toBeInTheDocument();
  });

  it('early return pattern works correctly', () => {
    // Test the early return when app is falsy
    mockUseOutletContext.mockReturnValue({app: false as any});

    const {container} = renderWithClient(<AboutAgenticService />);

    expect(container.firstChild).toBeNull();
    expect(mockUseOutletContext).toHaveBeenCalledTimes(1);
  });

  it('handles app with only required fields', () => {
    const requiredFieldsOnly: V1Alpha1App = {
      id: 'required-123'
      // Only id provided, all other fields optional
    };

    mockUseOutletContext.mockReturnValue({app: requiredFieldsOnly});

    renderWithClient(<AboutAgenticService />);

    const contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(requiredFieldsOnly));
  });

  it('handles app with empty object (no properties)', () => {
    const emptyApp: V1Alpha1App = {};

    mockUseOutletContext.mockReturnValue({app: emptyApp});

    renderWithClient(<AboutAgenticService />);

    const contentComponent = screen.getByTestId('content-about-agentic-service');
    expect(contentComponent).toBeInTheDocument();
    expect(contentComponent).toHaveAttribute('data-app', JSON.stringify(emptyApp));
  });
});
