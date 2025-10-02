/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AxiosResponse} from 'axios';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {DevicesAPI} from '@/api/services';
import {Device} from '@/types/api/device';

interface PropsSettingsDevices {
  callbacks?: {
    onSuccess?: (props: AxiosResponse<Device, any>) => void;
    onError?: () => void;
  };
}

export const useAddDevice = ({callbacks}: PropsSettingsDevices) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['add-device'],
    mutationFn: (data: Device) => DevicesAPI.addDevice(data),
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: async (resp) => {
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
      await queryClient.invalidateQueries({queryKey: ['get-devices']});
    }
  });
};

export const useRegisterDevice = ({callbacks = {}}: PropsSettingsDevices) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['register-device'],
    mutationFn: ({id, data}: {id: string; data: Device}) => DevicesAPI.registerDevice(id, data),
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: async (resp) => {
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
      await queryClient.invalidateQueries({queryKey: ['get-devices']});
    }
  });
};

export const useDeleteDevice = ({callbacks = {}}: PropsSettingsDevices) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['delete-device'],
    mutationFn: (id: string) => DevicesAPI.deleteDevice(id),
    onError: () => {
      if (callbacks?.onError) {
        callbacks.onError();
      }
    },
    onSuccess: async (resp) => {
      if (callbacks?.onSuccess) {
        callbacks.onSuccess(resp);
      }
      await queryClient.invalidateQueries({queryKey: ['get-devices']});
    }
  });
};

export const useTestDevice = ({callbacks = {}}: PropsSettingsDevices) => {
  return useMutation({
    mutationKey: ['test-device'],
    mutationFn: (id: string) => DevicesAPI.testDevice(id),
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
