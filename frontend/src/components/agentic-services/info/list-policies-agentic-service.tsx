/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useMemo, useState} from 'react';
import {Box, EmptyState, Table} from '@cisco-eti/spark-design';
import {useGetPolicies} from '@/queries';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {Card} from '@/components/ui/card';
import {generatePath, useNavigate, useSearchParams} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {FilterSections} from '@/components/ui/filters-sections';
import {PlusIcon} from 'lucide-react';
import {ListRules} from '@/components/shared/list-rules/list-rules';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {PoliciesColumns} from './policies-columns';
import {DEFAULT_ROWS_PER_PAGE, ROWS_PER_PAGE_OPTION} from '@/constants/pagination';

export const ListPoliciesAgenticService = ({appId, mode = 'assigned'}: {appId?: string; mode: 'assigned' | 'used-by'}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: Number(searchParams.get('page')) || 0,
    pageSize: Number(searchParams.get('size')) || DEFAULT_ROWS_PER_PAGE
  });
  const [sorting, setSorting] = useState<MRT_SortingState>([
    {
      id: 'createdAt',
      desc: true
    }
  ]);
  const [query, setQuery] = useState<string | undefined>(searchParams.get('query') || undefined);

  const {data, isFetching, isRefetching, error, refetch} = useGetPolicies({
    query: {
      page: pagination.pageIndex + 1,
      size: pagination.pageSize,
      query: query,
      appIds: appId && mode === 'assigned' ? [appId] : undefined,
      rulesForAppIds: appId && mode === 'used-by' ? [appId] : undefined
    }
  });

  const dataPolicies = useMemo(() => {
    return (
      data?.policies?.map((policy) => ({
        ...policy,
        subRows: <ListRules policy={policy} />
      })) || []
    );
  }, [data]);

  const navigate = useNavigate();

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

  return (
    <>
      <ConditionalQueryRenderer
        itemName="Policies"
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
            columns={PoliciesColumns()}
            data={dataPolicies}
            isLoading={isFetching}
            muiTableBodyRowProps={({row, isDetailPanel}) => ({
              sx: {
                cursor: 'pointer',
                '& .MuiIconButton-root': {
                  color: (theme) => theme.palette.vars.interactiveSecondaryDefaultDefault
                }
              },
              onClick: () => {
                if (isDetailPanel) {
                  return;
                }
                const path = generatePath(PATHS.policies.info, {id: row.original?.id});
                void navigate(path);
              }
            })}
            renderTopToolbar={() => (
              <FilterSections
                title={`${data?.pagination?.total ?? 0} ${Number(data?.pagination?.total) > 1 ? 'Policies' : 'Policy'}`}
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
            enableColumnResizing
            enableRowActions
            topToolbarProps={{
              enableActions: false
            }}
            enableExpanding={true}
            enableExpandAll={true}
            muiTableContainerProps={{
              style: {
                border: '1px solid #D5DFF7'
              }
            }}
            manualPagination={true}
            manualFiltering={true}
            onPaginationChange={handlePaginationChange}
            rowCount={Number(data?.pagination?.total) || 0}
            rowsPerPageOptions={ROWS_PER_PAGE_OPTION}
            state={{pagination, sorting}}
            onSortingChange={setSorting}
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
                  title="No policies found"
                  description="No policies are currently in place. Click 'Add Policy' to create and apply one to your registered agentic services."
                  containerProps={{paddingBottom: '40px'}}
                  actionTitle="Add Policy"
                  actionCallback={() => {
                    void navigate(PATHS.policies.create);
                  }}
                  actionButtonProps={{
                    sx: {fontWeight: '600 !important'},
                    startIcon: <PlusIcon className="w-4 h-4" />
                  }}
                />
              </Box>
            )}
          />
        </Card>
      </ConditionalQueryRenderer>
    </>
  );
};
