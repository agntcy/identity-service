/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {DevicesAPI} from '@/api/services';
import {keepPreviousData, useQuery} from '@tanstack/react-query';
import qs from 'qs';

export const useGetDevices = (query?: {page?: number; size?: number; query?: string}, enable = true) => {
  return useQuery({
    queryKey: [
      'get-devices',
      {
        page: query?.page,
        size: query?.size,
        query: query?.query
      }
    ],
    queryFn: async () => {
      const {data} = await DevicesAPI.listDevices(
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
    },
    enabled: enable,
    placeholderData: keepPreviousData
  });
};
