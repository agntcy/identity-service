/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {CreateIdentityProvider} from '@/components/identity-provider/create/create-identity-provider';
import {InformationProvider} from '@/components/identity-provider/information/information-provider';
import {BasePage} from '@/components/layout/base-page';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useGetSettings} from '@/queries';
import {PATHS} from '@/router/paths';
import {useIdentityProviderStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';

const SettingsIdentityProvider: React.FC = () => {
  const {data, error, isLoading, isFetching, refetch} = useGetSettings();

  const {isEmptyIdp} = useIdentityProviderStore(
    useShallow((state) => ({
      isEmptyIdp: state.isEmptyIdp
    }))
  );

  return (
    <BasePage
      title="Identity Provider"
      description="Manage your identity provider settings. You can create a new identity provider or view existing settings."
      subNav={[
        {
          label: 'Identity Provider',
          href: PATHS.settings.identityProvider
        },
        {
          label: 'Api Key',
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
        useContainer
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
