/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useAddDevice, useDeleteDevice} from '@/mutations';
import {useGetDevices} from '@/queries';
import {CardContent, toast, Typography} from '@outshift/spark-design';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ConfirmModal} from '../ui/confirm-modal';
import {useAnalytics} from '@/hooks';
import {Device} from '@/types/api/device';
import {PATHS} from '@/router/paths';
import getDeviceInfo from '@/lib/device';
import {QRCodeModal} from '../shared/qr-code-modal';
import {Card} from '../ui/card';
import KeyValue from '../ui/key-value';
import DateHover from '../ui/date-hover';
import {IconButton, Menu, MenuItem, Tooltip} from '@mui/material';
import {EllipsisVerticalIcon, Trash2Icon} from 'lucide-react';

export const ListDevices: React.FC = () => {
  const [openQrCodeModal, setQrCodeModal] = useState(false);
  const [device, setDevice] = useState<Device | undefined>();
  const [openActionsModal, setOpenActionsModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const {data, error, isLoading, refetch} = useGetDevices();

  const {analyticsTrack} = useAnalytics();

  const deleteMutation = useDeleteDevice({
    callbacks: {
      onSuccess: () => {
        setDevice(undefined);
        toast({
          title: 'Success',
          description: 'Device deleted successfully.',
          type: 'success'
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'An error occurred while deleting the device. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const addDeviceMutation = useAddDevice({
    callbacks: {
      onSuccess: (resp) => {
        setDevice(resp.data);
        toast({
          title: 'Device added successfully',
          description: 'The device has been added to your account.',
          type: 'info'
        });
        handleChangeQrCodeModal(true);
      },
      onError: () => {
        setDevice(undefined);
        toast({
          title: 'Error adding device',
          description: 'An error occurred while adding the device. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const handleChangeActionsModal = useCallback((value: boolean) => {
    setOpenActionsModal(value);
  }, []);

  const handleConfirmAction = useCallback(() => {
    if (device?.id) {
      analyticsTrack('CLICK_DELETE_DEVICE');
      deleteMutation.mutate(device.id);
    }
    setOpenActionsModal(false);
  }, [analyticsTrack, deleteMutation, device]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleChangeQrCodeModal = useCallback((value: boolean) => {
    setQrCodeModal(value);
  }, []);

  const link = useMemo(() => {
    if (device) {
      const path = `${PATHS.onboardDevice.base}?id=${device.id}`;
      return `${window.location.origin}${path}`;
    }
    return undefined;
  }, [device]);

  const keyValuePairs = useMemo(() => {
    const temp = [
      {
        keyProp: 'Name',
        value: device?.name || 'Not provided'
      },
      {
        keyProp: 'Created At',
        value: <DateHover date={device?.createdAt} />
      }
    ];
    return temp;
  }, [device]);

  const handleOnAddDevice = useCallback(() => {
    if ((data?.devices?.length ?? 0) < 1) {
      analyticsTrack('CLICK_ADD_DEVICE');
      const {name} = getDeviceInfo();
      addDeviceMutation.mutate({
        name: name || 'Unknown Device'
      });
    } else {
      toast({
        title: 'Device Limit Reached',
        description:
          'You can only have one device registered at a time. Please remove the existing device before adding a new one.',
        type: 'error'
      });
      return;
    }
  }, [addDeviceMutation, analyticsTrack, data?.devices?.length]);

  useEffect(() => {
    if (data && data.devices && data.devices.length > 0) {
      setDevice(data.devices[0]);
    }
  }, [data, data?.devices]);

  return (
    <>
      <ConditionalQueryRenderer
        itemName="Devices"
        data={data?.devices || device}
        error={error}
        isLoading={isLoading}
        useRelativeLoader
        emptyListStateProps={{
          title: 'Add Device',
          description:
            'Register a new device to your account. This will allow you to manage and authenticate your devices securely.',
          actionTitle: 'Add Device',
          actionCallback: () => {
            handleOnAddDevice();
          }
        }}
        errorListStateProps={{
          actionCallback: () => {
            void refetch();
          }
        }}
      >
        <Card className="text-start space-y-6" variant="secondary">
          <div className="flex justify-between items-start">
            <Typography variant="subtitle1" fontWeight={600}>
              About
            </Typography>
            <div>
              <Tooltip title="Actions" arrow>
                <IconButton
                  sx={(theme) => ({
                    color: theme.palette.vars.baseTextDefault,
                    width: '24px',
                    height: '24px'
                  })}
                  onClick={handleClick}
                >
                  <EllipsisVerticalIcon className="h-4 w-4" />
                </IconButton>
              </Tooltip>
              <Menu
                transformOrigin={{horizontal: 'right', vertical: 'top'}}
                anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={handleClose}
              >
                <MenuItem
                  key="delete-device"
                  onClick={() => {
                    analyticsTrack('CLICK_DELETE_DEVICE');
                    handleChangeActionsModal(true);
                  }}
                  sx={{display: 'flex', alignItems: 'center', gap: '8px'}}
                >
                  <Trash2Icon className="w-4 h-4" color="#C62953" />
                  <Typography variant="body2" color="#C0244C">
                    Delete
                  </Typography>
                </MenuItem>
              </Menu>
            </div>
          </div>
          <CardContent className="p-0 space-y-4">
            <KeyValue pairs={keyValuePairs} useCard={false} />
          </CardContent>
        </Card>
        <ConfirmModal
          open={openActionsModal}
          title="Confirm Action"
          description="Are you sure you want to delete this device? This action cannot be undone."
          confirmButtonText="Delete Device"
          onCancel={() => handleChangeActionsModal(false)}
          onConfirm={handleConfirmAction}
        />
      </ConditionalQueryRenderer>
      <QRCodeModal
        open={openQrCodeModal}
        title="Add Device"
        subtitle={
          <>
            Scan the QR code below with your device to register it to your account.
            <br />
            Ensure that you have the necessary permissions to add a device.
          </>
        }
        link={link}
        onClose={() => {
          handleChangeQrCodeModal(false);
        }}
      />
    </>
  );
};
