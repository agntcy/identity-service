/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerProps,
  DrawerTitle
} from '@/components/ui/drawer';
import {Button} from '@outshift/spark-design';
import {BanIcon, CheckIcon} from 'lucide-react';
import {CountDownTimer} from '../ui/count-down-timer';
import {useCallback, useState} from 'react';

interface NotificationContentProps extends Omit<DrawerProps, 'ref' | 'fadeFromIndex'> {
  notification?: any;
  isLoading?: boolean;
  onAllow?: () => void;
  onDeny?: () => void;
}

export const NotificationContent = ({notification, onAllow, onDeny, isLoading, ...props}: NotificationContentProps) => {
  const [timerEnded, setTimerEnded] = useState(false);

  const handleOnComplete = useCallback(() => {
    console.log('Timer completed');
    setTimerEnded(true);
  }, []);

  return (
    <Drawer {...props}>
      <DrawerContent className="h-screen max-h-screen">
        <DrawerHeader>
          <DrawerTitle>Are you absolutely sure?</DrawerTitle>
          <DrawerDescription>This action cannot be undone.</DrawerDescription>
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
              onClick={onDeny}
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
              onClick={onAllow}
            >
              Allow
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
