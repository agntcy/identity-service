/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {InfoAgenticService} from '@/components/agentic-services/info/info-agentic-service';
import {BasePage} from '@/components/layout/base-page';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useGetAgenticService} from '@/queries';
import {PATHS} from '@/router/paths';
import {Button} from '@outshift/spark-design';
import {IdCardIcon} from 'lucide-react';
import {useParams} from 'react-router-dom';

const AgenticServiceInfo: React.FC = () => {
  const {id} = useParams<{id: string}>();

  const {data, isLoading, isFetching, error, isError, refetch} = useGetAgenticService(id);

  return (
    <BasePage
      title="Agentic Service"
      description="Check the details of your agentic service."
      useBorder
      breadcrumbs={[
        {
          text: 'Agentic Services',
          link: PATHS.agenticServices.base
        },
        {
          text: id || 'Agentic Service Info'
        }
      ]}
      rightSideItems={
        isError || isLoading || isFetching ? null : (
          <div className="flex items-center gap-4">
            <Button variant="outlined" color="negative" onClick={() => {}} sx={{fontWeight: '600 !important'}}>
              Delete
            </Button>
            <Button variant="secondary" onClick={() => {}} sx={{fontWeight: '600 !important'}}>
              Update
            </Button>
            <Button onClick={() => {}} startIcon={<IdCardIcon className="w-4 h-4" />} variant="primary" sx={{fontWeight: '600 !important'}}>
              Re-Issue Badge
            </Button>
          </div>
        )
      }
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
        <InfoAgenticService app={data} />
      </ConditionalQueryRenderer>
    </BasePage>
  );
};

export default AgenticServiceInfo;
