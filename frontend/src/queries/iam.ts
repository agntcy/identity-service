/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {IamAPI} from '@/api/platforms';
import {useQuery} from '@tanstack/react-query';

export const useGetTenants = () => {
  return useQuery({
    queryKey: ['get-tenants'],
    queryFn: async () => {
      const {data} = await IamAPI.getTenants();
      return data;
    }
  });
};

export const useGetSession = () => {
  return useQuery({
    queryKey: ['get-session'],
    queryFn: async () => {
      const {data} = await IamAPI.getSession();
      return data;
    }
  });
};

export const useGetTenant = (tenantId: string) => {
  return useQuery({
    queryKey: ['get-tenant', tenantId],
    queryFn: async () => {
      const {data} = await IamAPI.getTenant(tenantId);
      return data;
    },
    enabled: !!tenantId
  });
};

export const useGetUsersGroup = (groupId: string) => {
  return useQuery({
    queryKey: ['get-users-group', groupId],
    queryFn: async () => {
      const {data} = await IamAPI.getUsersGroups(groupId);
      return data;
    },
    enabled: !!groupId
  });
};

export const useGetGroupsTenant = (tenantId: string) => {
  return useQuery({
    queryKey: ['get-tenant-groups', tenantId],
    queryFn: async () => {
      const {data} = await IamAPI.getGroupsTenant(tenantId);
      return data;
    },
    enabled: !!tenantId
  });
};
