/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AxiosResponse} from 'axios';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {IamAPI} from '@/api/services';
import {TenantReponse} from '@/types/api/iam';

interface PropsSettingsTenant {
  callbacks?: {
    onSuccess?: (props: AxiosResponse<TenantReponse, any>) => void;
    onError?: () => void;
  };
}

export const useCreateTenant = ({callbacks}: PropsSettingsTenant) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['create-tenant'],
    mutationFn: () => IamAPI.createTenant(),
    onSettled: async () => {
      await queryClient.invalidateQueries({queryKey: ['get-tenants']});
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

export const useUpdateTenant = ({callbacks}: PropsSettingsTenant) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['update-tenant'],
    mutationFn: ({id, name}: {id: string; name: string}) => IamAPI.updateTenant(id, name),
    onSettled: async () => {
      await queryClient.invalidateQueries({queryKey: ['get-tenants']});
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

export const useDeleteTenant = ({callbacks}: PropsSettingsTenant) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['delete-tenant'],
    mutationFn: (id: string) => IamAPI.deleteTenant(id),
    onSettled: async () => {
      await queryClient.invalidateQueries({queryKey: ['get-tenants']});
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
