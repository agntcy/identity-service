/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {UpdateOrganizationForm} from '@/components/organizations/update/update-organization-form';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useGetTenant} from '@/queries';
import {PATHS} from '@/router/paths';
import {generatePath, useParams} from 'react-router-dom';

const UpdateOrganization: React.FC = () => {
  const {id} = useParams<{id: string}>();

  const {data, isLoading, error, refetch} = useGetTenant(id!);

  const link = generatePath(PATHS.settings.organizationsAndUsers.info, {id: id!});

  return (
    <BasePage
      title="Update Organization"
      breadcrumbs={[
        {
          text: 'Settings',
          link: PATHS.settings.base
        },
        {
          text: 'Organizations & Users',
          link: PATHS.settings.organizationsAndUsers.base
        },
        {
          text: data?.id ? data.id : 'Organization',
          link: link
        },
        {
          text: 'Update'
        }
      ]}
      useBorder
    >
      <ConditionalQueryRenderer
        itemName="Organization"
        data={data}
        error={error}
        isLoading={isLoading}
        useRelativeLoader
        useContainer
        errorListStateProps={{
          actionCallback: () => {
            void refetch();
          },
          actionTitle: 'Retry'
        }}
      >
        <UpdateOrganizationForm tenant={data} />
      </ConditionalQueryRenderer>
    </BasePage>
  );
};

export default UpdateOrganization;
