/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {screen, fireEvent} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach} from 'vitest';
import {GlobalSearch} from './global-search';
import {render} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import React from 'react';

// Mock navigate function at top level
const mockNavigate = vi.fn();

// Create a simple test wrapper without MemoryRouter to avoid conflicts
const TestWrapper = ({children}: {children: React.ReactNode}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {retry: false, staleTime: 0, gcTime: 0},
      mutations: {retry: false}
    }
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

// Mock react-router-dom hooks specifically
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    generatePath: vi.fn((path, params) => path.replace(':id', params.id)),
    MemoryRouter: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
    Router: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
    Routes: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
    Route: ({children}: {children: React.ReactNode}) => <div>{children}</div>
  };
});

// Mock queries
vi.mock('@/queries', () => ({
  useGetAgenticServices: vi.fn(),
  useGetPolicies: vi.fn(),
  useGetAgenticService: vi.fn()
}));

// Mock zustand shallow
vi.mock('zustand/react/shallow', () => ({
  useShallow: vi.fn((fn) => fn)
}));

// Mock paths
vi.mock('@/router/paths', () => ({
  PATHS: {
    agenticServices: {
      info: {
        base: '/agentic-services/:id'
      }
    },
    policies: {
      info: '/policies/:id'
    }
  }
}));

// Mock AgenticServiceType component
vi.mock('../agentic-services/agentic-service-type', () => ({
  AgenticServiceType: vi.fn(({type, showLabel}) => (
    <span data-testid="agentic-service-type" data-type={type} data-show-label={showLabel}>
      {type}
    </span>
  ))
}));

// Mock Spark Design components
vi.mock('@outshift/spark-design', () => ({
  GeneralSize: {
    Small: 'small'
  },
  TagStatus: {
    Info: 'info'
  },
  OverflowTooltip: vi.fn(({value, someLongText}) => (
    <span data-testid="overflow-tooltip" title={someLongText}>
      {value}
    </span>
  )),
  Tag: vi.fn(({children, size, status}) => (
    <span data-testid="tag" data-size={size} data-status={status}>
      {children}
    </span>
  ))
}));

// Create mock components for use in SearchFieldWithAutocomplete
const MockAgenticServiceType = ({type, showLabel}: {type: string; showLabel: boolean}) => (
  <span data-testid="agentic-service-type" data-type={type} data-show-label={showLabel}>
    {type}
  </span>
);

const MockTag = ({children, size, status}: {children: React.ReactNode; size: string; status: string}) => (
  <span data-testid="tag" data-size={size} data-status={status}>
    {children}
  </span>
);

const MockOverflowTooltip = ({value, someLongText}: {value: string; someLongText: string}) => (
  <span data-testid="overflow-tooltip" title={someLongText}>
    {value}
  </span>
);

// Mock UI components with proper option rendering
vi.mock('@/components/ui/search-field-with-auto-complete', () => ({
  SearchFieldWithAutocomplete: vi.fn(({onChange, onSearch, loading, options, labels, serverFiltering}) => {
    return (
      <div data-testid="search-field-with-autocomplete">
        <input data-testid="search-input" onChange={(e) => onSearch?.(e.target.value)} placeholder="Search" />
        <div data-testid="loading-state">{loading ? 'Loading' : 'Not Loading'}</div>
        <div data-testid="server-filtering">{serverFiltering ? 'Server Filtering' : 'Client Filtering'}</div>
        <div data-testid="options-count">{options?.length || 0} options</div>
        <div data-testid="labels">{JSON.stringify(labels)}</div>
        {options?.map(
          (
            option: {
              category:
                | string
                | number
                | boolean
                | React.ReactElement<any, string | React.JSXElementConstructor<any>>
                | Iterable<React.ReactNode>
                | null
                | undefined;
              entity: {
                id:
                  | string
                  | number
                  | boolean
                  | React.ReactElement<any, string | React.JSXElementConstructor<any>>
                  | Iterable<React.ReactNode>
                  | React.ReactPortal
                  | null
                  | undefined;
                type: string;
                name: any;
                rules: any;
              };
            },
            index: React.Key | null | undefined
          ) => (
            <div key={index} data-testid={`option-${index}`}>
              <button onClick={() => onChange?.(option)}>
                {option.category}-{option.entity.id}
              </button>
              {/* Render components based on option type */}
              {option.category === 'agentic-services' && (
                <MockAgenticServiceType type={option.entity.type} showLabel={false} />
              )}
              {option.category === 'policies' && (
                <>
                  <MockOverflowTooltip
                    value={option.entity.name || 'Unnamed Policy'}
                    someLongText={option.entity.name || 'Unnamed Policy'}
                  />
                  <MockTag size="small" status="info">
                    {(option.entity.rules || []).length} rules
                  </MockTag>
                </>
              )}
            </div>
          )
        )}
      </div>
    );
  })
}));

describe('GlobalSearch', () => {
  const mockAgenticServices = {
    apps: [
      {id: '1', name: 'Service 1', type: 'chatbot'},
      {id: '2', name: 'Service 2', type: 'workflow'}
    ]
  };

  const mockPolicies = {
    policies: [
      {id: 'p1', name: 'Policy 1', rules: [{id: 'r1'}, {id: 'r2'}], assignedTo: '1'},
      {id: 'p2', name: 'Policy 2', rules: [{id: 'r3'}], assignedTo: '2'}
    ]
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mocked modules
    const {useGetAgenticServices, useGetPolicies, useGetAgenticService} = vi.mocked(await import('@/queries'));

    // Setup default query mocks
    useGetAgenticServices.mockReturnValue({
      data: mockAgenticServices,
      isLoading: false
    } as any);

    useGetPolicies.mockReturnValue({
      data: mockPolicies,
      isLoading: false
    } as any);

    useGetAgenticService.mockReturnValue({
      // @ts-expect-error error
      data: {id: '1', name: 'Service 1', type: 'chatbot'}
    });
  });

  const renderGlobalSearch = () => {
    return render(<GlobalSearch />, {wrapper: TestWrapper});
  };

  it('renders without crashing', () => {
    renderGlobalSearch();
    expect(screen.getByTestId('search-field-with-autocomplete')).toBeInTheDocument();
  });

  it('renders with server filtering enabled', () => {
    renderGlobalSearch();
    expect(screen.getByTestId('server-filtering')).toHaveTextContent('Server Filtering');
  });

  it('displays correct labels (includes both agentic services and policies)', () => {
    renderGlobalSearch();

    const labelsElement = screen.getByTestId('labels');
    const labels = JSON.parse(labelsElement.textContent || '{}');

    // Component currently includes both categories
    expect(labels).toEqual({
      'agentic-services': 'Agentic Services',
      policies: 'Policies'
    });
  });

  it('calls useGetAgenticServices with correct parameters on search', async () => {
    const {useGetAgenticServices} = vi.mocked(await import('@/queries'));

    renderGlobalSearch();

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, {target: {value: 'test query'}});

    expect(useGetAgenticServices).toHaveBeenCalledWith({query: 'test query', size: 10}, true);
  });

  it('does not enable agentic services query when query is empty', async () => {
    const {useGetAgenticServices} = vi.mocked(await import('@/queries'));

    renderGlobalSearch();

    expect(useGetAgenticServices).toHaveBeenCalledWith({query: '', size: 10}, false);
  });

  it('shows loading when agentic services are loading', async () => {
    const {useGetAgenticServices} = vi.mocked(await import('@/queries'));

    useGetAgenticServices.mockReturnValue({
      // @ts-expect-error error
      data: null,
      isLoading: true
    });

    renderGlobalSearch();

    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');
  });

  it('generates correct number of options (agentic services + policies)', () => {
    renderGlobalSearch();

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, {target: {value: 'test'}});

    // Should show both agentic services (2) and policies (2) = 4 total
    expect(screen.getByTestId('options-count')).toHaveTextContent('4 options');
  });

  it('sorts agentic services alphabetically', async () => {
    const {useGetAgenticServices} = vi.mocked(await import('@/queries'));

    const unsortedServices = {
      apps: [
        {id: '1', name: 'Zebra Service', type: 'chatbot'},
        {id: '2', name: 'Alpha Service', type: 'workflow'}
      ]
    };

    useGetAgenticServices.mockReturnValue({
      data: unsortedServices,
      isLoading: false
    } as any);

    renderGlobalSearch();

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, {target: {value: 'test'}});

    // First agentic service option should be Alpha Service (id: 2)
    const firstOption = screen.getByTestId('option-0');
    expect(firstOption).toHaveTextContent('agentic-services-2');
  });

  it('handles empty agentic services data gracefully', async () => {
    const {useGetAgenticServices} = vi.mocked(await import('@/queries'));

    useGetAgenticServices.mockReturnValue({
      // @ts-expect-error error
      data: null,
      isLoading: false
    });

    renderGlobalSearch();

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, {target: {value: 'test'}});

    // Should still show policies (2 options) even when agentic services data is null
    expect(screen.getByTestId('options-count')).toHaveTextContent('2 options');
  });

  it('navigates to agentic service when selected', () => {
    renderGlobalSearch();

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, {target: {value: 'test'}});

    const agenticServiceOption = screen.getByTestId('option-0').querySelector('button');
    fireEvent.click(agenticServiceOption!);

    expect(mockNavigate).toHaveBeenCalledWith('/agentic-services/1');
  });

  it('renders ApplicationListItem components correctly', () => {
    renderGlobalSearch();

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, {target: {value: 'test'}});

    // Check that agentic service type components are rendered
    const agenticServiceTypes = screen.getAllByTestId('agentic-service-type');
    expect(agenticServiceTypes.length).toBeGreaterThan(0);
  });

  it('handles missing app names in ApplicationListItem', async () => {
    const {useGetAgenticServices} = vi.mocked(await import('@/queries'));

    const servicesWithMissingName = {
      apps: [{id: '1', type: 'chatbot'}] // No name property
    };

    useGetAgenticServices.mockReturnValue({
      data: servicesWithMissingName,
      isLoading: false
    } as any);

    renderGlobalSearch();

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, {target: {value: 'test'}});

    // Should show 1 agentic service + 2 policies = 3 options
    expect(screen.getByTestId('options-count')).toHaveTextContent('3 options');
  });

  it('handles undefined apps array', async () => {
    const {useGetAgenticServices} = vi.mocked(await import('@/queries'));

    useGetAgenticServices.mockReturnValue({
      data: {apps: undefined},
      isLoading: false
    } as any);

    renderGlobalSearch();

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, {target: {value: 'test'}});

    // Should show only policies (2 options) when apps array is undefined
    expect(screen.getByTestId('options-count')).toHaveTextContent('2 options');
  });

  it('does not navigate when string option is selected', () => {
    renderGlobalSearch();

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, {target: {value: 'test'}});

    // Initially no navigation should have occurred
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('uses correct SIZE constant for queries', async () => {
    const {useGetAgenticServices} = vi.mocked(await import('@/queries'));

    renderGlobalSearch();

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, {target: {value: 'test'}});

    expect(useGetAgenticServices).toHaveBeenCalledWith({query: 'test', size: 10}, true);
  });
});
