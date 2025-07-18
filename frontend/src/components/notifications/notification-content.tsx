/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerProps} from '@/components/ui/drawer';
import {Button, GeneralSize, Tag, TagStatus, toast, Typography} from '@outshift/spark-design';
import {BanIcon, CheckIcon} from 'lucide-react';
import {CountDownTimer} from '../ui/count-down-timer';
import {useCallback, useState} from 'react';
import {INotification, NotificationType} from '@/types/sw/notification';
import {useAproveToken} from '@/mutations';

interface NotificationContentProps extends Omit<DrawerProps, 'ref' | 'fadeFromIndex' | 'open' | 'onOpenChange'> {
  notification?: INotification;
  useOverlay?: boolean;
  onHandleRequest?: (notification?: INotification) => void;
}

export const NotificationContent = ({
  notification,
  defaultOpen,
  onHandleRequest,
  useOverlay,
  ...props
}: NotificationContentProps) => {
  const [isLoadingApprove, setIsLoadingApprove] = useState(false);
  const [isLoadingDeny, setIsLoadingDeny] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const [timerEnded, setTimerEnded] = useState(false);

  const zIndex = notification?.timestamp ? Math.floor((Date.now() - notification.timestamp) / 1000) : 0;

  const aproveTokenMutation = useAproveToken({
    callbacks: {
      onSuccess: () => {
        onHandleRequest?.(notification);
        setOpen(false);
        setIsLoadingApprove(false);
        setIsLoadingDeny(false);
        setTimerEnded(true);
        toast({
          title: 'Success',
          description: 'Your request has been processed successfully.',
          type: 'success'
        });
      },
      onError: () => {
        setIsLoadingApprove(false);
        setIsLoadingDeny(false);
        toast({
          title: 'Error',
          description: 'An error occurred while processing your request.',
          type: 'error'
        });
      }
    }
  });

  const handleOnComplete = useCallback(() => {
    setOpen(false);
    setIsLoadingApprove(false);
    setIsLoadingDeny(false);
    setTimerEnded(true);
  }, []);

  const handleAllow = useCallback(() => {
    setIsLoadingApprove(true);
    aproveTokenMutation.mutate({
      deviceId: notification?.approval_request_info?.device_id,
      sessionId: notification?.approval_request_info?.session_id,
      otp: notification?.approval_request_info?.otp,
      approve: true
    });
  }, [aproveTokenMutation, notification]);

  const handleDeny = useCallback(() => {
    setIsLoadingDeny(true);
    aproveTokenMutation.mutate({
      deviceId: notification?.approval_request_info?.device_id,
      sessionId: notification?.approval_request_info?.session_id,
      otp: notification?.approval_request_info?.otp,
      approve: false
    });
  }, [aproveTokenMutation, notification]);

  return (
    <Drawer open={open} onOpenChange={setOpen} dismissible={timerEnded} {...props}>
      <DrawerContent
        useOverlay={useOverlay}
        className="max-h-screen space-y-4"
        style={{height: 'calc(65vh - 56px)', zIndex: 3000 + zIndex}}
      >
        <DrawerHeader className="space-y-4">
          <div>
            <Typography variant="h6">
              {notification?.type === NotificationType.APPROVAL_REQUEST ? 'Approval Request' : 'Notification'}
            </Typography>
          </div>
          <div>
            <Typography variant="body1Semibold" className="text-muted-foreground">
              {notification?.body || 'You have a new notification.'}
            </Typography>
          </div>
        </DrawerHeader>
        <div className="flex justify-center items-center">
          {notification?.approval_request_info?.tool_name && (
            <div>
              <Tag size={GeneralSize.Medium} status={TagStatus.Info}>
                Tool: {notification?.approval_request_info?.tool_name || 'Unknown Tool'}
              </Tag>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center justify-center h-full">
          {notification?.type === NotificationType.APPROVAL_REQUEST &&
            notification.approval_request_info?.timeout_in_seconds && (
              <CountDownTimer
                duration={notification.approval_request_info?.timeout_in_seconds}
                onComplete={handleOnComplete}
              />
            )}
        </div>
        {notification?.type === NotificationType.APPROVAL_REQUEST && (
          <DrawerFooter>
            <div className="flex justify-between gap-8 py-4">
              <Button
                variant="outlined"
                sx={{
                  fontWeight: 'bold !important'
                }}
                color="negative"
                fullWidth
                startIcon={<BanIcon className="w-4 h-4" />}
                disabled={timerEnded || aproveTokenMutation.isPending}
                onClick={handleDeny}
                loading={isLoadingDeny}
                loadingPosition="start"
              >
                Deny
              </Button>
              <Button
                sx={{
                  fontWeight: 'bold !important'
                }}
                fullWidth
                startIcon={<CheckIcon className="w-4 h-4" />}
                disabled={timerEnded || aproveTokenMutation.isPending}
                onClick={handleAllow}
                loading={isLoadingApprove}
                loadingPosition="start"
              >
                Allow
              </Button>
            </div>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
};
