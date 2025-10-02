/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";
import { PATHS } from "@/router/paths";

interface TestRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: MemoryRouterProps['initialEntries'];
  initialIndex?: MemoryRouterProps['initialIndex'];
  queryClientOptions?: Partial<ConstructorParameters<typeof QueryClient>[0]>;
}

interface TestRenderResult extends RenderResult {
  rerender: (ui: React.ReactNode) => void;
  queryClient: QueryClient;
}

const createTestQueryClient = (options?: Partial<ConstructorParameters<typeof QueryClient>[0]>) =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    ...options,
  });

const TestProviders = ({
  children,
  initialEntries = [PATHS.basePath],
  initialIndex,
  queryClient
}: {
  children: React.ReactNode;
  initialEntries?: MemoryRouterProps['initialEntries'];
  initialIndex?: MemoryRouterProps['initialIndex'];
  queryClient: QueryClient;
}) => (
  <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  </MemoryRouter>
);

export function renderWithClient(
  ui: React.ReactElement,
  options: TestRenderOptions = {}
): TestRenderResult {
  const {
    initialEntries = [PATHS.basePath],
    initialIndex,
    queryClientOptions,
    ...renderOptions
  } = options;

  const queryClient = createTestQueryClient(queryClientOptions);

  const { rerender, ...result } = render(ui, {
    wrapper: ({ children }) => (
      <TestProviders
        initialEntries={initialEntries}
        initialIndex={initialIndex}
        queryClient={queryClient}
      >
        {children}
      </TestProviders>
    ),
    ...renderOptions,
  });

  return {
    ...result,
    queryClient,
    rerender: (rerenderUi: React.ReactNode) =>
      rerender(
        <TestProviders
          initialEntries={initialEntries}
          initialIndex={initialIndex}
          queryClient={queryClient}
        >
          {rerenderUi}
        </TestProviders>
      ),
  };
}

export const handlers = [
  http.get("*/react-query", () => {
    return HttpResponse.json({
      name: "mocked-react-query",
    });
  }),
];