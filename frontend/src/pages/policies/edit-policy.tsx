/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {AddEditPolicyStepper} from '@/components/policies/add-edit/add-edit-stepper';
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
        <AddEditPolicyStepper mode="edit" policy={data} />
      </ConditionalQueryRenderer>
    </BasePage>
  );
};

export default EditPolicy;
