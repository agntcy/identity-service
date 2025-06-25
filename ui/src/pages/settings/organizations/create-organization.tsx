/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {CreateOrganizationForm} from '@/components/organizations/create/create-organization-form';
import {PATHS} from '@/router/paths';

const CreateOrganization: React.FC = () => {
  return (
    <BasePage
      title="Create organization"
      breadcrumbs={[
        {
          text: 'Settings',
          link: PATHS.settings
        },
        {
          text: 'Organizations',
          link: PATHS.settingsOrganizations
        },
        {
          text: 'Create organization'
        }
      ]}
    >
      <CreateOrganizationForm />
    </BasePage>
  );
};

export default CreateOrganization;
