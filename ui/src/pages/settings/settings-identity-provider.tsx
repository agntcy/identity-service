/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {CreateUpdateIdentityProvider} from '@/components/identity-provider/create-update/create-update-identity-provider';
import {BasePage} from '@/components/layout/base-page';
import {PATHS} from '@/router/paths';
import {Link, Typography} from '@outshift/spark-design';

const SettingsIdentityProvider: React.FC = () => {
  // TODO: Fetch the identity provider
  return (
    <BasePage
      title="Identity Provider"
      description={
        <Typography variant="body2">
          Use an Identity Provider (IdP) to assign identities to Agents and MCP Servers, centralize and secure identity management by enabling
          cryptographically verifiable, trusted authentication{' '}
          <Link href="https://spec.identity.agntcy.org/docs/category/identifiers" openInNewTab>
            here
          </Link>
          .
        </Typography>
      }
      subNav={[
        {
          label: 'Identity Provider',
          href: PATHS.settingsIdentityProvider
        }
      ]}
      breadcrumbs={[
        {
          text: 'Settings',
          href: PATHS.settings
        },
        {
          text: 'Identity Provider'
        }
      ]}
    >
      <CreateUpdateIdentityProvider />
    </BasePage>
  );
};

export default SettingsIdentityProvider;
