/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ContentApiKey} from '@/components/api-key/content-api-key';
import {BasePage} from '@/components/layout/base-page';
import {PATHS} from '@/router/paths';
import React from 'react';

const SettingsIdentityProvider: React.FC = () => {
  return (
    <BasePage
      title="Api Key"
      subNav={[
        {
          label: 'Identity Provider',
          href: PATHS.settingsIdentityProvider
        },
        {
          label: 'Api Key',
          href: PATHS.settingsApiKey
        },
        {
          label: 'Organizations',
          href: PATHS.settingsOrganizations
        }
      ]}
      breadcrumbs={[
        {
          text: 'Settings',
          link: PATHS.settings
        },
        {
          text: 'Api Key'
        }
      ]}
    >
      <ContentApiKey />
    </BasePage>
  );
};

export default SettingsIdentityProvider;
