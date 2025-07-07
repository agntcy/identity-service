/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AxiosResponse} from 'axios';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {Badge, BadgeClaims, IssueBadgeBody, VerifyBadgeRequest} from '@/types/api/badge';
import {BadgeAPI} from '@/api/services/badge-api';

interface PropsSettingsBadgeClaims {
  callbacks?: {
    onSuccess?: (props: AxiosResponse<BadgeClaims, any>) => void;
    onError?: () => void;
  };
}

interface PropsSetIdentityBadge {
  callbacks?: {
    onSuccess?: (props: AxiosResponse<Badge, any>) => void;
    onError?: () => void;
  };
}

export const useVerifyBadge = ({callbacks}: PropsSettingsBadgeClaims) => {
  return useMutation({
    mutationKey: ['verify-badge'],
    mutationFn: (data: VerifyBadgeRequest) => BadgeAPI.verifyBadge(data),
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

export const useIssueBadge = ({callbacks}: PropsSetIdentityBadge) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['issue-badge'],
    mutationFn: ({id, data}: {id: string; data: IssueBadgeBody}) => BadgeAPI.issueBadge(id, data),
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: async (resp) => {
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
      await queryClient.invalidateQueries({queryKey: ['get-agentic-service-badge']});
    }
  });
};
