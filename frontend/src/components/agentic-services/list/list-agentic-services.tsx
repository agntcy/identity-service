/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useMemo, useState} from 'react';
import {ConditionalQueryRenderer} from '../../ui/conditional-query-renderer';
import {Box, EmptyState, Link, MenuItem, SelectNodeType, Table, toast, Typography} from '@outshift/spark-design';
import {useGetAgenticServices, useGetAgenticServiceTotalCount} from '@/queries';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {AgenticServiceColumns} from './agentic-services-columns';
import {Card} from '@/components/ui/card';
import {generatePath, useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {FilterSections} from '@/components/shared/filters-sections';
import {App, AppType} from '@/types/api/app';
import {IdCardIcon, PencilIcon, PlusIcon, Trash2Icon} from 'lucide-react';
import {ConfirmModal} from '@/components/ui/confirm-modal';
import {useDeleteAgenticService} from '@/mutations';
import {BadgeModalForm} from '@/components/shared/badge-modal-form';
import {cn} from '@/lib/utils';
import {useFeatureFlagsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';

export const ListAgenticServices = () => {
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 15
  });
  const [sorting, setSorting] = useState<MRT_SortingState>([
    {
      id: 'createdAt',
      desc: true
    }
  ]);
  const [query, setQuery] = useState<string | undefined>(undefined);
  const [tempApp, setTempApp] = useState<App | undefined>(undefined);
  const [showBadgeForm, setShowBadgeForm] = useState<boolean>(false);
  const [showActionsModal, setShowActionsModal] = useState<boolean>(false);
  const [appTypeFilters, setAppTypeFilters] = useState<AppType[]>([
    AppType.APP_TYPE_AGENT_A2A,
    AppType.APP_TYPE_AGENT_OASF,
    AppType.APP_TYPE_MCP_SERVER
  ]);

  const {data, isLoading, error, refetch} = useGetAgenticServices({
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    query: query,
    types: appTypeFilters
  });

  const {data: dataCount} = useGetAgenticServiceTotalCount();

  const {isTbacEnable} = useFeatureFlagsStore(
    useShallow((state) => ({
      isTbacEnable: state.featureFlags.isTbacEnable
    }))
  );

  const navigate = useNavigate();

  const treeDataTypeFilters: SelectNodeType<AppType>[] = useMemo(() => {
    return [
      {
        value: AppType.APP_TYPE_AGENT_A2A,
        valueFormatter: () => 'A2A Agent',
        isSelectable: true,
        isSelected: true
      },
      {
        value: AppType.APP_TYPE_AGENT_OASF,
        valueFormatter: () => 'OASF',
        isSelectable: true,
        isSelected: true
      },
      {
        value: AppType.APP_TYPE_MCP_SERVER,
        valueFormatter: () => 'MCP Server',
        isSelectable: true,
        isSelected: true
      }
    ];
  }, []);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
    },
    [setQuery]
  );

  const handleTypeFilterChange = useCallback((selectedValues: SelectNodeType<AppType>[]) => {
    setAppTypeFilters(selectedValues.map((node) => node.value as AppType));
  }, []);

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
    setShowActionsModal(false);
    setTempApp(undefined);
    deleteMutation.mutate(tempApp?.id || '');
  }, [deleteMutation, tempApp]);

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
        <Card className={cn(!isLoading && 'p-0')} variant="secondary">
          <Table
            columns={AgenticServiceColumns()}
            data={data?.apps || []}
            isLoading={isLoading || deleteMutation.isPending}
            muiTableBodyRowProps={({row}) => ({
              sx: {cursor: 'pointer', '& .MuiIconButton-root': {color: (theme) => theme.palette.vars.interactiveSecondaryDefaultDefault}},
              onClick: () => {
                const path = generatePath(PATHS.agenticServices.info, {id: row.original?.id});
                void navigate(path, {replace: true});
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
                isLoading={isLoading}
              />
            )}
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
            onPaginationChange={setPagination}
            rowCount={Number(data?.pagination?.total) || 0}
            rowsPerPageOptions={[1, 15, 25, 50, 100]}
            state={{pagination, sorting}}
            onSortingChange={setSorting}
            renderRowActionMenuItems={({row}) => {
              return [
                <MenuItem
                  key="re-issue-badge"
                  onClick={() => {
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
                    const path = generatePath(PATHS.agenticServices.edit, {id: row.original.id});
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
                  key="delete-app"
                  onClick={() => {
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
                    void navigate(PATHS.agenticServices.add, {replace: true});
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
            {isTbacEnable && (
              <>
                <br />
                <br />
                <strong>Note:</strong> If this agentic service is a TBAC service, it will also remove the associated TBAC policies.
                <br />
                <br />
                Confirm policies{' '}
                <Link
                  href={(() => {
                    const basePath = generatePath(PATHS.agenticServices.info, {id: tempApp?.id || ''});
                    const searchParams = new URLSearchParams();
                    searchParams.set('view', 'policies-assigned');
                    return `${basePath}?${searchParams.toString()}`;
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
