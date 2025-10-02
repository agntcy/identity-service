/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {OrganizationInfo} from '@/components/organizations/info/organization-info';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useAnalytics} from '@/hooks';
import {useGetTenant} from '@/queries';
import {PATHS} from '@/router/paths';
import {Button} from '@open-ui-kit/core';
import {PlusIcon} from 'lucide-react';
import {useState} from 'react';
import {useParams} from 'react-router-dom';

const InfoOrganization: React.FC = () => {
  const {id} = useParams<{id: string}>();
  const [showInviteUserModal, setShowInviteUserModal] = useState<boolean>(false);

  const {data, isLoading, error, isError, refetch} = useGetTenant(id!);

  const {analyticsTrack} = useAnalytics();

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
          text: data?.name || 'Organization'
        }
      ]}
      rightSideItems={
        isError || isLoading ? null : (
          <Button
            variant="outlined"
            onClick={() => {
              analyticsTrack('CLICK_INVITE_USER');
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
        isLoading={isLoading}
        useRelativeLoader
        errorListStateProps={{
          actionCallback: () => {
            void refetch();
          }
        }}
      >
        <OrganizationInfo
          tenant={data}
          showInviteUserModal={showInviteUserModal}
          onChangeInviteUser={(value) => setShowInviteUserModal(value)}
        />
      </ConditionalQueryRenderer>
    </BasePage>
  );
};

export default InfoOrganization;
