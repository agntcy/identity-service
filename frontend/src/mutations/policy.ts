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

export const useCreatePolicy = ({callbacks}: PropsSettingsPolicies = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['create-policy'],
    mutationFn: (data: CreatePolicyRequest) => PolicyAPI.createPolicy(data),
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: async (resp) => {
      await queryClient.invalidateQueries({queryKey: ['get-policies']});
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
    }
  });
};

export const useUpdatePolicy = ({callbacks}: PropsSettingsPolicies = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['update-policy'],
    mutationFn: ({id, data}: {id: string; data: CreatePolicyRequest}) => PolicyAPI.updatePolicy(id, data),
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: async (resp) => {
      await queryClient.invalidateQueries({queryKey: ['get-policies']});
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
    }
  });
};

export const useDeletePolicy = ({callbacks}: PropsSettingsPolicies = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['delete-policy'],
    mutationFn: (id: string) => PolicyAPI.deletePolicy(id),
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: async (resp) => {
      await queryClient.invalidateQueries({queryKey: ['get-policies']});
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
    }
  });
};

export const useCreateRule = ({callbacks}: PropsSettingsRules = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['create-rule'],
    mutationFn: ({id, data}: {id?: string; data: CreateRuleBody}) => PolicyAPI.createRule(id!, data),
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: async (resp) => {
      await queryClient.invalidateQueries({queryKey: ['get-policies']});
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
    }
  });
};

export const useUpdateRule = ({callbacks}: PropsSettingsRules = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['update-rule'],
    mutationFn: ({policyId, ruleId, data}: {policyId: string; ruleId: string; data: CreateRuleBody}) => PolicyAPI.updateRule(policyId, ruleId, data),
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: async (resp) => {
      await queryClient.invalidateQueries({queryKey: ['get-policies']});
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
    }
  });
};

export const useDeleteRule = ({callbacks}: PropsSettingsRules = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['delete-rule'],
    mutationFn: ({policyId, ruleId}: {policyId: string; ruleId: string}) => PolicyAPI.deleteRule(policyId, ruleId),
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: async (resp) => {
      await queryClient.invalidateQueries({queryKey: ['get-policies']});
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
    }
  });
};
