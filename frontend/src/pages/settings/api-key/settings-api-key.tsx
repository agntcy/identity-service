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
      title="API Key"
      description="Manage your API keys. You can create, view, and delete API keys for your account."
      subNav={[
        {
          label: 'Identity Provider',
          href: PATHS.settings.identityProvider.base
        },
        {
          label: 'API Key',
          href: PATHS.settings.apiKey
        },
        {
          label: 'Organizations',
          href: PATHS.settings.organizations.base
        }
      ]}
      breadcrumbs={[
        {
          text: 'Settings',
          link: PATHS.settings.base
        },
        {
          text: 'API Key'
        }
      ]}
    >
      <ContentApiKey />
    </BasePage>
  );
};

export default SettingsIdentityProvider;
