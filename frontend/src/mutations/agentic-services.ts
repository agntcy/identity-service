/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AxiosResponse} from 'axios';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {AgenticServicesAPI} from '@/api/services';
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
    mutationKey: ['create-agentic-service'],
    mutationFn: (data: App) => AgenticServicesAPI.createApp(data),
    onSettled: async () => {
      await queryClient.invalidateQueries({queryKey: ['get-agentic-services']});
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

export const useUpdateAgenticService = ({callbacks}: PropsSettingsAgenticServices) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['update-agentic-service'],
    mutationFn: ({id, data}: {id: string; data: App}) => AgenticServicesAPI.updateApp(id, data),
    onSettled: async () => {
      await queryClient.invalidateQueries({queryKey: ['get-agentic-services']});
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

export const useDeleteAgenticService = ({callbacks}: PropsSettingsAgenticServices) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['delete-agentic-service'],
    mutationFn: (id: string) => AgenticServicesAPI.deleteApp(id),
    onSettled: async () => {
      await queryClient.invalidateQueries({queryKey: ['get-agentic-services']});
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
