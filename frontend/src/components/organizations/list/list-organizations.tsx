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
import {Trash2Icon, UserRoundPlusIcon} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useAuth} from '@/hooks';
import {generatePath, useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {useDeleteTenant} from '@/mutations';
import {ConfirmModal} from '@/components/ui/confirm-modal';

export const ListOrganizations = () => {
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [tenantId, setTenantId] = useState<string | undefined>(undefined);
  const openActionsModal = Boolean(tenantId);

  const {data, isLoading, isFetching, refetch, error} = useGetTenants();
  const {authInfo, logout} = useAuth();
  const currentTenantId = authInfo?.user?.tenant?.id;

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
    deleteTenantMutation.mutate(tenantId! || '');
    setTenantId(undefined);
  }, [deleteTenantMutation, tenantId]);

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
          },
          actionTitle: 'Retry'
        }}
        useContainer
      >
        <Card className={cn(!(isFetching || isLoading) && 'p-0')} variant="secondary">
          <Table
            columns={OrganizationsColumns()}
            data={data?.tenants || []}
            isLoading={isLoading || isFetching}
            densityCompact
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
            title={{label: 'Organizations', count: data?.tenants?.length || 0}}
            state={{pagination, sorting}}
            onSortingChange={setSorting}
            renderRowActionMenuItems={({row}) => {
              if (currentTenantId !== row.original.id) {
                return [];
              }
              return [
                <MenuItem key="edit" onClick={() => console.info('Edit', row)} sx={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <UserRoundPlusIcon className="w-4 h-4" color="#062242" />
                  <Typography variant="body2" color="#1A1F27">
                    Add
                  </Typography>
                </MenuItem>,
                <MenuItem key="delete" onClick={() => console.info('Delete', row)} sx={{display: 'flex', alignItems: 'center', gap: '8px'}}>
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
        onCancel={() => setTenantId(undefined)}
        onConfirm={handleClickOnDelete}
      />
    </>
  );
};
