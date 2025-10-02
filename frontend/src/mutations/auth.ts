/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AxiosResponse} from 'axios';
import {useMutation} from '@tanstack/react-query';
import {AuthAPI} from '@/api/services';
import {ApproveTokenRequest} from '@/types/api/auth';

interface PropSettingsAuth {
  callbacks?: {
    onSuccess?: (props: AxiosResponse<any, any>) => void;
    onError?: () => void;
  };
}

export const useAproveToken = ({callbacks = {}}: PropSettingsAuth) => {
  return useMutation({
    mutationKey: ['approve-token'],
    mutationFn: (data: ApproveTokenRequest) => AuthAPI.approveToken(data),
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
