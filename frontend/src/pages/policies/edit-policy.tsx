/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {EditPolicyStepper} from '@/components/policies/edit/edit-policy-stepper';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useGetPolicy} from '@/queries';
import {PATHS} from '@/router/paths';
import {generatePath, useParams} from 'react-router-dom';

const EditPolicy: React.FC = () => {
  const {id} = useParams<{id: string}>();

  const {data, isLoading, isFetching, error, refetch} = useGetPolicy(id);

  return (
    <BasePage
      title="Edit Policy"
      useBorder
      breadcrumbs={[
        {
          text: 'Policies',
          link: PATHS.policies.base
        },
        {
          text: data?.name || 'Policy',
          link: generatePath(PATHS.policies.info, {id: id || ''})
        },
        {
          text: 'Edit'
        }
      ]}
    >
      <ConditionalQueryRenderer
        itemName="Policy"
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
        <EditPolicyStepper policy={data} />
      </ConditionalQueryRenderer>
    </BasePage>
  );
};

export default EditPolicy;
