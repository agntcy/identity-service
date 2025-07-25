/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {PolicyAPI} from '@/api/services';
import {keepPreviousData, useQuery} from '@tanstack/react-query';
import qs from 'qs';

export const useGetPolicies = ({
  query,
  enable = true
}: {
  query?: {
    page?: number;
    size?: number;
    query?: string;
    appIds?: string[];
    rulesForAppIds?: string[];
  };
  enable?: boolean;
}) => {
  return useQuery({
    queryKey: [
      'get-policies',
      {
        page: query?.page,
        size: query?.size,
        query: query?.query,
        appIds: query?.appIds,
        rulesForAppIds: query?.rulesForAppIds
      },
      enable
    ],
    queryFn: async () => {
      const {data} = await PolicyAPI.listPolicies(
        {
          page: query?.page,
          size: query?.size,
          query: query?.query,
          appIds: query?.appIds,
          rulesForAppIds: query?.rulesForAppIds
        },
        {
          paramsSerializer: (params) => {
            return qs.stringify(params);
          }
        }
      );
      return data;
    },
    enabled: enable !== false,
    placeholderData: keepPreviousData
  });
};

export const useGetPolicy = (id?: string) => {
  return useQuery({
    queryKey: ['get-policy', id],
    queryFn: async () => {
      const {data} = await PolicyAPI.getPolicy(id!);
      return data;
    },
    enabled: !!id
  });
};

export const useGetPolicyRules = ({
  query,
  policyId,
  enable = true
}: {
  policyId?: string;
  query?: {page?: number; size?: number; query?: string};
  enable?: boolean;
}) => {
  return useQuery({
    queryKey: [
      'get-policy-rules',
      {
        page: query?.page,
        size: query?.size,
        query: query?.query
      },
      enable,
      policyId
    ],
    queryFn: async () => {
      const {data} = await PolicyAPI.listRules(
        policyId!,
        {
          page: query?.page,
          size: query?.size,
          query: query?.query
        },
        {
          paramsSerializer: (params) => {
            return qs.stringify(params);
          }
        }
      );
      return data;
    },
    enabled: enable !== false && !!policyId,
    placeholderData: keepPreviousData
  });
};

export const useGetRule = (policyId?: string, ruleId?: string) => {
  return useQuery({
    queryKey: ['get-rule', policyId, ruleId],
    queryFn: async () => {
      const {data} = await PolicyAPI.getRule(policyId!, ruleId!);
      return data;
    },
    enabled: !!policyId && !!ruleId
  });
};

export const useGetPoliciesCount = ({enabled = true}: {enabled?: boolean}) => {
  return useQuery({
    queryKey: ['get-policies-total-count'],
    queryFn: async () => {
      const {data} = await PolicyAPI.getPoliciesCount();
      return data;
    },
    enabled
  });
};
