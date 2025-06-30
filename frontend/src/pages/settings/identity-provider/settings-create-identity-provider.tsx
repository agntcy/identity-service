/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {CreateIdentityProvider} from '@/components/identity-provider/create/create-identity-provider';
import {BasePage} from '@/components/layout/base-page';
import {PATHS} from '@/router/paths';

const SettingsCreateIdentityProvider: React.FC = () => {
  return (
    <BasePage
      title="Identity Provider Creation"
      breadcrumbs={[
        {
          text: 'Settings',
          link: PATHS.settings.base
        },
        {
          text: 'Identity Provider',
          link: PATHS.settings.identityProvider.base
        },
        {
          text: 'Create'
        }
      ]}
    >
      <CreateIdentityProvider />
    </BasePage>
  );
};

export default SettingsCreateIdentityProvider;
