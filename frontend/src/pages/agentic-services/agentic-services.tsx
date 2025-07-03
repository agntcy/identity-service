/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ListAgenticServices} from '@/components/agentic-services/list/list-agentic-services';
import {BasePage} from '@/components/layout/base-page';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useGetSettings} from '@/queries';
import {PATHS} from '@/router/paths';
import {useSettingsStore} from '@/store';
import {Button, Skeleton} from '@outshift/spark-design';
import {CheckIcon, PlusIcon} from 'lucide-react';
import {Link, useNavigate} from 'react-router-dom';
import {useShallow} from 'zustand/react/shallow';

const AgentServices: React.FC = () => {
  const {data, error, isFetching, isLoading, refetch} = useGetSettings();

  const {isEmptyIdp} = useSettingsStore(
    useShallow((state) => ({
      isEmptyIdp: state.isEmptyIdp
    }))
  );

  const navigate = useNavigate();

  return (
    <BasePage
      title="Agentic Services"
      rightSideItems={
        <div className="flex gap-4 items-center">
          <Link to={PATHS.agenticServices.verifyIdentity}>
            <Button startIcon={<CheckIcon className="w-4 h-4" />} variant="secondary" sx={{fontWeight: '600 !important'}}>
              Verify Identity
            </Button>
          </Link>
          {isLoading || isFetching ? (
            <Skeleton width={160} height={56} />
          ) : (
            !isEmptyIdp && (
              <Link to={PATHS.agenticServices.create}>
                <Button startIcon={<PlusIcon className="w-4 h-4" />} variant="primary" sx={{fontWeight: '600 !important'}}>
                  Add Agentic Service
                </Button>
              </Link>
            )
          )}
        </div>
      }
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
            'Register a new Issuer to add Agentic Services (MCP Servers, A2A Agents and OASF), manage identities and apply TBAC based access control.',
          actionTitle: 'Register Issuer',
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
        <ListAgenticServices />
      </ConditionalQueryRenderer>
    </BasePage>
  );
};

export default AgentServices;
