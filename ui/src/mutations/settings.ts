/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AxiosResponse} from 'axios';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {SettingsAPI} from '@/api/services';
import {ApiKey} from '@/types/api/settings';

interface PropsSettingsApiKey {
  callbacks?: {
    onSuccess?: (props: AxiosResponse<ApiKey, any>) => void;
    onError?: () => void;
  };
}

export const useSetApiKey = ({callbacks}: PropsSettingsApiKey) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['set-api-key'],
    mutationFn: () => SettingsAPI.settingsServiceSetApiKey(),
    onSettled: async () => {
      await queryClient.invalidateQueries({queryKey: ['get-settings']});
    },
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: (resp) => {
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
    }
  });
};
