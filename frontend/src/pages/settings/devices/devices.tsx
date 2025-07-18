/* eslint-disable indent */
/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ListDevices} from '@/components/devices/list-devices';
import {BasePage} from '@/components/layout/base-page';
import {PATHS} from '@/router/paths';
import {useFeatureFlagsStore} from '@/store';
import React, {useMemo} from 'react';
import {useShallow} from 'zustand/react/shallow';

const Devices: React.FC = () => {
  const {isTbacEnable} = useFeatureFlagsStore(
    useShallow((state) => ({
      isTbacEnable: state.featureFlags.isTbacEnable
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
      ...(isTbacEnable
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
  }, [isTbacEnable]);

  return (
    <BasePage
      title="Devices"
      subNav={subNav}
      breadcrumbs={[
        {
          text: 'Settings',
          link: PATHS.settings.base
        },
        {
          text: 'Devices'
        }
      ]}
    >
      <ListDevices />
    </BasePage>
  );
};

export default Devices;
