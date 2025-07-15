/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AxiosResponse} from 'axios';
import {useMutation} from '@tanstack/react-query';
import {DevicesAPI} from '@/api/services';
import {Device} from '@/types/api/device';

interface PropsSettingsDevices {
  callbacks?: {
    onSuccess?: (props: AxiosResponse<Device, any>) => void;
    onError?: () => void;
  };
}

export const useAddDevice = ({callbacks}: PropsSettingsDevices) => {
  return useMutation({
    mutationKey: ['add-device'],
    mutationFn: (data: Device) => DevicesAPI.addDevice(data),
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

export const useRegisterDevice = ({callbacks = {}}: PropsSettingsDevices) => {
  return useMutation({
    mutationKey: ['register-device'],
    mutationFn: ({id, data}: {id: string; data: Device}) => DevicesAPI.registerDevice(id, data),
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
