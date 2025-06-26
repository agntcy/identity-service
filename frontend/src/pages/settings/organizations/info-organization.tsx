/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import PlaceholderPageContent from '@/components/ui/placeholder-page-content';
import {PATHS} from '@/router/paths';

const InfoOrganization: React.FC = () => {
  return (
    <BasePage
      title="Organization"
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
          text: 'Organization'
        }
      ]}
    >
      <PlaceholderPageContent />
    </BasePage>
  );
};

export default InfoOrganization;
