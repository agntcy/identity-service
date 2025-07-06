/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AxiosResponse} from 'axios';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {IamAPI} from '@/api/services';
import {InviteUserPayload, TenantReponse} from '@/types/api/iam';

interface PropsSettingsTenant {
  callbacks?: {
    onSuccess?: (props: AxiosResponse<TenantReponse, any>) => void;
    onError?: () => void;
  };
}

interface PropsSettingsInviteUser {
  callbacks?: {
    onSuccess?: (props: AxiosResponse<any, any>) => void;
    onError?: () => void;
  };
}

export const useCreateTenant = ({callbacks}: PropsSettingsTenant) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['create-tenant'],
    mutationFn: () => IamAPI.createTenant(),
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: async (resp) => {
      await queryClient.invalidateQueries({queryKey: ['get-tenants']});
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
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: async (resp) => {
      await queryClient.invalidateQueries({queryKey: ['get-tenants']});
      await queryClient.invalidateQueries({queryKey: ['get-tenant']});
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
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: async (resp) => {
      await queryClient.invalidateQueries({queryKey: ['get-tenants']});
      await queryClient.invalidateQueries({queryKey: ['get-tenant']});
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
    }
  });
};

export const useInviteUser = ({callbacks}: PropsSettingsInviteUser) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['invite-user'],
    mutationFn: ({groupId, data}: {groupId: string; data: InviteUserPayload}) => IamAPI.inviteUser(groupId, data),
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: async (resp) => {
      await queryClient.invalidateQueries({queryKey: ['get-tenant-groups']});
      await queryClient.invalidateQueries({queryKey: ['get-users-group']});
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
    }
  });
};
