/* eslint-disable indent */
/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useMemo, useState} from 'react';
import {ConditionalQueryRenderer} from '../../ui/conditional-query-renderer';
import {Box, EmptyState, Link, MenuItem, SelectNodeType, Table, toast, Typography} from '@outshift/spark-design';
import {useGetAgenticServices, useGetAgenticServiceTotalCount} from '@/queries';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {AgenticServiceColumns} from './agentic-services-columns';
import {Card} from '@/components/ui/card';
import {generatePath, useNavigate, useSearchParams} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {FilterSections} from '@/components/ui/filters-sections';
import {App, AppType} from '@/types/api/app';
import {CheckIcon, IdCardIcon, PencilIcon, PlusIcon, Trash2Icon} from 'lucide-react';
import {ConfirmModal} from '@/components/ui/confirm-modal';
import {useDeleteAgenticService} from '@/mutations';
import {useFeatureFlagsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';
import {useAnalytics} from '@/hooks';
import {BadgeModalForm} from '@/components/shared/agentic-services/badge-modal-form';
import {DEFAULT_ROWS_PER_PAGE, ROWS_PER_PAGE_OPTION} from '@/constants/pagination';
import {isEqual} from 'lodash';

export const ListAgenticServices = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: Number(searchParams.get('page')) || 0,
    pageSize: Number(searchParams.get('size')) || DEFAULT_ROWS_PER_PAGE
  });
  const [sorting, setSorting] = useState<MRT_SortingState>([
    searchParams.get('sortColumn') && searchParams.get('sortDesc')
      ? {
          id: searchParams.get('sortColumn')!,
          desc: searchParams.get('sortDesc') === 'true'
        }
      : {
          id: 'createdAt',
          desc: true
        }
  ]);
  const [query, setQuery] = useState<string | undefined>(searchParams.get('query') || undefined);
  const [tempApp, setTempApp] = useState<App | undefined>(undefined);
  const [showBadgeForm, setShowBadgeForm] = useState<boolean>(false);
  const [showActionsModal, setShowActionsModal] = useState<boolean>(false);
  const [appTypeFilters, setAppTypeFilters] = useState<AppType[]>(
    searchParams.get('types')
      ? searchParams
          .get('types')!
          .split(',')
          .map((type) => type as AppType)
      : [AppType.APP_TYPE_AGENT_A2A, AppType.APP_TYPE_AGENT_OASF, AppType.APP_TYPE_MCP_SERVER]
  );

  const {data, isFetching, isRefetching, error, refetch} = useGetAgenticServices({
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    query: query,
    types: appTypeFilters,
    sortColumn: sorting[0]?.id,
    sortDesc: sorting[0]?.desc
  });

  const {data: dataCount} = useGetAgenticServiceTotalCount();

  const {analyticsTrack} = useAnalytics();

  const {isTbacEnabled} = useFeatureFlagsStore(
    useShallow((state) => ({
      isTbacEnabled: state.featureFlags.isTbacEnabled
    }))
  );

  const navigate = useNavigate();

  const treeDataTypeFilters: SelectNodeType<AppType>[] = useMemo(() => {
    return [
      {
        value: AppType.APP_TYPE_AGENT_A2A,
        valueFormatter: () => 'A2A Agent',
        isSelectable: true,
        isSelected: appTypeFilters.includes(AppType.APP_TYPE_AGENT_A2A)
      },
      {
        value: AppType.APP_TYPE_AGENT_OASF,
        valueFormatter: () => 'OASF',
        isSelectable: true,
        isSelected: appTypeFilters.includes(AppType.APP_TYPE_AGENT_OASF)
      },
      {
        value: AppType.APP_TYPE_MCP_SERVER,
        valueFormatter: () => 'MCP Server',
        isSelectable: true,
        isSelected: appTypeFilters.includes(AppType.APP_TYPE_MCP_SERVER)
      }
    ];
  }, [appTypeFilters]);

  const handleSortingChange = useCallback(
    (updaterOrValue: MRT_SortingState | ((old: MRT_SortingState) => MRT_SortingState)) => {
      setSorting(updaterOrValue);
      const newSearchParams = new URLSearchParams(searchParams);
      if (typeof updaterOrValue === 'function') {
        const newSorting = updaterOrValue(sorting);
        if (newSorting.length > 0) {
          newSearchParams.set('sortColumn', newSorting[0].id);
          newSearchParams.set('sortDesc', String(newSorting[0].desc));
        } else {
          newSearchParams.delete('sortColumn');
          newSearchParams.delete('sortDesc');
        }
      } else {
        if (updaterOrValue.length > 0) {
          newSearchParams.set('sortColumn', updaterOrValue[0].id);
          newSearchParams.set('sortDesc', String(updaterOrValue[0].desc));
        } else {
          newSearchParams.delete('sortColumn');
          newSearchParams.delete('sortDesc');
        }
      }
      setSearchParams(newSearchParams);
    },
    [searchParams, setSearchParams, sorting]
  );

  const handleQueryChange = useCallback(
    (value: string) => {
      if (value) {
        setQuery(value);
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('query', value);
        setSearchParams(newSearchParams);
      } else {
        setQuery(undefined);
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('query');
        setSearchParams(newSearchParams);
      }
    },
    [searchParams, setSearchParams]
  );

  const handlePaginationChange = useCallback(
    (updaterOrValue: MRT_PaginationState | ((old: MRT_PaginationState) => MRT_PaginationState)) => {
      setPagination(updaterOrValue);
      const newSearchParams = new URLSearchParams(searchParams);
      if (typeof updaterOrValue === 'function') {
        const newPagination = updaterOrValue(pagination);
        newSearchParams.set('page', String(newPagination.pageIndex + 1));
        newSearchParams.set('size', String(newPagination.pageSize));
      } else {
        newSearchParams.set('page', String(updaterOrValue.pageIndex + 1));
        newSearchParams.set('size', String(updaterOrValue.pageSize));
      }
      setSearchParams(newSearchParams);
    },
    [pagination, searchParams, setSearchParams]
  );

  const handleTypeFilterChange = useCallback(
    (selectedValues: SelectNodeType<AppType>[]) => {
      const selectedTypes = selectedValues.map((node) => node.value as AppType);
      if (!isEqual(selectedTypes, appTypeFilters)) {
        setAppTypeFilters(selectedTypes);
        const newSearchParams = new URLSearchParams(searchParams);
        if (selectedTypes.length > 0) {
          newSearchParams.set('types', selectedTypes.join(','));
        } else {
          newSearchParams.delete('types');
        }
        setSearchParams(newSearchParams);
      }
    },
    [appTypeFilters, searchParams, setSearchParams]
  );

  const deleteMutation = useDeleteAgenticService({
    callbacks: {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Agentic service deleted successfully.',
          type: 'success'
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'An error occurred while deleting the agentic service. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const handleClickOnDelete = useCallback(() => {
    analyticsTrack('CLICK_CONFIRM_DELETE_AGENTIC_SERVICE', {
      type: tempApp?.type
    });
    setShowActionsModal(false);
    setTempApp(undefined);
    deleteMutation.mutate(tempApp?.id || '');
  }, [analyticsTrack, deleteMutation, tempApp?.id, tempApp?.type]);

  return (
    <>
      <ConditionalQueryRenderer
        itemName="Agentic Services"
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
            columns={AgenticServiceColumns()}
            data={data?.apps || []}
            isLoading={isFetching || deleteMutation.isPending}
            muiTableBodyRowProps={({row}) => ({
              sx: {
                cursor: 'pointer',
                '& .MuiIconButton-root': {
                  color: (theme) => theme.palette.vars.interactiveSecondaryDefaultDefault
                }
              },
              onClick: () => {
                analyticsTrack('CLICK_NAVIGATION_AGENTIC_SERVICE_INFO', {
                  type: row.original.type
                });
                const path = generatePath(PATHS.agenticServices.info.base, {id: row.original?.id});
                void navigate(path);
              }
            })}
            renderTopToolbar={() => (
              <FilterSections
                title={`${dataCount?.total ?? 0} Agentic ${Number(dataCount?.total) > 1 ? 'Services' : 'Service'}`}
                searchFieldProps={{
                  placeholder: 'Search...',
                  value: query,
                  onChangeCallback: handleQueryChange
                }}
                dropDowns={[
                  {
                    buttonContent: 'Type',
                    isSearchFieldEnabled: false,
                    treeData: treeDataTypeFilters,
                    onSelectValues: handleTypeFilterChange
                  }
                ]}
                isLoading={isFetching}
                isRefetching={isRefetching}
                onClickRefresh={() => {
                  void refetch();
                }}
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
            manualPagination={true}
            manualFiltering={true}
            manualSorting={true}
            onPaginationChange={handlePaginationChange}
            rowCount={Number(data?.pagination?.total) || 0}
            rowsPerPageOptions={ROWS_PER_PAGE_OPTION}
            state={{pagination, sorting}}
            onSortingChange={handleSortingChange}
            renderRowActionMenuItems={({row}) => {
              return [
                <MenuItem
                  key="verify-identity"
                  onClick={() => {
                    analyticsTrack('CLICK_NAVIGATION_VERIFY_IDENTITY_AGENTIC_SERVICE', {
                      type: row.original.type
                    });
                    const path = generatePath(PATHS.verifyIdentity.info, {id: row.original.id});
                    void navigate(path);
                  }}
                  sx={{display: 'flex', alignItems: 'center', gap: '8px'}}
                >
                  <CheckIcon className="w-4 h-4" color="#062242" />
                  <Typography variant="body2" color="#1A1F27">
                    Verifiy Identity
                  </Typography>
                </MenuItem>,
                <MenuItem
                  key="re-issue-badge"
                  onClick={() => {
                    analyticsTrack('CLICK_REISSUE_BADGE_AGENTIC_SERVICE', {
                      type: row.original.type
                    });
                    setTempApp(row.original);
                    setShowBadgeForm(true);
                  }}
                  sx={{display: 'flex', alignItems: 'center', gap: '8px'}}
                >
                  <IdCardIcon className="w-4 h-4" color="#062242" />
                  <Typography variant="body2" color="#1A1F27">
                    Re-Issue Badge
                  </Typography>
                </MenuItem>,
                <MenuItem
                  key="edit-app"
                  onClick={() => {
                    analyticsTrack('CLICK_NAVIGATION_EDIT_AGENTIC_SERVICE', {
                      type: row.original.type
                    });
                    const path = generatePath(PATHS.agenticServices.edit, {id: row.original.id});
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
                  key="delete-app"
                  onClick={() => {
                    analyticsTrack('CLICK_DELETE_AGENTIC_SERVICE', {
                      type: row.original.type
                    });
                    setTempApp(row.original);
                    setShowActionsModal(true);
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
            renderEmptyRowsFallback={() => (
              <Box
                sx={(theme) => ({
                  backgroundColor: theme.palette.vars.controlBackgroundDefault
                })}
              >
                <EmptyState
                  title="No Agentic Services"
                  description="Currently, there are no agentic services available."
                  containerProps={{paddingBottom: '40px'}}
                  actionTitle="Add Agentic Service"
                  actionCallback={() => {
                    analyticsTrack('CLICK_NAVIGATION_ADD_AGENTIC_SERVICE');
                    void navigate(PATHS.agenticServices.add);
                  }}
                  actionButtonProps={{
                    sx: {fontWeight: '600 !important'},
                    startIcon: <PlusIcon className="w-4 h-4" />,
                    variant: 'outlined'
                  }}
                />
              </Box>
            )}
          />
        </Card>
      </ConditionalQueryRenderer>
      <ConfirmModal
        open={showActionsModal}
        title="Delete Agentic Service"
        description={
          <>
            Are you sure you want to delete this agentic service <b>{tempApp?.name}</b>? This action cannot be undone.
            {isTbacEnabled && (
              <>
                <br />
                <br />
                <strong>Note:</strong> If this agentic service is a TBAC service, it will also remove the associated TBAC
                policies.
                <br />
                <br />
                Confirm policies{' '}
                <Link
                  href={(() => {
                    const basePath = generatePath(PATHS.agenticServices.info.policiesAssignedTo, {
                      id: tempApp?.id || ''
                    });
                    return basePath;
                  })()}
                >
                  here
                </Link>
                .
                <br />
              </>
            )}
          </>
        }
        confirmButtonText="Delete"
        onCancel={() => {
          setShowActionsModal(false);
          setTempApp(undefined);
        }}
        onConfirm={handleClickOnDelete}
        buttonConfirmProps={{
          color: 'negative'
        }}
      />
      {tempApp && (
        <BadgeModalForm
          title="Re-Issue Badge"
          app={tempApp}
          open={showBadgeForm}
          onClose={() => {
            setShowBadgeForm(false);
            setTempApp(undefined);
          }}
          onCancel={() => {
            setShowBadgeForm(false);
            setTempApp(undefined);
          }}
          confirmButtonText="Re-Issue"
        />
      )}
    </>
  );
};
