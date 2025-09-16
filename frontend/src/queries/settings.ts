/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {SettingsAPI} from '@/api/services';
import {useQuery} from '@tanstack/react-query';

export const useGetSettings = () => {
  return useQuery({
    queryKey: ['get-settings'],
    queryFn: async () => {
      const {data} = await SettingsAPI.getSettings();
      return data;
    }
  });
};
