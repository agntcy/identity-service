/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {usePushNotifications} from '@/hooks';
import {LoaderRelative} from '../ui/loading';
import {useEffect} from 'react';

export const ContentOnBoardDevice = ({id}: {id?: string}) => {
  const {requestPermission, disableNotifications} = usePushNotifications(id);

  // Register service worker on mount
  useEffect(() => {
    // if ('serviceWorker' in navigator) {
    //   navigator.serviceWorker
    //     .register('/sw.js')
    //     .then((registration) => {
    //       console.log('Service Worker registered:', registration.scope);
    //       void registration.update();
    //     })
    //     .catch((error) => {
    //       console.log('Service Worker registration failed:', error);
    //     });
    // }
  }, []);

  console.log('serviceWorker' in navigator);

  return null;
};
