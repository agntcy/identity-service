/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerProps} from '@/components/ui/drawer';
import {Button, GeneralSize, Tag, TagStatus, toast, Typography} from '@cisco-eti/spark-design';
import {BanIcon, CheckIcon} from 'lucide-react';
import {CountDownTimer} from '../ui/count-down-timer';
import {useCallback, useMemo, useState} from 'react';
import {INotification, NotificationType} from '@/types/sw/notification';
import {useAproveToken} from '@/mutations';

interface NotificationContentProps extends Omit<DrawerProps, 'ref' | 'fadeFromIndex' | 'open' | 'onOpenChange'> {
  notification?: INotification;
  index: number;
  useOverlay: boolean;
  onHandleRequest?: (notification?: INotification) => void;
}

export const NotificationContent = ({
  notification,
  index,
  defaultOpen,
  useOverlay,
  onHandleRequest,
  ...props
}: NotificationContentProps) => {
  const [isLoadingApprove, setIsLoadingApprove] = useState(false);
  const [isLoadingDeny, setIsLoadingDeny] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const [timerEnded, setTimerEnded] = useState(false);

  const zIndex = notification?.timestamp ? Math.floor((Date.now() - notification.timestamp) / 1000) : 0;

  const remainingDuration = useMemo(() => {
    if (!notification?.timestamp || !notification?.approval_request_info?.timeout_in_seconds) {
      return 0;
    }
    const now = Date.now();
    const notificationTime = notification.timestamp;
    const timeoutMs = notification.approval_request_info.timeout_in_seconds * 1000;
    const expiryTime = notificationTime + timeoutMs;
    const remainingMs = expiryTime - now;
    return Math.max(0, Math.floor(remainingMs / 1000));
  }, [notification?.timestamp, notification?.approval_request_info?.timeout_in_seconds]);

  const handleOnComplete = useCallback(() => {
    setOpen(false);
    setIsLoadingApprove(false);
    setIsLoadingDeny(false);
    setTimerEnded(true);
  }, []);

  const aproveTokenMutation = useAproveToken({
    callbacks: {
      onSuccess: () => {
        onHandleRequest?.(notification);
        handleOnComplete();
        toast({
          title: 'Success',
          description: 'Your request has been processed successfully.',
          type: 'success',
          showCloseButton: false
        });
      },
      onError: () => {
        onHandleRequest?.(notification);
        handleOnComplete();
        toast({
          title: 'Error',
          description: 'An error occurred while processing your request.',
          type: 'error',
          showCloseButton: false
        });
      }
    }
  });

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

  if (index > 2) {
    return null;
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} dismissible={timerEnded} {...props}>
      <DrawerContent
        useOverlay={useOverlay}
        classNameOverlay={index > 0 ? 'inset-full' : ''}
        className="max-h-screen space-y-4"
        style={{
          height: `calc(${70 + index * 1}vh - 56px)`,
          zIndex: 3000 + zIndex,
          pointerEvents: index === 0 ? 'auto' : 'none',
          transform: `scale(${1 - index * 0.035}) translate3d(0px, ${-16 * (index + 0.035)}px, 0px)`,
          animationDuration: index === 0 ? '0.5s' : '0s'
        }}
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
                duration={remainingDuration}
                totalDuration={notification.approval_request_info?.timeout_in_seconds}
                onComplete={handleOnComplete}
              />
            )}
        </div>
        {notification?.type === NotificationType.APPROVAL_REQUEST && (
          <DrawerFooter>
            <div className="flex justify-between gap-12 pb-8">
              <Button
                variant="outlined"
                sx={{
                  fontWeight: 'bold !important'
                }}
                color="negative"
                fullWidth
                startIcon={<BanIcon className="w-4 h-4" />}
                disabled={timerEnded || aproveTokenMutation.isPending || isLoadingApprove}
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
                disabled={timerEnded || aproveTokenMutation.isPending || isLoadingDeny}
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
