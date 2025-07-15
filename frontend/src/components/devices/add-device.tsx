/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, EmptyState, Modal, ModalActions, ModalContent, ModalSubtitle, ModalTitle, toast} from '@outshift/spark-design';
import {Card} from '../ui/card';
import {PlusIcon} from 'lucide-react';
import {useCallback, useMemo, useState} from 'react';
import {useAddDevice} from '@/mutations';
import {Device} from '@/types/api/device';
import QRCode from 'react-qr-code';

export const AddDevice = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [device, setDevice] = useState<Device | undefined>();

  const handleChange = useCallback((value: boolean) => {
    setOpen(value);
  }, []);

  const addDeviceMutation = useAddDevice({
    callbacks: {
      onSuccess: (resp) => {
        setDevice(resp.data);
        toast({
          title: 'Device added successfully',
          description: 'The device has been added to your account.',
          type: 'success'
        });
        handleChange(true);
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

  const link = useMemo(() => {
    if (device) {
      return `${window.location.origin}/onboard-device/${device.id}`;
    }
    return '';
  }, [device]);

  const handleOnAddDevice = useCallback(() => {
    addDeviceMutation.mutate({});
  }, [addDeviceMutation]);

  console.log('Device link:', link);

  return (
    <>
      <Card variant="secondary">
        <EmptyState
          title="Add Device"
          description="Register a new device to your account. This will allow you to manage and authenticate your devices securely."
          containerProps={{paddingBottom: '40px'}}
          actionTitle="Add Device"
          actionCallback={handleOnAddDevice}
          actionButtonProps={{
            sx: {fontWeight: '600 !important'},
            startIcon: <PlusIcon className="w-4 h-4" />,
            variant: 'outlined',
            loading: addDeviceMutation.isPending,
            loadingPosition: 'start'
          }}
        />
      </Card>
      <Modal maxWidth="lg" fullWidth open={open} onClose={handleChange}>
        <ModalTitle>Add Device</ModalTitle>
        <ModalSubtitle>
          Scan the QR code below with your device to register it to your account.
          <br />
          Ensure that you have the necessary permissions to add a device.
        </ModalSubtitle>
        <ModalContent>
          <div style={{height: 'auto', margin: '0 auto', maxWidth: '200px', width: '100%'}} className="pt-4">
            <QRCode size={256} style={{height: 'auto', maxWidth: '100%', width: '100%'}} viewBox={`0 0 256 256`} bgColor="#fbfcfe" value={link} />
          </div>
        </ModalContent>
        <ModalActions>
          <Button onClick={() => handleChange(false)} variant="tertariary" sx={{fontWeight: '600 !important'}}>
            Cancel
          </Button>
          <Button onClick={() => handleChange(false)} sx={{fontWeight: '600 !important'}}>
            Done
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
};
