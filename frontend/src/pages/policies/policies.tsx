/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {ListPolicies} from '@/components/policies/list/list-policies';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useGetAgenticServices} from '@/queries';
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

  const {data, isLoading, error} = useGetAgenticServices();

  const navigate = useNavigate();

  return (
    <BasePage
      title="Policies"
      rightSideItems={
        !isEmptyIdp &&
        !isLoading && (
          <Link to={PATHS.policies.create}>
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
        useContainer
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
        <ConditionalQueryRenderer
          itemName="Policies"
          data={data?.apps}
          error={error}
          isLoading={isLoading}
          useRelativeLoader
          useContainer
          emptyListStateProps={{
            title: 'Get started with Agent Identity',
            description: 'Create an Agentic Service to manage identities and apply TBAC based access control.',
            actionTitle: 'Create Agentic Service',
            actionCallback: () => {
              void navigate(PATHS.agenticServices.create);
            },
            actionButtonProps: {
              variant: 'outlined',
              startIcon: <PlusIcon className="w-4 h-4" />,
              sx: {fontWeight: '600 !important'}
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
