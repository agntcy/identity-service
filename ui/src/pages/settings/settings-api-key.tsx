/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ContentApiKey} from '@/components/api-key/content-api-key';
import {BasePage} from '@/components/layout/base-page';
import {PATHS} from '@/router/paths';
import {Typography} from '@outshift/spark-design';
import React from 'react';

const SettingsIdentityProvider: React.FC = () => {
  return (
    <BasePage
      title="Api Key"
      description={
        <Typography variant="body2">
          Use an API Key to authenticate and authorize access to the AGNTCY platform. API Keys are used to securely connect your applications and
          services with AGNTCY, enabling seamless integration and interaction.
        </Typography>
      }
      subNav={[
        {
          label: 'Identity Provider',
          href: PATHS.settingsIdentityProvider
        },
        {
          label: 'Api Key',
          href: PATHS.settingsApiKey
        }
      ]}
      breadcrumbs={[
        {
          text: 'Settings',
          href: PATHS.settings
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
