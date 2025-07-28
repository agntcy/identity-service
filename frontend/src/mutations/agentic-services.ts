/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AxiosResponse} from 'axios';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {AgenticServicesAPI} from '@/api/platforms';
import {App} from '@/types/api/app';

interface PropsSettingsAgenticServices {
  callbacks?: {
    onSuccess?: (props: AxiosResponse<App, any>) => void;
    onError?: () => void;
  };
}

export const useCreateAgenticService = ({callbacks}: PropsSettingsAgenticServices) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['create-agentic-platform'],
    mutationFn: (data: App) => AgenticServicesAPI.createApp(data),
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: async (resp) => {
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
      await queryClient.invalidateQueries({queryKey: ['get-agentic-platforms']});
      await queryClient.invalidateQueries({queryKey: ['get-agentic-platforms-total-count']});
    }
  });
};

export const useUpdateAgenticService = ({callbacks}: PropsSettingsAgenticServices) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['update-agentic-platform'],
    mutationFn: ({id, data}: {id: string; data: App}) => AgenticServicesAPI.updateApp(id, data),
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: async (resp) => {
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
      await queryClient.invalidateQueries({queryKey: ['get-agentic-platforms']});
      await queryClient.invalidateQueries({queryKey: ['get-agentic-platform']});
    }
  });
};

export const useDeleteAgenticService = ({callbacks = {}}: PropsSettingsAgenticServices) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['delete-agentic-platform'],
    mutationFn: (id: string) => AgenticServicesAPI.deleteApp(id),
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: async (resp) => {
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
      await queryClient.invalidateQueries({queryKey: ['get-agentic-platforms']});
      await queryClient.invalidateQueries({queryKey: ['get-agentic-platforms-total-count']});
    }
  });
};
