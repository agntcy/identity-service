/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerProps} from '@/components/ui/drawer';
import {Button, Typography} from '@outshift/spark-design';
import {BanIcon, CheckIcon} from 'lucide-react';
import {CountDownTimer} from '../ui/count-down-timer';
import {useCallback, useState} from 'react';

interface NotificationContentProps extends Omit<DrawerProps, 'ref' | 'fadeFromIndex' | 'open' | 'onOpenChange'> {
  notification?: any;
  isLoading?: boolean;
  onAllow?: () => void;
  onDeny?: () => void;
}

export const NotificationContent = ({
  notification,
  defaultOpen,
  onAllow,
  onDeny,
  isLoading,
  ...props
}: NotificationContentProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const [timerEnded, setTimerEnded] = useState(false);

  const handleOnComplete = useCallback(() => {
    setOpen(false);
    setTimerEnded(true);
    onDeny?.();
  }, [onDeny]);

  const handleAllow = useCallback(() => {
    setOpen(false);
    onAllow?.();
  }, [onAllow]);

  const handleDeny = useCallback(() => {
    setOpen(false);
    onDeny?.();
  }, [onDeny]);

  return (
    <Drawer open={open} onOpenChange={setOpen} dismissible={false} {...props}>
      <DrawerContent className="max-h-screen" style={{height: 'calc(100vh - 56px)'}}>
        <DrawerHeader>
          <Typography variant="h6">{notification?.title || 'Notification'}</Typography>
          <Typography variant="body2" className="text-muted-foreground">
            {notification?.message || 'You have a new notification.'}
          </Typography>
        </DrawerHeader>
        <div className="flex flex-col items-center justify-center h-full">
          <CountDownTimer duration={30} onComplete={handleOnComplete} />
        </div>
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
              disabled={timerEnded || isLoading}
              onClick={handleDeny}
            >
              Deny
            </Button>
            <Button
              sx={{
                fontWeight: 'bold !important'
              }}
              fullWidth
              startIcon={<CheckIcon className="w-4 h-4" />}
              disabled={timerEnded || isLoading}
              onClick={handleAllow}
            >
              Allow
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
