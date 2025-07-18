/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useWindowSize} from '@/hooks';
import {Fab, FabProps} from '@mui/material';
import {Tooltip} from '@outshift/spark-design';
import {MonitorDownIcon} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallButtonPwa = (props: FabProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const {isMobile} = useWindowSize();

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the installation prompt');
        } else {
          console.log('User dismissed the installation prompt');
        }
      });
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', () => handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isMobile || !deferredPrompt) {
    return null;
  }

  return (
    <div className="absolute bottom-16 right-6">
      <Tooltip title="Install Agent Identity" placement="left">
        <Fab
          color="primary"
          variant="circular"
          sx={{backgroundColor: '#187adc'}}
          size="medium"
          {...props}
          onClick={handleInstall}
        >
          <MonitorDownIcon className="w-4 h-4" />
        </Fab>
      </Tooltip>
    </div>
  );
};
