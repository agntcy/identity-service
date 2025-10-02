/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
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
