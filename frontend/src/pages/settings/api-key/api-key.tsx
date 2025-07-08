/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ContentApiKey} from '@/components/api-key/content-api-key';
import {BasePage} from '@/components/layout/base-page';
import {PATHS} from '@/router/paths';
import React from 'react';

const ApiKey: React.FC = () => {
  return (
    <BasePage
      title="API Key"
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
          label: 'Organizations & Users',
          href: PATHS.settings.organizationsAndUsers.base
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

export default ApiKey;
