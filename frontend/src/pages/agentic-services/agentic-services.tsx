/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {ListAgenticServices} from '@/components/agentic-services/list/list-agentic-services';
import {BasePage} from '@/components/layout/base-page';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useAnalytics} from '@/hooks';
import {useGetSettings} from '@/queries';
import {PATHS} from '@/router/paths';
import {useSettingsStore} from '@/store';
import {Button} from '@open-ui-kit/core';
import {PlusIcon} from 'lucide-react';
import {Link, useNavigate} from 'react-router-dom';
import {useShallow} from 'zustand/react/shallow';

const AgentServices: React.FC = () => {
  const {data, error, isLoading, refetch} = useGetSettings();

  const {isEmptyIdp} = useSettingsStore(
    useShallow((state) => ({
      isEmptyIdp: state.isEmptyIdp
    }))
  );

  const navigate = useNavigate();

  const {analyticsTrack} = useAnalytics();

  return (
    <BasePage
      title="Agentic Services"
      rightSideItems={
        !isEmptyIdp && (
          <Link to={PATHS.agenticServices.add} onClick={() => analyticsTrack('CLICK_NAVIGATION_ADD_AGENTIC_SERVICE')}>
            <Button startIcon={<PlusIcon className="w-4 h-4" />} variant="primary" sx={{fontWeight: '600 !important'}}>
              Add Agentic Service
            </Button>
          </Link>
        )
      }
    >
      <ConditionalQueryRenderer
        itemName="Identity Provider"
        data={isEmptyIdp ? undefined : data?.issuerSettings}
        error={error}
        isLoading={isLoading}
        useRelativeLoader
        errorListStateProps={{
          actionCallback: () => {
            void refetch();
          }
        }}
        emptyListStateProps={{
          title: 'Get started with AGNTCY Identity Service',
          description:
            'Connect your identity provider to create and manage identities for your AI agents and MCP servers, including those supporting A2A-compatible protocols like Google A2A, with support for policies and access controls.',
          actionTitle: 'Connect Identity Provider',
          actionCallback: () => {
            analyticsTrack('CLICK_NAVIGATION_CONNECT_IDENTITY_PROVIDER');
            void navigate(PATHS.settings.identityProvider.connection);
          }
        }}
      >
        <ListAgenticServices />
      </ConditionalQueryRenderer>
    </BasePage>
  );
};

export default AgentServices;
