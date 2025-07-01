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
      title="Organizations"
      description="Manage your organizations. You can create, view, and delete organizations for your account."
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
          text: 'Organizations'
        }
      ]}
      rightSideItems={
        <Link to={PATHS.settings.organizations.create}>
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
