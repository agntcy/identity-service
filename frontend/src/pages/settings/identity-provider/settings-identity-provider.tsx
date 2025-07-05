/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {InformationProvider} from '@/components/identity-provider/information/information-provider';
import {BasePage} from '@/components/layout/base-page';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useGetSettings} from '@/queries';
import {PATHS} from '@/router/paths';
import {useSettingsStore} from '@/store';
import {PlusIcon} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {useShallow} from 'zustand/react/shallow';

const SettingsIdentityProvider: React.FC = () => {
  const {data, error, isLoading, isFetching, refetch} = useGetSettings();

  const navigate = useNavigate();

  const {isEmptyIdp} = useSettingsStore(
    useShallow((state) => ({
      isEmptyIdp: state.isEmptyIdp
    }))
  );

  return (
    <BasePage
      title="Identity Provider"
      description="Manage your Identity Provider settings. You can register an Identity Provider or view existing settings."
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
          text: 'Identity Provider'
        }
      ]}
    >
      <ConditionalQueryRenderer
        itemName="Identity Provider"
        data={isEmptyIdp ? undefined : data?.issuerSettings}
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
        emptyListStateProps={{
          title: 'Get started with Agent Identity',
          description:
            'Connect identity provider to Create ID badges (MCP servers, OASF agents, and A2A protocols), manage identities and apply policies',
          actionTitle: 'Register Identity Provider',
          actionCallback: () => {
            void navigate(PATHS.settings.identityProvider.create);
          },
          actionButtonProps: {
            variant: 'outlined',
            startIcon: <PlusIcon className="w-4 h-4" />,
            sx: {fontWeight: '600 !important'}
          }
        }}
      >
        <InformationProvider idpSettings={data?.issuerSettings} />
      </ConditionalQueryRenderer>
    </BasePage>
  );
};

export default SettingsIdentityProvider;
