/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useMemo, useState} from 'react';
import {ConditionalQueryRenderer} from '../../ui/conditional-query-renderer';
import {MenuItem, Table, toast} from '@open-ui-kit/core';
import {useGetTenants} from '@/queries';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {OrganizationsColumns} from './organizations-columns';
import {Card} from '@/components/ui/card';
import {Typography} from '@mui/material';
import {PencilIcon, Trash2Icon, UserRoundPlusIcon} from 'lucide-react';
import {useAnalytics, useAuth} from '@/hooks';
import {generatePath, useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {useDeleteTenant} from '@/mutations';
import {ConfirmModal} from '@/components/ui/confirm-modal';
import {useSettingsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';
import {InviteUserModal} from '@/components/shared/organizations/invite-user-modal';
import {FilterSections} from '@/components/ui/filters-sections';
import {DEFAULT_ROWS_PER_PAGE, ROWS_PER_PAGE_OPTION} from '@/constants/pagination';

export const ListOrganizations = () => {
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_ROWS_PER_PAGE
  });
  const [query, setQuery] = useState<string | undefined>(undefined);
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [tenantId, setTenantId] = useState<string | undefined>(undefined);
  const [openActionsModal, setOpenActionsModal] = useState<boolean>(false);
  const [showInviteUserModal, setShowInviteUserModal] = useState<boolean>(false);

  const {data, isFetching, isRefetching, refetch, error} = useGetTenants();
  const {authInfo, logout} = useAuth();
  const currentTenantId = authInfo?.user?.tenant?.id;

  const dataCount = useMemo(() => {
    return data?.tenants.length ?? 0;
  }, [data?.tenants.length]);

  const filterData = useMemo(() => {
    if (!query) {
      return data?.tenants || [];
    }
    return (
      data?.tenants.filter(
        (tenant) =>
          tenant.name.toLowerCase().includes(query.toLowerCase()) || tenant.id.toLowerCase().includes(query.toLowerCase())
      ) || []
    );
  }, [data?.tenants, query]);

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

  const handleQueryChange = useCallback((value: string) => {
    if (value) {
      setQuery(value);
    } else {
      setQuery(undefined);
    }
  }, []);

  const handlePaginationChange = useCallback(
    (updaterOrValue: MRT_PaginationState | ((old: MRT_PaginationState) => MRT_PaginationState)) => {
      setPagination(updaterOrValue);
    },
    []
  );

  return (
    <>
      <ConditionalQueryRenderer
        itemName="Organizations"
        data={true}
        error={error}
        isLoading={false}
        useRelativeLoader
        errorListStateProps={{
          actionCallback: () => {
            void refetch();
          }
        }}
        useLoading={false}
      >
        <Card className="p-0" variant="secondary">
          <Table
            columns={OrganizationsColumns()}
            data={filterData}
            isLoading={isFetching}
            renderTopToolbar={() => (
              <FilterSections
                title={`${dataCount} ${dataCount > 1 ? 'Organizations' : 'Organization'}`}
                searchFieldProps={{
                  placeholder: 'Search...',
                  value: query,
                  onChangeCallback: handleQueryChange
                }}
                isLoading={isFetching}
                isRefetching={isRefetching}
                onClickRefresh={() => {
                  void refetch();
                }}
              />
            )}
            muiTableBodyRowProps={({row}) => ({
              sx: {
                cursor: 'pointer',
                '& .MuiIconButton-root': {
                  color: (theme) => theme.palette.vars.interactiveSecondaryDefaultDefault
                }
              },
              onClick: () => {
                if (currentTenantId !== row.original.id || !isAdmin) {
                  toast({
                    title: 'Access Denied',
                    description: 'You cannot view or edit this organization as it is not your current organization.',
                    type: 'warning'
                  });
                } else if (isAdmin) {
                  analyticsTrack('CLICK_ORGANIZATION_INFO');
                  const path = generatePath(PATHS.settings.organizationsAndUsers.info, {
                    id: row.original?.id
                  });
                  void navigate(path);
                }
              }
            })}
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
            onPaginationChange={handlePaginationChange}
            rowCount={dataCount}
            rowsPerPageOptions={ROWS_PER_PAGE_OPTION}
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
                    const path = generatePath(PATHS.settings.organizationsAndUsers.edit, {
                      id: row.original.id
                    });
                    void navigate(path);
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
