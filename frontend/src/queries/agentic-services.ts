/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AgenticServicesAPI} from '@/api/services';
import {AppType} from '@/types/api/app';
import {useQuery} from '@tanstack/react-query';

export const useGetAgenticServices = (query?: {page?: number; size?: number; query?: string; type?: AppType}) => {
  return useQuery({
    queryKey: ['get-agentic-services', query?.page, query?.size, query?.query, query?.type],
    queryFn: async () => {
      const {data} = await AgenticServicesAPI.listApps(query);
      return data;
    }
  });
};

export const useGetAgenticService = (id?: string) => {
  return useQuery({
    queryKey: ['get-agentic-service', id],
    queryFn: async () => {
      const {data} = await AgenticServicesAPI.getApp(id!);
      return data;
    },
    enabled: !!id
  });
};

export const useGetAgenticServiceBadge = (id?: string) => {
  return useQuery({
    queryKey: ['get-agentic-service-badge', id],
    queryFn: async () => {
      const {data} = await AgenticServicesAPI.getAppBadge(id!);
      return data;
    },
    enabled: !!id
  });
};
