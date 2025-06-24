/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {CreateIdentityProvider} from '@/components/identity-provider/create/create-identity-provider';
import {InformationProvider} from '@/components/identity-provider/information/information-provider';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useGetSettings} from '@/queries';
import {PATHS} from '@/router/paths';
import {IdpType} from '@/types/api/settings';
import {BasePage, Link, Typography} from '@outshift/spark-design';
import {useMemo} from 'react';

const SettingsIdentityProvider: React.FC = () => {
  const {data, error, isLoading, isFetching, refetch} = useGetSettings();

  const isEmptyIdp = useMemo(() => {
    return !data?.issuerSettings || data.issuerSettings.idpType === IdpType.IDP_TYPE_UNSPECIFIED;
  }, [data?.issuerSettings]);

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
          text: 'Identity Provider'
        }
      ]}
    >
      <ConditionalQueryRenderer
        itemName="Identity Provider"
        data={data?.issuerSettings}
        error={error}
        isLoading={isLoading || isFetching}
        useRelativeLoader
        errorListStateProps={{
          actionCallback: () => {
            void refetch();
          },
          actionTitle: 'Retry'
        }}
      >
        {isEmptyIdp ? <CreateIdentityProvider /> : <InformationProvider idpSettings={data?.issuerSettings} />}
      </ConditionalQueryRenderer>
    </BasePage>
  );
};

export default SettingsIdentityProvider;
