/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useState} from 'react';
import {ConditionalQueryRenderer} from '../../ui/conditional-query-renderer';
import {Table} from '@outshift/spark-design';
import {useGetGroupsTenant, useGetUsersGroup} from '@/queries';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {Card} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import {TenantReponse} from '@/types/api/iam';
import {UsersColumns} from './users-columns';
import {InviteUserModal} from '@/components/shared/invite-user-modal';

export const OrganizationInfo = ({
  tenant,
  onChangeInviteUser,
  showInviteUserModal = false
}: {
  tenant?: TenantReponse;
  showInviteUserModal: boolean;
  onChangeInviteUser: (value: boolean) => void;
}) => {
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });
  const [sorting, setSorting] = useState<MRT_SortingState>([]);

  const {data: dataGroups, isLoading: isLoadingGroups, error: errorGroups} = useGetGroupsTenant(tenant?.id || '');
  const groupId = dataGroups?.groups?.[0]?.id;

  const {data: dataUsers, isLoading: isLoadingUsers, error: errorUsers} = useGetUsersGroup(groupId || '');

  return (
    <>
      <ConditionalQueryRenderer
        itemName="Users"
        data={dataGroups?.groups && dataUsers?.users}
        error={errorGroups || errorUsers}
        isLoading={isLoadingGroups || isLoadingUsers}
        useRelativeLoader
        useContainer
      >
        <Card className={cn(!(isLoadingGroups || isLoadingUsers) && 'p-0')} variant="secondary">
          <Table
            columns={UsersColumns()}
            data={dataUsers?.users || []}
            isLoading={isLoadingGroups || isLoadingUsers}
            densityCompact
            enableRowActions
            topToolbarProps={{
              enableActions: false
            }}
            muiTableContainerProps={{
              style: {
                border: '1px solid #D5DFF7'
              }
            }}
            onPaginationChange={setPagination}
            rowCount={dataUsers?.users.length ?? 0}
            rowsPerPageOptions={[1, 10, 25, 50, 100]}
            title={{label: 'Organizations', count: dataUsers?.users?.length || 0}}
            state={{pagination, sorting}}
            onSortingChange={setSorting}
            muiBottomToolbarProps={{
              style: {
                boxShadow: 'none'
              }
            }}
          />
        </Card>
      </ConditionalQueryRenderer>
      <InviteUserModal
        open={showInviteUserModal}
        groupId={groupId || ''}
        onCancel={() => onChangeInviteUser(false)}
        onClose={() => onChangeInviteUser(false)}
        onUserInvited={() => {
          onChangeInviteUser(false);
        }}
      />
    </>
  );
};
