/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {EditAgenticServiceForm} from '@/components/agentic-services/edit/edit-agentic-service-form';
import {BasePage} from '@/components/layout/base-page';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useGetAgenticService} from '@/queries';
import {PATHS} from '@/router/paths';
import {generatePath, useParams} from 'react-router-dom';

const EditAgenticService: React.FC = () => {
  const {id} = useParams<{id: string}>();

  const {data, isLoading, isFetching, error, refetch} = useGetAgenticService(id);

  return (
    <BasePage
      title="Edit Agentic Service"
      breadcrumbs={[
        {
          text: 'Agentic Services',
          link: PATHS.agenticServices.base
        },
        {
          text: data?.name || 'Agentic Service',
          link: generatePath(PATHS.agenticServices.info.base, {id: id || ''})
        },
        {
          text: 'Edit'
        }
      ]}
    >
      <ConditionalQueryRenderer
        itemName="Agentic Service"
        data={data}
        error={error}
        isLoading={isLoading || isFetching}
        useRelativeLoader
        errorListStateProps={{
          actionCallback: () => {
            void refetch();
          }
        }}
      >
        <EditAgenticServiceForm app={data} />
      </ConditionalQueryRenderer>
    </BasePage>
  );
};

export default EditAgenticService;
