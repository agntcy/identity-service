/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {IamAPI} from '@/api/services';
import {isMultiTenant} from '@/utils/auth';
import {useQuery} from '@tanstack/react-query';

export const useGetTenants = () => {
  const isMulti = isMultiTenant();
  return useQuery({
    queryKey: ['get-tenants'],
    queryFn: async () => {
      const {data} = await IamAPI.getTenants();
      return data;
    },
    enabled: isMulti
  });
};

export const useGetSession = () => {
  const isMulti = isMultiTenant();
  return useQuery({
    queryKey: ['get-session'],
    queryFn: async () => {
      const {data} = await IamAPI.getSession();
      return data;
    },
    enabled: isMulti
  });
};

export const useGetTenant = (tenantId: string) => {
  const isMulti = isMultiTenant();

  return useQuery({
    queryKey: ['get-tenant', tenantId],
    queryFn: async () => {
      const {data} = await IamAPI.getTenant(tenantId);
      return data;
    },
    enabled: !!tenantId && isMulti
  });
};

export const useGetUsersGroup = (groupId: string) => {
  const isMulti = isMultiTenant();
  return useQuery({
    queryKey: ['get-users-group', groupId],
    queryFn: async () => {
      const {data} = await IamAPI.getUsersGroups(groupId);
      return data;
    },
    enabled: !!groupId && isMulti
  });
};

export const useGetGroupsTenant = (tenantId: string) => {
  const isMulti = isMultiTenant();
  return useQuery({
    queryKey: ['get-tenant-groups', tenantId],
    queryFn: async () => {
      const {data} = await IamAPI.getGroupsTenant(tenantId);
      return data;
    },
    enabled: !!tenantId && isMulti
  });
};
