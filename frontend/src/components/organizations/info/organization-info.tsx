/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useState} from 'react';
import {ConditionalQueryRenderer} from '../../ui/conditional-query-renderer';
import {MenuItem, Table, Typography} from '@outshift/spark-design';
import {useGetSession, useGetUsersGroup} from '@/queries';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {Card} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import {TenantReponse} from '@/types/api/iam';
import {UsersColumns} from './users-columns';
import {InviteUserModal} from '@/components/shared/invite-user-modal';
import {Trash2Icon} from 'lucide-react';
import {useAuth} from '@/hooks';

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
  const [groupId, setGroupId] = useState<string | undefined>();
  const [isLoadingGroups, setIsLoadingGroups] = useState<boolean>(true);
  const [errorGroups, setErrorGroups] = useState<Error | null>(null);

  const {data: dataUsers, isLoading: isLoadingUsers, error: errorUsers} = useGetUsersGroup(groupId || '');
  const {data: dataSession} = useGetSession();
  const isAdmin = dataSession?.groups[0].role === 'ADMIN' || false;

  const {authInfo} = useAuth();
  const currentTenantId = authInfo?.user?.tenant?.id;

  return (
    <>
      <ConditionalQueryRenderer
        itemName="Users"
        data={groupId && dataUsers?.users}
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
            title={{
              label: (dataUsers?.users?.length ?? 0) > 1 ? 'Users' : 'User',
              count: dataUsers?.users?.length ?? 0
            }}
            state={{pagination, sorting}}
            onSortingChange={setSorting}
            muiBottomToolbarProps={{
              style: {
                boxShadow: 'none'
              }
            }}
            renderRowActionMenuItems={() => {
              if (currentTenantId !== tenant?.id || !isAdmin) {
                return [];
              }
              return [
                <MenuItem
                  key="delete-user"
                  onClick={() => {
                    // setTenantId(row.original.id);
                    // setOpenActionsModal(true);
                  }}
                  sx={{display: 'flex', alignItems: 'center', gap: '8px'}}
                >
                  <Trash2Icon className="w-4 h-4" color="#C62953" />
                  <Typography variant="body2" color="#C0244C">
                    Delete
                  </Typography>
                </MenuItem>
              ];
            }}
          />
        </Card>
      </ConditionalQueryRenderer>
      <InviteUserModal
        open={showInviteUserModal}
        tenantId={tenant?.id || ''}
        onCancel={() => onChangeInviteUser(false)}
        onClose={() => onChangeInviteUser(false)}
        onUserInvited={() => {
          onChangeInviteUser(false);
        }}
        onGroupIdChange={(id, isLoading, error) => {
          setGroupId(id);
          setIsLoadingGroups(isLoading);
          setErrorGroups(error);
        }}
      />
    </>
  );
};
