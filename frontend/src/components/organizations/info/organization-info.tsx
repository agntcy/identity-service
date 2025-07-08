/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useState} from 'react';
import {ConditionalQueryRenderer} from '../../ui/conditional-query-renderer';
import {MenuItem, Table, toast, Typography} from '@outshift/spark-design';
import {useGetUsersGroup} from '@/queries';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {Card} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import {TenantReponse} from '@/types/api/iam';
import {UsersColumns} from './users-columns';
import {InviteUserModal} from '@/components/shared/invite-user-modal';
import {Trash2Icon} from 'lucide-react';
import {useAuth} from '@/hooks';
import {useSettingsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';
import {ConfirmModal} from '@/components/ui/confirm-modal';
import {useDeleteUser} from '@/mutations';

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
  const [openActionsModal, setOpenActionsModal] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  const {data: dataUsers, isLoading: isLoadingUsers, error: errorUsers, refetch} = useGetUsersGroup(groupId || '');

  const {authInfo} = useAuth();
  const currentUserName = authInfo?.user?.username;

  const {isAdmin} = useSettingsStore(
    useShallow((state) => ({
      isAdmin: state.isAdmin
    }))
  );

  const deleteUserMutation = useDeleteUser({
    callbacks: {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'User deleted successfully.',
          type: 'success'
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'An error occurred while deleting the user. Please try again later.',
          type: 'error'
        });
      }
    }
  });

  const handleClickOnDelete = useCallback(() => {
    deleteUserMutation.mutate({
      userId: userId || '',
      tenantId: tenant?.id || ''
    });
    setUserId(undefined);
    setOpenActionsModal(false);
  }, [deleteUserMutation, tenant?.id, userId]);

  return (
    <>
      <ConditionalQueryRenderer
        itemName="Users"
        data={groupId && dataUsers?.users}
        error={errorGroups || errorUsers}
        isLoading={isLoadingGroups || isLoadingUsers}
        useRelativeLoader
        useContainer
        errorListStateProps={{
          actionCallback: () => {
            void refetch();
          }
        }}
      >
        <Card className={cn(!(isLoadingGroups || isLoadingUsers) && 'p-0')} variant="secondary">
          <Table
            columns={UsersColumns()}
            data={dataUsers?.users || []}
            isLoading={isLoadingGroups || isLoadingUsers || deleteUserMutation.isPending}
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
            renderRowActionMenuItems={({row}) => {
              if (currentUserName === row.original.name || !isAdmin) {
                return [];
              }
              return [
                <MenuItem
                  key="delete-user"
                  onClick={() => {
                    setUserId(row.original.name);
                    setOpenActionsModal(true);
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
      <ConfirmModal
        open={openActionsModal}
        title="Delete User"
        description={
          <>
            Are you sure you want to delete this user <b>{userId}</b>? This action cannot be undone.
          </>
        }
        confirmButtonText="Delete"
        onCancel={() => {
          setUserId(undefined);
          setOpenActionsModal(false);
        }}
        onConfirm={handleClickOnDelete}
        buttonConfirmProps={{
          color: 'negative'
        }}
      />
    </>
  );
};
