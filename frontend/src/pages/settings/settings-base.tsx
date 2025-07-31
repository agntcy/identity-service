/* eslint-disable indent */
/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {PATHS} from '@/router/paths';
import {useFeatureFlagsStore} from '@/store';
import {useMemo} from 'react';
import {Outlet} from 'react-router-dom';
import {useShallow} from 'zustand/react/shallow';

const SettingsBase: React.FC = () => {
  const {isTbacEnabled} = useFeatureFlagsStore(
    useShallow((state) => ({
      isTbacEnabled: state.featureFlags.isTbacEnabled
    }))
  );

  const subNav = useMemo(() => {
    return [
      {
        label: 'Identity Provider',
        href: PATHS.settings.identityProvider.base
      },
      {
        label: 'API Key',
        href: PATHS.settings.apiKey
      },
      ...(isTbacEnabled
        ? [
            {
              label: 'Devices',
              href: PATHS.settings.devices.base
            }
          ]
        : []),
      {
        label: 'Organizations & Users',
        href: PATHS.settings.organizationsAndUsers.base
      }
    ];
  }, [isTbacEnabled]);

  return <Outlet context={{subNav}} />;
};

export default SettingsBase;
