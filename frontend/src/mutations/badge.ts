/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {AxiosResponse} from 'axios';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {Badge, IssueBadgeBody, VerificationResult, VerifyBadgeRequest} from '@/types/api/badge';
import {BadgeAPI} from '@/api/services/badge-api';

interface PropsSettingsVerificationResult {
  callbacks?: {
    onSuccess?: (props: AxiosResponse<VerificationResult, any>) => void;
    onError?: () => void;
  };
}

interface PropsSetIdentityBadge {
  callbacks?: {
    onSuccess?: (props: AxiosResponse<Badge, any>) => void;
    onError?: () => void;
  };
}

export const useVerifyBadge = ({callbacks}: PropsSettingsVerificationResult) => {
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
