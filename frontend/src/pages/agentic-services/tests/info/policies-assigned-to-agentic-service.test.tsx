/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {screen, cleanup} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import PoliciesAssignedToAgenticService from '../../info/policies-assigned-to-agentic-service';
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
vi.mock('@/components/agentic-services/info/list-policies-agentic-service', () => ({
  ListPoliciesAgenticService: ({appId, mode}: {appId: string; mode: string}) => (
    <div data-testid="list-policies-agentic-service" data-app-id={appId} data-mode={mode}>
      ListPoliciesAgenticService
    </div>
  )
}));

const mockUseOutletContext = vi.mocked((await import('react-router-dom')).useOutletContext);

describe('PoliciesAssignedToAgenticService', () => {
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

    renderWithClient(<PoliciesAssignedToAgenticService />);

    expect(screen.getByTestId('list-policies-agentic-service')).toBeInTheDocument();
  });

  it('renders ListPoliciesAgenticService with correct props', () => {
    mockUseOutletContext.mockReturnValue({app: mockApp});

    renderWithClient(<PoliciesAssignedToAgenticService />);

    const listComponent = screen.getByTestId('list-policies-agentic-service');
    expect(listComponent).toHaveAttribute('data-app-id', mockApp.id);
    expect(listComponent).toHaveAttribute('data-mode', 'assigned');
  });

  it('returns null when app is not provided', () => {
    mockUseOutletContext.mockReturnValue({});

    const {container} = renderWithClient(<PoliciesAssignedToAgenticService />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('list-policies-agentic-service')).not.toBeInTheDocument();
  });

  it('returns null when app is null', () => {
    mockUseOutletContext.mockReturnValue({app: null});

    const {container} = renderWithClient(<PoliciesAssignedToAgenticService />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('list-policies-agentic-service')).not.toBeInTheDocument();
  });

  it('returns null when app is undefined', () => {
    mockUseOutletContext.mockReturnValue({app: undefined});

    const {container} = renderWithClient(<PoliciesAssignedToAgenticService />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('list-policies-agentic-service')).not.toBeInTheDocument();
  });

  it('returns null when outlet context is empty', () => {
    mockUseOutletContext.mockReturnValue({});

    const {container} = renderWithClient(<PoliciesAssignedToAgenticService />);

    expect(container.firstChild).toBeNull();
  });

  it('returns null when outlet context is null', () => {
    mockUseOutletContext.mockReturnValue(null as any);

    const {container} = renderWithClient(<PoliciesAssignedToAgenticService />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('list-policies-agentic-service')).not.toBeInTheDocument();
  });

  it('returns null when outlet context is undefined', () => {
    mockUseOutletContext.mockReturnValue(undefined as any);

    const {container} = renderWithClient(<PoliciesAssignedToAgenticService />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('list-policies-agentic-service')).not.toBeInTheDocument();
  });

  it('calls useOutletContext hook', () => {
    mockUseOutletContext.mockReturnValue({app: mockApp});

    renderWithClient(<PoliciesAssignedToAgenticService />);

    expect(mockUseOutletContext).toHaveBeenCalledTimes(1);
  });

  it('handles minimal app object', () => {
    const minimalApp: V1Alpha1App = {
      id: 'minimal-123',
      name: 'Minimal Service'
    };

    mockUseOutletContext.mockReturnValue({app: minimalApp});

    renderWithClient(<PoliciesAssignedToAgenticService />);

    const listComponent = screen.getByTestId('list-policies-agentic-service');
    expect(listComponent).toBeInTheDocument();
    expect(listComponent).toHaveAttribute('data-app-id', minimalApp.id);
    expect(listComponent).toHaveAttribute('data-mode', 'assigned');
  });

  it('handles app with empty string id', () => {
    const appWithEmptyId: V1Alpha1App = {
      ...mockApp,
      id: ''
    };

    mockUseOutletContext.mockReturnValue({app: appWithEmptyId});

    renderWithClient(<PoliciesAssignedToAgenticService />);

    const listComponent = screen.getByTestId('list-policies-agentic-service');
    expect(listComponent).toBeInTheDocument();
    expect(listComponent).toHaveAttribute('data-app-id', '');
    expect(listComponent).toHaveAttribute('data-mode', 'assigned');
  });

  it('handles app with undefined id', () => {
    const appWithUndefinedId: V1Alpha1App = {
      ...mockApp,
      id: undefined
    };

    mockUseOutletContext.mockReturnValue({app: appWithUndefinedId});

    renderWithClient(<PoliciesAssignedToAgenticService />);

    const listComponent = screen.getByTestId('list-policies-agentic-service');
    expect(listComponent).toBeInTheDocument();
    expect(listComponent).not.toHaveAttribute('data-app-id');
    expect(listComponent).toHaveAttribute('data-mode', 'assigned');
  });

  it('handles different app types', () => {
    const appWithType: V1Alpha1App = {...mockApp, type: V1Alpha1AppType.APP_TYPE_MCP_SERVER};
    mockUseOutletContext.mockReturnValue({app: appWithType});

    renderWithClient(<PoliciesAssignedToAgenticService />);

    const listComponent = screen.getByTestId('list-policies-agentic-service');
    expect(listComponent).toBeInTheDocument();
    expect(listComponent).toHaveAttribute('data-app-id', appWithType.id);
    expect(listComponent).toHaveAttribute('data-mode', 'assigned');
  });

  it('handles different app statuses', () => {
    const appWithStatus: V1Alpha1App = {...mockApp, status: V1Alpha1AppStatus.APP_STATUS_REVOKED};
    mockUseOutletContext.mockReturnValue({app: appWithStatus});

    renderWithClient(<PoliciesAssignedToAgenticService />);

    const listComponent = screen.getByTestId('list-policies-agentic-service');
    expect(listComponent).toBeInTheDocument();
    expect(listComponent).toHaveAttribute('data-app-id', appWithStatus.id);
    expect(listComponent).toHaveAttribute('data-mode', 'assigned');
  });

  it('handles outlet context with additional properties', () => {
    const contextWithExtraProps = {
      app: mockApp,
      extraProp: 'should not affect component',
      anotherProp: 123
    };

    mockUseOutletContext.mockReturnValue(contextWithExtraProps);

    renderWithClient(<PoliciesAssignedToAgenticService />);

    const listComponent = screen.getByTestId('list-policies-agentic-service');
    expect(listComponent).toBeInTheDocument();
    expect(listComponent).toHaveAttribute('data-app-id', mockApp.id);
    expect(listComponent).toHaveAttribute('data-mode', 'assigned');
  });

  it('renders different apps in separate test instances', () => {
    // Test 1: Render with first app
    const firstApp: V1Alpha1App = {
      ...mockApp,
      id: 'first-123',
      name: 'First Service'
    };
    mockUseOutletContext.mockReturnValue({app: firstApp});
    renderWithClient(<PoliciesAssignedToAgenticService />);

    let listComponent = screen.getByTestId('list-policies-agentic-service');
    expect(listComponent).toBeInTheDocument();
    expect(listComponent).toHaveAttribute('data-app-id', firstApp.id);
    expect(listComponent).toHaveAttribute('data-mode', 'assigned');

    cleanup(); // Clean up DOM

    // Test 2: Render with second app in fresh DOM
    const secondApp: V1Alpha1App = {
      ...mockApp,
      id: 'second-123',
      name: 'Second Service'
    };
    mockUseOutletContext.mockReturnValue({app: secondApp});
    renderWithClient(<PoliciesAssignedToAgenticService />);

    listComponent = screen.getByTestId('list-policies-agentic-service');
    expect(listComponent).toBeInTheDocument();
    expect(listComponent).toHaveAttribute('data-app-id', secondApp.id);
    expect(listComponent).toHaveAttribute('data-mode', 'assigned');
  });

  it('component renders as functional component', () => {
    mockUseOutletContext.mockReturnValue({app: mockApp});

    const component = renderWithClient(<PoliciesAssignedToAgenticService />);
    expect(component.container.firstChild).toBeInTheDocument();
  });

  it('early return pattern works correctly', () => {
    // Test the early return when app is falsy
    mockUseOutletContext.mockReturnValue({app: false as any});

    const {container} = renderWithClient(<PoliciesAssignedToAgenticService />);

    expect(container.firstChild).toBeNull();
    expect(mockUseOutletContext).toHaveBeenCalledTimes(1);
  });

  it('handles app with only id field', () => {
    const idOnlyApp: V1Alpha1App = {
      id: 'id-only-123'
    };

    mockUseOutletContext.mockReturnValue({app: idOnlyApp});

    renderWithClient(<PoliciesAssignedToAgenticService />);

    const listComponent = screen.getByTestId('list-policies-agentic-service');
    expect(listComponent).toBeInTheDocument();
    expect(listComponent).toHaveAttribute('data-app-id', idOnlyApp.id);
    expect(listComponent).toHaveAttribute('data-mode', 'assigned');
  });

  it('handles app with empty object (no properties)', () => {
    const emptyApp: V1Alpha1App = {};

    mockUseOutletContext.mockReturnValue({app: emptyApp});

    renderWithClient(<PoliciesAssignedToAgenticService />);

    const listComponent = screen.getByTestId('list-policies-agentic-service');
    expect(listComponent).toBeInTheDocument();
    expect(listComponent).not.toHaveAttribute('data-app-id');
    expect(listComponent).toHaveAttribute('data-mode', 'assigned');
  });

  it('always passes "assigned" mode to ListPoliciesAgenticService', () => {
    mockUseOutletContext.mockReturnValue({app: mockApp});

    renderWithClient(<PoliciesAssignedToAgenticService />);

    const listComponent = screen.getByTestId('list-policies-agentic-service');
    expect(listComponent).toHaveAttribute('data-mode', 'assigned');
  });

  it('handles app id extraction correctly with optional chaining', () => {
    const appWithId: V1Alpha1App = {
      id: 'chaining-test-123',
      name: 'Chaining Test'
    };

    mockUseOutletContext.mockReturnValue({app: appWithId});

    renderWithClient(<PoliciesAssignedToAgenticService />);

    const listComponent = screen.getByTestId('list-policies-agentic-service');
    expect(listComponent).toBeInTheDocument();
    expect(listComponent).toHaveAttribute('data-app-id', appWithId.id);
  });
});
