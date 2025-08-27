/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AgenticServicesAPI} from '@/api/services';
import {AppType} from '@/types/api/app';
import {keepPreviousData, useQuery} from '@tanstack/react-query';
import qs from 'qs';

export const useGetAgenticServices = (
  query?: {page?: number; size?: number; query?: string; types?: AppType[]; sortColumn?: string; sortDesc?: boolean},
  enabled = true
) => {
  return useQuery({
    queryKey: [
      'get-agentic-services',
      {
        page: query?.page,
        size: query?.size,
        query: query?.query,
        types: query?.types,
        sortColumn: query?.sortColumn,
        sortDesc: query?.sortDesc
      }
    ],
    queryFn: async () => {
      const {data} = await AgenticServicesAPI.listApps(
        {
          page: query?.page,
          size: query?.size,
          query: query?.query,
          types: query?.types,
          sortColumn: query?.sortColumn,
          sortDesc: query?.sortDesc
        },
        {
          paramsSerializer: (params) => {
            return qs.stringify(params);
          }
        }
      );
      return data;
    },
    placeholderData: keepPreviousData,
    enabled: enabled
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
    enabled: !!id,
    retry: 1
  });
};

export const useGetGetTasksAgenticService = (query?: {excludeAppIds?: string[]}) => {
  return useQuery({
    queryKey: [
      'get-tasks-agentic-service',
      {
        excludeAppIds: query?.excludeAppIds
      }
    ],
    queryFn: async () => {
      const {data} = await AgenticServicesAPI.getTasks(
        {
          excludeAppIds: query?.excludeAppIds
        },
        {
          paramsSerializer: (params) => {
            return qs.stringify(params);
          }
        }
      );
      return data;
    },
    enabled: !!query
  });
};

export const useGetAgenticServiceTotalCount = () => {
  return useQuery({
    queryKey: ['get-agentic-services-total-count'],
    queryFn: async () => {
      const {data} = await AgenticServicesAPI.getAppsCount();
      return data;
    }
  });
};
