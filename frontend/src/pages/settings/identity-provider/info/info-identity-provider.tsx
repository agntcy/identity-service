/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {InformationProvider} from '@/components/identity-provider/information/information-provider';
import {BasePage} from '@/components/layout/base-page';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useAnalytics} from '@/hooks';
import {useGetSettings} from '@/queries';
import {PATHS} from '@/router/paths';
import {useSettingsStore} from '@/store';
import {useNavigate, useOutletContext} from 'react-router-dom';

import {useShallow} from 'zustand/react/shallow';

const InfoIdentityProvider: React.FC = () => {
  const {data, error, isLoading, isFetching, refetch} = useGetSettings();

  const navigate = useNavigate();

  const {isEmptyIdp} = useSettingsStore(
    useShallow((state) => ({
      isEmptyIdp: state.isEmptyIdp
    }))
  );

  const {subNav} = useOutletContext<{subNav: {label: string; href: string}[]}>();

  const {analyticsTrack} = useAnalytics();

  return (
    <BasePage
      title="Identity Provider"
      subNav={subNav}
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
        errorListStateProps={{
          actionCallback: () => {
            void refetch();
          }
        }}
        emptyListStateProps={{
          title: 'Get started with Agent Identity Service',
          description:
            'Connect your identity provider to create and manage identities for your AI agents and MCP servers, including those supporting A2A-compatible protocols like Google A2A, with support for policies and access controls.',
          actionTitle: 'Connect Identity Provider',
          actionCallback: () => {
            analyticsTrack('CLICK_NAVIGATION_CONNECT_IDENTITY_PROVIDER');
            void navigate(PATHS.settings.identityProvider.connection);
          }
        }}
      >
        <InformationProvider idpSettings={data?.issuerSettings} />
      </ConditionalQueryRenderer>
    </BasePage>
  );
};

export default InfoIdentityProvider;
