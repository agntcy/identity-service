/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Modal, ModalActions, ModalContent, ModalProps, ModalTitle, toast} from '@outshift/spark-design';
import {useNotifications} from '@/hooks';
import {Button, Typography} from '@mui/material';
import {BellIcon, BellOffIcon, RefreshCcwIcon} from 'lucide-react';
import {GeneralSize, Tag, TagStatus} from '@outshift/spark-design';
import {Card} from '@/components/ui/card';
import {useCallback} from 'react';
import {useAddDevice} from '@/mutations';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface NotificationSettingsProps extends ModalProps {}

export const NotificationSettings = (props: NotificationSettingsProps) => {
  const {enabled, supported, handleToggleNotifications, fixNotifications, loading} = useNotifications();

  const addDeviceMutation = useAddDevice({
    callbacks: {
      onSuccess: (resp) => {
        handleToggleNotifications(resp.data.id);
      },
      onError: () => {
        toast({
          title: 'Error adding device',
          description: 'An error occurred while adding the device. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const handler = useCallback(() => {
    addDeviceMutation.mutate({});
  }, [addDeviceMutation]);

  return (
    <Modal {...props} maxWidth="md" fullWidth>
      <ModalTitle>Notifications</ModalTitle>
      <ModalContent>
        <div>
          <Card variant="secondary" className="w-full mx-auto space-y-6">
            <div className="flex gap-4 items-center">
              {enabled ? <BellIcon className="h-5 w-5 text-green-600" /> : <BellOffIcon className="h-5 w-5 text-gray-400" />}
              <Typography variant="body1Semibold">Notification Status</Typography>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Typography variant="captionSemibold">Push Notifications</Typography>
                <Tag
                  size={GeneralSize.Small}
                  status={!supported ? TagStatus.Negative : enabled ? TagStatus.Positive : TagStatus.Info}
                  className="text-xs"
                >
                  {supported ? (enabled ? 'Enabled' : 'Disabled') : 'Not Supported'}
                </Tag>
              </div>
              <div className="pt-2">
                <Button
                  startIcon={enabled ? <BellOffIcon className="w-4 h-4" /> : <BellIcon className="w-4 h-4" />}
                  onClick={handler}
                  fullWidth
                  variant={enabled ? 'outlined' : 'primary'}
                  sx={{fontWeight: 'bold !important'}}
                  loading={loading || addDeviceMutation.isPending}
                  loadingPosition="start"
                  disabled={!supported}
                >
                  {enabled ? 'Disable Notifications' : 'Enable Notifications'}
                </Button>
              </div>
              {supported && enabled && (
                <div>
                  <Button
                    onClick={fixNotifications}
                    fullWidth
                    variant="secondary"
                    startIcon={<RefreshCcwIcon className="w-4 h-4" />}
                    sx={{fontWeight: 'bold !important'}}
                    disabled={!supported || loading}
                  >
                    Fix Notification Issues
                  </Button>
                </div>
              )}
              {supported && enabled && (
                <>
                  <div className="text-center">
                    <Typography variant="caption">
                      {enabled
                        ? "You'll receive notifications with Allow/Deny actions. Responses are tracked automatically."
                        : 'Enable notifications to receive allow/deny prompts from the web dashboard.'}
                    </Typography>
                  </div>
                  <div className="text-center">
                    <Typography variant="captionMedium">
                      If notifications show a 404 error when tapped, use &quot;Fix Notification Issues&quot; button above.
                    </Typography>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </ModalContent>
      <ModalActions>
        <Button
          variant="tertariary"
          onClick={(e) => props.onClose?.(e, 'backdropClick')}
          sx={{
            fontWeight: 'bold !important'
          }}
        >
          Close
        </Button>
      </ModalActions>
    </Modal>
  );
};
