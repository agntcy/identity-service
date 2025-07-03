/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {OrganizationInfo} from '@/components/organizations/info/organization-info';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useGetTenant} from '@/queries';
import {PATHS} from '@/router/paths';
import {Button} from '@outshift/spark-design';
import {PlusIcon} from 'lucide-react';
import {useState} from 'react';
import {useParams} from 'react-router-dom';

const InfoOrganization: React.FC = () => {
  const {id} = useParams<{id: string}>();
  const [showInviteUserModal, setShowInviteUserModal] = useState<boolean>(false);

  const {data, isLoading, isFetching, error, isError, refetch} = useGetTenant(id!);

  return (
    <BasePage
      title="Users"
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
          text: id || 'Organization'
        }
      ]}
      rightSideItems={
        isError || isLoading || isFetching ? null : (
          <Button
            variant="outlined"
            onClick={() => {
              setShowInviteUserModal(true);
            }}
            sx={{fontWeight: '600 !important'}}
            endIcon={<PlusIcon className="w-4 h-4" />}
          >
            Invite User
          </Button>
        )
      }
    >
      <ConditionalQueryRenderer
        itemName="Organization"
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
        <OrganizationInfo tenant={data} showInviteUserModal={showInviteUserModal} onChangeInviteUser={(value) => setShowInviteUserModal(value)} />
      </ConditionalQueryRenderer>
    </BasePage>
  );
};

export default InfoOrganization;
