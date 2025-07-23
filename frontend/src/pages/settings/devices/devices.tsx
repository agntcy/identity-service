/* eslint-disable indent */
/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ListDevices} from '@/components/devices/list-devices';
import {BasePage} from '@/components/layout/base-page';
import {QRCodeModal} from '@/components/shared/helpers/qr-code-modal';
import {useAnalytics} from '@/hooks';
import {useAddDevice} from '@/mutations';
import {PATHS} from '@/router/paths';
import {useFeatureFlagsStore} from '@/store';
import {Device} from '@/types/api/device';
import {Button, toast} from '@outshift/spark-design';
import {useQueryClient} from '@tanstack/react-query';
import {PlusIcon} from 'lucide-react';
import React, {useCallback, useMemo, useState} from 'react';
import {useShallow} from 'zustand/react/shallow';

const Devices: React.FC = () => {
  const [tempDevice, setTempDevice] = useState<Device | undefined>();
  const [openQrCodeModal, setQrCodeModal] = useState(false);

  const {isTbacEnable} = useFeatureFlagsStore(
    useShallow((state) => ({
      isTbacEnable: state.featureFlags.isTbacEnable
    }))
  );

  const {analyticsTrack} = useAnalytics();
  const queryClient = useQueryClient();

  const link = useMemo(() => {
    if (tempDevice) {
      const path = `${PATHS.onboardDevice.base}?id=${tempDevice.id}`;
      return `${window.location.origin}${path}`;
    }
    return undefined;
  }, [tempDevice]);

  const subNav = useMemo(() => {
    return [
      {
        label: 'Identity Provider',
        href: PATHS.settings.identityProvider.base
      },
      {
        label: 'API Key',
        href: PATHS.settings.apiKey
      },
      ...(isTbacEnable
        ? [
            {
              label: 'Devices',
              href: PATHS.settings.devices.base
            }
          ]
        : []),
      {
        label: 'Organizations & Users',
        href: PATHS.settings.organizationsAndUsers.base
      }
    ];
  }, [isTbacEnable]);

  const addDeviceMutation = useAddDevice({
    callbacks: {
      onSuccess: (resp) => {
        setTempDevice(resp.data);
        toast({
          title: 'Onboarding Device',
          description: "Don't forget to scan the QR code with your device.",
          type: 'info'
        });
        handleChangeQrCodeModal(true);
      },
      onError: () => {
        setTempDevice(undefined);
        toast({
          title: 'Error adding device',
          description: 'An error occurred while adding the device. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const handleOnAddDevice = useCallback(() => {
    analyticsTrack('CLICK_ADD_DEVICE');
    addDeviceMutation.mutate({});
  }, [addDeviceMutation, analyticsTrack]);

  const handleChangeQrCodeModal = useCallback((value: boolean) => {
    setQrCodeModal(value);
  }, []);

  const handleClickDone = useCallback(() => {
    setTempDevice(undefined);
    handleChangeQrCodeModal(false);
    void queryClient.invalidateQueries({queryKey: ['get-devices']});
  }, [handleChangeQrCodeModal, queryClient]);

  return (
    <BasePage
      title="Devices"
      subNav={subNav}
      breadcrumbs={[
        {
          text: 'Settings',
          link: PATHS.settings.base
        },
        {
          text: 'Devices'
        }
      ]}
      rightSideItems={
        <Button
          loading={addDeviceMutation.isPending}
          loadingPosition="start"
          onClick={handleOnAddDevice}
          variant="outlined"
          startIcon={<PlusIcon className="w-4 h-4" />}
          fullWidth
          sx={{fontWeight: '600 !important'}}
        >
          Add Device
        </Button>
      }
    >
      <ListDevices />
      <QRCodeModal
        open={openQrCodeModal}
        title="Onboard Device"
        subtitle={<>Scan the QR code below with your device to register it to your account.</>}
        link={link}
        onClose={() => {
          handleClickDone();
        }}
      />
    </BasePage>
  );
};

export default Devices;
