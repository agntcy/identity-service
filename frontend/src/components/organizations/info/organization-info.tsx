/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useMemo, useState} from 'react';
import {ConditionalQueryRenderer} from '../../ui/conditional-query-renderer';
import {MenuItem, Table, toast, Typography} from '@outshift/spark-design';
import {useGetUsersGroup} from '@/queries';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {Card} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import {TenantReponse} from '@/types/api/iam';
import {UsersColumns} from './users-columns';
import {Trash2Icon} from 'lucide-react';
import {useAnalytics, useAuth} from '@/hooks';
import {useSettingsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';
import {ConfirmModal} from '@/components/ui/confirm-modal';
import {useDeleteUser} from '@/mutations';
import {InviteUserModal} from '@/components/shared/organizations/invite-user-modal';
import {FilterSections} from '@/components/shared/helpers/filters-sections';

export const OrganizationInfo = ({
  tenant,
  onChangeInviteUser,
  showInviteUserModal = false
}: {
  tenant?: TenantReponse;
  showInviteUserModal: boolean;
  onChangeInviteUser: (value: boolean) => void;
}) => {
  const [query, setQuery] = useState<string | undefined>(undefined);
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

  const {analyticsTrack} = useAnalytics();

  const {data: dataUsers, isLoading: isLoadingUsers, error: errorUsers, refetch} = useGetUsersGroup(groupId || '');

  const {authInfo} = useAuth();
  const currentUserName = authInfo?.user?.username;

  const {isAdmin} = useSettingsStore(
    useShallow((state) => ({
      isAdmin: state.isAdmin
    }))
  );

  const dataCount = useMemo(() => {
    return dataUsers?.users.length ?? 0;
  }, [dataUsers?.users.length]);

  const filterData = useMemo(() => {
    if (!query) {
      return dataUsers?.users || [];
    }
    return (
      dataUsers?.users.filter(
        (user) =>
          user.name.toLowerCase().includes(query.toLowerCase()) || user.role.toLowerCase().includes(query.toLowerCase())
      ) || []
    );
  }, [dataUsers?.users, query]);

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
    analyticsTrack('CLICK_CONFIRM_DELETE_USER');
    deleteUserMutation.mutate({
      userId: userId || '',
      tenantId: tenant?.id || ''
    });
    setUserId(undefined);
    setOpenActionsModal(false);
  }, [analyticsTrack, deleteUserMutation, tenant?.id, userId]);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
    },
    [setQuery]
  );

  return (
    <>
      <ConditionalQueryRenderer
        itemName="Users"
        data={groupId && dataUsers?.users}
        error={errorGroups || errorUsers}
        isLoading={isLoadingGroups || isLoadingUsers}
        useRelativeLoader
        errorListStateProps={{
          actionCallback: () => {
            void refetch();
          }
        }}
      >
        <Card className={cn(!(isLoadingGroups || isLoadingUsers) && 'p-0')} variant="secondary">
          <Table
            columns={UsersColumns()}
            data={filterData}
            isLoading={isLoadingGroups || isLoadingUsers || deleteUserMutation.isPending}
            renderTopToolbar={() => (
              <FilterSections
                title={`${dataCount} ${dataCount > 1 ? 'Users' : 'User'}`}
                searchFieldProps={{
                  placeholder: 'Search...',
                  value: query,
                  onChangeCallback: handleQueryChange
                }}
                isLoading={isLoadingUsers || isLoadingGroups}
              />
            )}
            enableColumnResizing
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
            rowCount={dataCount}
            rowsPerPageOptions={[1, 10, 25, 50, 100]}
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
                    analyticsTrack('CLICK_DELETE_USER');
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
