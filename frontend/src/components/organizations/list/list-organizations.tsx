/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useState} from 'react';
import {ConditionalQueryRenderer} from '../../ui/conditional-query-renderer';
import {MenuItem, Table, toast} from '@outshift/spark-design';
import {useGetTenants} from '@/queries';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {OrganizationsColumns} from './organizations-columns';
import {Card} from '@/components/ui/card';
import {Typography} from '@mui/material';
import {PencilIcon, Trash2Icon, UserRoundPlusIcon} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useAnalytics, useAuth} from '@/hooks';
import {generatePath, useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {useDeleteTenant} from '@/mutations';
import {ConfirmModal} from '@/components/ui/confirm-modal';
import {InviteUserModal} from '@/components/shared/invite-user-modal';
import {useSettingsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';

export const ListOrganizations = () => {
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [tenantId, setTenantId] = useState<string | undefined>(undefined);
  const [openActionsModal, setOpenActionsModal] = useState<boolean>(false);
  const [showInviteUserModal, setShowInviteUserModal] = useState<boolean>(false);

  const {data, isLoading, isFetching, refetch, error} = useGetTenants();
  const {authInfo, logout} = useAuth();
  const currentTenantId = authInfo?.user?.tenant?.id;

  const {isAdmin} = useSettingsStore(
    useShallow((state) => ({
      isAdmin: state.isAdmin
    }))
  );

  const {analyticsTrack} = useAnalytics();

  const navigate = useNavigate();

  const deleteTenantMutation = useDeleteTenant({
    callbacks: {
      onSuccess: () => {
        void logout({
          revokeAccessToken: true,
          revokeRefreshToken: true,
          clearTokensBeforeRedirect: true
        });
        toast({
          title: 'Success',
          description: 'Organization deleted successfully. You have been logged out.',
          type: 'success'
        });
        void navigate(PATHS.callBackLoading, {replace: true});
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'An error occurred while deleting the organization. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const handleClickOnDelete = useCallback(() => {
    analyticsTrack('CLICK_CONFIRM_DELETE_ORGANIZATION');
    deleteTenantMutation.mutate(tenantId! || '');
    setTenantId(undefined);
    setOpenActionsModal(false);
  }, [analyticsTrack, deleteTenantMutation, tenantId]);

  return (
    <>
      <ConditionalQueryRenderer
        itemName="Organizations"
        data={data?.tenants}
        error={error}
        isLoading={isLoading || isFetching}
        useRelativeLoader
        errorListStateProps={{
          actionCallback: () => {
            void refetch();
          }
        }}
      >
        <Card className={cn(!(isFetching || isLoading) && 'p-0')} variant="secondary">
          <Table
            columns={OrganizationsColumns()}
            data={data?.tenants || []}
            isLoading={isLoading || isFetching}
            muiTableBodyRowProps={({row}) => ({
              sx: {cursor: 'pointer', '& .MuiIconButton-root': {color: (theme) => theme.palette.vars.interactiveSecondaryDefaultDefault}},
              onClick: () => {
                if (currentTenantId !== row.original.id) {
                  toast({
                    title: 'Access Denied',
                    description: 'You cannot view or edit this organization as it is not your current organization.',
                    type: 'warning'
                  });
                } else {
                  analyticsTrack('CLICK_ORGANIZATION_INFO');
                  const path = generatePath(PATHS.settings.organizationsAndUsers.info, {id: row.original?.id});
                  void navigate(path, {replace: true});
                }
              }
            })}
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
            rowCount={data?.tenants.length ?? 0}
            rowsPerPageOptions={[1, 10, 25, 50, 100]}
            title={{
              label: (data?.tenants?.length ?? 0) > 1 ? 'Organizations' : 'Organization',
              count: data?.tenants?.length ?? 0
            }}
            state={{pagination, sorting}}
            onSortingChange={setSorting}
            renderRowActionMenuItems={({row}) => {
              if (currentTenantId !== row.original.id || !isAdmin) {
                return [];
              }
              return [
                <MenuItem
                  key="add-user"
                  onClick={() => {
                    analyticsTrack('CLICK_INVITE_USER');
                    setTenantId(row.original.id);
                    setShowInviteUserModal(true);
                  }}
                  sx={{display: 'flex', alignItems: 'center', gap: '8px'}}
                >
                  <UserRoundPlusIcon className="w-4 h-4" color="#062242" />
                  <Typography variant="body2" color="#1A1F27">
                    Invite
                  </Typography>
                </MenuItem>,
                <MenuItem
                  key="edit-org"
                  onClick={() => {
                    analyticsTrack('CLICK_NAVIGATION_EDIT_ORGANIZATION');
                    const path = generatePath(PATHS.settings.organizationsAndUsers.edit, {id: row.original.id});
                    void navigate(path, {replace: true});
                  }}
                  sx={{display: 'flex', alignItems: 'center', gap: '8px'}}
                >
                  <PencilIcon className="w-4 h-4" color="#062242" />
                  <Typography variant="body2" color="#1A1F27">
                    Edit
                  </Typography>
                </MenuItem>,
                <MenuItem
                  key="delete-org"
                  onClick={() => {
                    analyticsTrack('CLICK_DELETE_ORGANIZATION');
                    setTenantId(row.original.id);
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
            muiBottomToolbarProps={{
              style: {
                boxShadow: 'none'
              }
            }}
          />
        </Card>
      </ConditionalQueryRenderer>
      <ConfirmModal
        open={openActionsModal}
        title="Delete Organization"
        description={
          <>
            Are you sure you want to delete this organization <b>{tenantId}</b>? This action cannot be undone.
          </>
        }
        confirmButtonText="Delete"
        onCancel={() => {
          setTenantId(undefined);
          setOpenActionsModal(false);
        }}
        onConfirm={handleClickOnDelete}
        buttonConfirmProps={{
          color: 'negative'
        }}
      />
      <InviteUserModal
        open={showInviteUserModal}
        tenantId={tenantId || ''}
        onCancel={() => {
          setTenantId(undefined);
          setShowInviteUserModal(false);
        }}
        onClose={() => {
          setTenantId(undefined);
          setShowInviteUserModal(false);
        }}
        onUserInvited={() => {
          setTenantId(undefined);
          setShowInviteUserModal(false);
        }}
      />
    </>
  );
};
