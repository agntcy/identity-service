/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useMemo, useState} from 'react';
import {ConditionalQueryRenderer} from '../../ui/conditional-query-renderer';
import {EmptyState, MenuItem, SelectNodeType, Table, toast, Typography} from '@outshift/spark-design';
import {useGetAgenticServices} from '@/queries';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {AgenticServiceColumns} from './agentic-services-columns';
import {Card} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import {generatePath, useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {FilterSections} from '@/components/shared/filters-sections';
import {App, AppType} from '@/types/api/app';
import {IdCardIcon, Trash2Icon} from 'lucide-react';
import {ConfirmModal} from '@/components/ui/confirm-modal';
import {useDeleteAgenticService} from '@/mutations';
import {BadgeModalForm} from '@/components/shared/badge-modal-form';

export const ListAgenticServices = () => {
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [query, setQuery] = useState<string | undefined>(undefined);
  const [tempApp, setTempApp] = useState<App | undefined>(undefined);
  const [showBadgeForm, setShowBadgeForm] = useState<boolean>(false);
  const [showActionsModal, setShowActionsModal] = useState<boolean>(false);
  const [appTypeFilters, setAppTypeFilters] = useState<AppType[]>([
    AppType.APP_TYPE_AGENT_A2A,
    AppType.APP_TYPE_AGENT_OASF,
    AppType.APP_TYPE_MCP_SERVER
  ]);

  const {data, isLoading, isFetching, error, refetch} = useGetAgenticServices({
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    query: query,
    types: appTypeFilters
  });

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
      setPagination((prev) => ({...prev, pageIndex: 0}));
    },
    [setQuery, setPagination]
  );

  const handleTypeFilterChange = useCallback((selectedValues: SelectNodeType<AppType>[]) => {
    setAppTypeFilters(selectedValues.map((node) => node.value as AppType));
    setPagination((prev) => ({...prev, pageIndex: 0}));
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
    deleteMutation.mutate(tempApp?.id || '');
    setTempApp(undefined);
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
          },
          actionTitle: 'Retry'
        }}
        useContainer
        useLoading={false}
      >
        <Card className={cn(!isLoading && 'p-0')} variant="secondary">
          <Table
            columns={AgenticServiceColumns()}
            data={data?.apps || []}
            isLoading={isLoading || isFetching}
            densityCompact
            muiTableBodyRowProps={({row}) => ({
              sx: {cursor: 'pointer', '& .MuiIconButton-root': {color: (theme) => theme.palette.vars.interactiveSecondaryDefaultDefault}},
              onClick: () => {
                const path = generatePath(PATHS.agenticServices.info, {id: row.original?.id});
                void navigate(path, {replace: true});
              }
            })}
            renderTopToolbar={() => (
              <FilterSections
                title={`${data?.pagination?.total ?? 0} Agentic ${Number(data?.pagination?.total) > 1 ? 'Services' : 'Service'}`}
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
            rowsPerPageOptions={[1, 10, 25, 50, 100]}
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
              <EmptyState
                title="No Agentic Services"
                description="Currently, there are no agentic services available."
                containerProps={{paddingBottom: '40px'}}
              />
            )}
          />
        </Card>
      </ConditionalQueryRenderer>
      <ConfirmModal
        open={showActionsModal}
        title="Delete Agentic Service"
        description={
          <>
            Are you sure you want to delete this agentic service <b>{tempApp?.id}</b>? This action cannot be undone.
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
        />
      )}
    </>
  );
};
