/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {ListPolicies} from '@/components/policies/list/list-policies';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useAnalytics} from '@/hooks';
import {useGetAgenticServiceTotalCount} from '@/queries';
import {PATHS} from '@/router/paths';
import {useSettingsStore} from '@/store';
import {Button} from '@mui/material';
import {PlusIcon} from 'lucide-react';
import {Link, useNavigate} from 'react-router-dom';
import {useShallow} from 'zustand/react/shallow';

const Policies: React.FC = () => {
  const {isEmptyIdp} = useSettingsStore(
    useShallow((state) => ({
      isEmptyIdp: state.isEmptyIdp
    }))
  );

  const {data, isLoading, error} = useGetAgenticServiceTotalCount();
  const hasAgenticServices = data && Number(data?.total) > 0;

  const navigate = useNavigate();

  const {analyticsTrack} = useAnalytics();

  return (
    <BasePage
      title="Policies"
      rightSideItems={
        !isEmptyIdp &&
        !isLoading &&
        hasAgenticServices && (
          <Link to={PATHS.policies.create} onClick={() => analyticsTrack('CLICK_NAVIGATION_ADD_POLICY')}>
            <Button startIcon={<PlusIcon className="w-4 h-4" />} variant="primary" sx={{fontWeight: '600 !important'}}>
              Add Policy
            </Button>
          </Link>
        )
      }
    >
      <ConditionalQueryRenderer
        itemName="Policies"
        data={isEmptyIdp ? undefined : true}
        error={null}
        isLoading={false}
        useRelativeLoader
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
        <ConditionalQueryRenderer
          itemName="Policies"
          data={hasAgenticServices ? true : undefined}
          error={error}
          isLoading={isLoading}
          useRelativeLoader
          emptyListStateProps={{
            title: 'Get started with AGNTCY Identity Service',
            description: 'Add an Agentic Service to manage identities and apply TBAC based access control.',
            actionTitle: 'Add Agentic Service',
            actionCallback: () => {
              analyticsTrack('CLICK_NAVIGATION_ADD_AGENTIC_SERVICE');
              void navigate(PATHS.agenticServices.add);
            }
          }}
        >
          <ListPolicies />
        </ConditionalQueryRenderer>
      </ConditionalQueryRenderer>
    </BasePage>
  );
};

export default Policies;
