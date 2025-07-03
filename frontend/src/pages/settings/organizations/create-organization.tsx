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
      title="Create Organization"
      breadcrumbs={[
        {
          text: 'Settings',
          link: PATHS.settings.base
        },
        {
          text: 'Organizations & Users',
          link: PATHS.settings.organizationsAndUsers.base
        },
        {
          text: 'Create Organization'
        }
      ]}
      useBorder
    >
      <CreateOrganizationForm />
    </BasePage>
  );
};

export default CreateOrganization;
