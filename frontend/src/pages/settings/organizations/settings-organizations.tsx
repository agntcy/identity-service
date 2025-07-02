/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {ListOrganizations} from '@/components/organizations/list/list-organizations';
import {PATHS} from '@/router/paths';
import {Button} from '@outshift/spark-design';
import {PlusIcon} from 'lucide-react';
import {Link} from 'react-router-dom';

const SettingsOrganizations: React.FC = () => {
  return (
    <BasePage
      title="Organizations & Users"
      description="Manage your organizations and users. You can create, view, and delete organizations, as well as manage users within those organizations."
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
          text: 'Organizations'
        }
      ]}
      rightSideItems={
        <Link to={PATHS.settings.organizationsAndUsers.create}>
          <Button variant="outlined" endIcon={<PlusIcon className="w-4 h-4" />} fullWidth sx={{fontWeight: '600 !important'}}>
            New Organization
          </Button>
        </Link>
      }
    >
      <ListOrganizations />
    </BasePage>
  );
};

export default SettingsOrganizations;
