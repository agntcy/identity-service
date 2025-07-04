/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AxiosResponse} from 'axios';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {PolicyAPI} from '@/api/services';
import {CreatePolicyRequest, CreateRuleBody, Policy, Rule} from '@/types/api/policy';

interface PropsSettingsPolicies {
  callbacks?: {
    onSuccess?: (props: AxiosResponse<Policy, any>) => void;
    onError?: () => void;
  };
}

interface PropsSettingsRules {
  callbacks?: {
    onSuccess?: (props: AxiosResponse<Rule, any>) => void;
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

export const useCreateRule = ({callbacks}: PropsSettingsRules) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['create-rule'],
    mutationFn: ({id, data}: {id?: string; data: CreateRuleBody}) => PolicyAPI.createRule(id!, data),
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
