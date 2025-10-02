/* eslint-disable indent */
/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {PATHS} from '@/router/paths';
import {isMultiTenant} from '@/utils/auth';
import {useMemo} from 'react';
import {Outlet} from 'react-router-dom';

const SettingsBase: React.FC = () => {
  const isMulti = isMultiTenant();

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
      ...(isMulti
        ? [
            {
              label: 'Organizations & Users',
              href: PATHS.settings.organizationsAndUsers.base
            }
          ]
        : [])
    ];
  }, [isMulti]);

  return <Outlet context={{subNav}} />;
};

export default SettingsBase;
