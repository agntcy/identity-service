/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {PolicyAPI} from '@/api/services';
import {useQuery} from '@tanstack/react-query';
import qs from 'qs';

export const useGetPolicies = (query?: {page?: number; size?: number; query?: string}) => {
  return useQuery({
    queryKey: ['get-policies', query?.page, query?.size, query?.query],
    queryFn: async () => {
      const {data} = await PolicyAPI.listPolicies(
        {
          page: query?.page,
          size: query?.size,
          query: query?.query
        },
        {
          paramsSerializer: (params) => {
            return qs.stringify(params);
          }
        }
      );
      return data;
    }
  });
};

export const useGetPolicy = (id?: string) => {
  return useQuery({
    queryKey: ['get-policy', id],
    queryFn: async () => {
      const {data} = await PolicyAPI.getPolicy(id!);
      return data;
    },
    enabled: !!id
  });
};

// export const useGetAgenticServiceBadge = (id?: string) => {
//   return useQuery({
//     queryKey: ['get-agentic-service-badge', id],
//     queryFn: async () => {
//       const {data} = await AgenticServicesAPI.getAppBadge(id!);
//       return data;
//     },
//     enabled: !!id
//   });
// };

// export const useGetAgenticServicesCount = () => {
//   return useQuery({
//     queryKey: ['get-agentic-service-count'],
//     queryFn: async () => {
//       const {data} = await AgenticServicesAPI.getAppsCount();
//       return data;
//     }
//   });
// };
