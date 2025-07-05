/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {UpdateAgenticServiceForm} from '@/components/agentic-services/update/update-agentic-service-form';
import {BasePage} from '@/components/layout/base-page';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useGetAgenticService} from '@/queries';
import {PATHS} from '@/router/paths';
import {generatePath, useParams} from 'react-router-dom';

const AgenticServiceUpdate: React.FC = () => {
  const {id} = useParams<{id: string}>();

  const {data, isLoading, isFetching, error, refetch} = useGetAgenticService(id);

  return (
    <BasePage
      title="Update Agentic Service"
      useBorder
      breadcrumbs={[
        {
          text: 'Agentic Services',
          link: PATHS.agenticServices.base
        },
        {
          text: id || 'Agentic Service',
          link: generatePath(PATHS.agenticServices.info, {id: id || ''})
        },
        {
          text: 'Update'
        }
      ]}
    >
      <ConditionalQueryRenderer
        itemName="Agentic Service"
        data={data}
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
        <UpdateAgenticServiceForm app={data} />
      </ConditionalQueryRenderer>
    </BasePage>
  );
};

export default AgenticServiceUpdate;
