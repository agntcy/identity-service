/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {usePushNotifications} from '@/hooks';
import {useCallback, useEffect, useState} from 'react';
import {Button, Typography} from '@mui/material';
import {Card} from '../ui/card';
import {BellIcon, BellOffIcon, RefreshCcwIcon} from 'lucide-react';
import {GeneralSize, Tag, TagStatus, toast} from '@outshift/spark-design';
import {Notifications} from './notifications';

export const ContentOnBoardDevice = ({id}: {id?: string}) => {
  const [loadigToggle, setLoadingToggle] = useState(false);
  const [loadingRefresh, setLoadingRefresh] = useState(false);

  const {requestPermission, disableNotifications, notificationsEnabled} = usePushNotifications(id);

  const handleToggleNotifications = useCallback(async () => {
    setLoadingToggle(true);
    if (notificationsEnabled) {
      await disableNotifications();
      toast({
        title: 'Notifications Disabled',
        description: 'You will no longer receive push notifications',
        type: 'warning'
      });
      setLoadingToggle(false);
    } else {
      const granted = await requestPermission();
      if (granted) {
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive push notifications with allow/deny actions',
          type: 'success'
        });
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser settings',
          type: 'error'
        });
      }
      setLoadingToggle(false);
    }
  }, [disableNotifications, notificationsEnabled, requestPermission]);

  const handleRefreshServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        setLoadingRefresh(true);
        const registrations = await navigator.serviceWorker.getRegistrations();

        for (const registration of registrations) {
          await registration.unregister();
        }

        // Clear all caches
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));

        console.log('Service workers and caches cleared successfully.');

        // Wait a moment then re-register
        setTimeout(() => {
          navigator.serviceWorker
            .register(`/sw.js?fresh=${Date.now()}`, {scope: '/'})
            .then((registration) => {
              console.log('Fresh service worker registered:', registration.scope);
              toast({
                title: 'Service Worker Refreshed',
                description: 'Notifications should work properly now',
                type: 'success'
              });
              setLoadingRefresh(false);
            })
            .catch((error) => {
              console.error('Failed to re-register service worker:', error);
              setLoadingRefresh(false);
            });
        }, 1000);
      } catch (error) {
        console.error('Error refreshing service worker:', error);
        setLoadingRefresh(false);
      }
    }
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', {scope: '/'})
        .then(async (registration) => {
          console.log('Service Worker registered:', registration.scope);
          await registration.update();
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return (
    <>
      <Card variant="secondary" className="w-sm md:w-md lg:w-lg mx-auto space-y-6">
        <div className="flex gap-4 items-center">
          {notificationsEnabled ? <BellIcon className="h-5 w-5 text-green-600" /> : <BellOffIcon className="h-5 w-5 text-gray-400" />}
          <Typography variant="body1Semibold">Notification Status</Typography>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Typography variant="captionSemibold">Push Notifications</Typography>
            <Tag size={GeneralSize.Small} status={notificationsEnabled ? TagStatus.Positive : TagStatus.Warning} className="text-xs">
              {notificationsEnabled ? 'Enabled' : 'Disabled'}
            </Tag>
          </div>
          <div className="pt-2">
            <Button
              startIcon={notificationsEnabled ? <BellOffIcon className="w-4 h-4" /> : <BellIcon className="w-4 h-4" />}
              onClick={handleToggleNotifications}
              fullWidth
              variant={notificationsEnabled ? 'outlined' : 'primary'}
              sx={{fontWeight: 'bold !important'}}
              loading={loadigToggle}
              loadingPosition="start"
            >
              {notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}
            </Button>
          </div>
          <div>
            <Button
              onClick={handleRefreshServiceWorker}
              fullWidth
              variant="secondary"
              startIcon={<RefreshCcwIcon className="w-4 h-4" />}
              sx={{fontWeight: 'bold !important'}}
              loading={loadingRefresh}
              loadingPosition="start"
            >
              Fix Notification Issues
            </Button>
          </div>
          <div>
            <Typography variant="caption">
              {notificationsEnabled
                ? "You'll receive notifications with Allow/Deny actions. Responses are tracked automatically."
                : 'Enable notifications to receive allow/deny prompts from the web dashboard.'}
            </Typography>
          </div>
          <div>
            <Typography variant="captionMedium">
              If notifications show a 404 error when tapped, use &quot;Fix Notification Issues&quot; button above.
            </Typography>
          </div>
        </div>
      </Card>
      <Notifications />
    </>
  );
};
