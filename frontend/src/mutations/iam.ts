/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
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
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
      await queryClient.invalidateQueries({queryKey: ['get-tenants']});
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
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
      await queryClient.invalidateQueries({queryKey: ['get-tenants']});
      await queryClient.invalidateQueries({queryKey: ['get-tenant']});
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
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
      await queryClient.invalidateQueries({queryKey: ['get-tenants']});
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
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
      await queryClient.invalidateQueries({queryKey: ['get-tenant-groups']});
      await queryClient.invalidateQueries({queryKey: ['get-users-group']});
    }
  });
};

export const useDeleteUser = ({callbacks}: PropsSettingsInviteUser) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['delete-user'],
    mutationFn: ({userId, tenantId}: {userId: string; tenantId: string}) => IamAPI.deleteUser(userId, tenantId),
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: async (resp) => {
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
      await queryClient.invalidateQueries({queryKey: ['get-tenant-groups']});
      await queryClient.invalidateQueries({queryKey: ['get-users-group']});
    }
  });
};
