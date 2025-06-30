/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AgenticServicesAPI} from '@/api/services';
import {useQuery} from '@tanstack/react-query';

export const useGetAgenticServices = () => {
  return useQuery({
    queryKey: ['get-agentic-services'],
    queryFn: async () => {
      const {data} = await AgenticServicesAPI.listApps();
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
