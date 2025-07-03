/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AxiosResponse} from 'axios';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {PolicyAPI} from '@/api/services';
import {CreatePolicyRequest, Policy} from '@/types/api/policy';

interface PropsSettingsPolicies {
  callbacks?: {
    onSuccess?: (props: AxiosResponse<Policy, any>) => void;
    onError?: () => void;
  };
}

export const useCreatePolicy = ({callbacks}: PropsSettingsPolicies) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['create-policy'],
    mutationFn: (data: CreatePolicyRequest) => PolicyAPI.createPolicy(data),
    onSettled: async () => {
      await queryClient.invalidateQueries({queryKey: ['get-policies']});
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

// export const useUpdateAgenticService = ({callbacks}: PropsSettingsAgenticServices) => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationKey: ['update-agentic-service'],
//     mutationFn: ({id, data}: {id: string; data: App}) => AgenticServicesAPI.updateApp(id, data),
//     onSettled: async () => {
//       await queryClient.invalidateQueries({queryKey: ['get-agentic-services']});
//     },
//     onError: () => {
//       if (callbacks?.onError) {
//         callbacks.onError();
//       }
//     },
//     onSuccess: (resp) => {
//       if (callbacks?.onSuccess) {
//         callbacks.onSuccess(resp);
//       }
//     }
//   });
// };

export const useDeletePolicy = ({callbacks}: PropsSettingsPolicies) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['delete-policy'],
    mutationFn: (id: string) => PolicyAPI.deletePolicy(id),
    onSettled: async () => {
      await queryClient.invalidateQueries({queryKey: ['get-policies']});
      await queryClient.invalidateQueries({queryKey: ['get-policy']});
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
