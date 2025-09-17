/* eslint-disable indent */
/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import config from '@/config';
import {PATHS} from '@/router/paths';
import {useMemo} from 'react';
import {Outlet} from 'react-router-dom';

const SettingsBase: React.FC = () => {
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

      {
        label: 'Devices',
        href: PATHS.settings.devices.base
      },
      ...(config.IAM_MULTI_TENANT
        ? [
            {
              label: 'Organizations & Users',
              href: PATHS.settings.organizationsAndUsers.base
            }
          ]
        : [])
    ];
  }, []);

  return <Outlet context={{subNav}} />;
};

export default SettingsBase;
