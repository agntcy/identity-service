/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {UpdatePolicyStepper} from '@/components/policies/update/update-policy-stepper';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useGetPolicy} from '@/queries';
import {PATHS} from '@/router/paths';
import {generatePath, useParams} from 'react-router-dom';

const UpldatePolicies: React.FC = () => {
  const {id} = useParams<{id: string}>();

  const {data, isLoading, isFetching, error, refetch} = useGetPolicy(id);

  return (
    <BasePage
      title="Update Policy"
      useBorder
      breadcrumbs={[
        {
          text: 'Policies',
          link: PATHS.policies.base
        },
        {
          text: id || 'Policy',
          link: generatePath(PATHS.policies.info, {id: id || ''})
        },
        {
          text: 'Update'
        }
      ]}
    >
      <ConditionalQueryRenderer
        itemName="Policy"
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
        <UpdatePolicyStepper policy={data} />
      </ConditionalQueryRenderer>
    </BasePage>
  );
};

export default UpldatePolicies;
