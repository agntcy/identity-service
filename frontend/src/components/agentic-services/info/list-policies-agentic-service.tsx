/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useMemo, useState} from 'react';
import {Box, EmptyState, Table} from '@outshift/spark-design';
import {useGetPolicies} from '@/queries';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {Card} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import {generatePath, useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {FilterSections} from '@/components/shared/helpers/filters-sections';
import {PlusIcon} from 'lucide-react';
import {ListRules} from '@/components/shared/list-rules/list-rules';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {PoliciesColumns} from './policies-columns';

export const ListPoliciesAgenticService = ({appId, mode = 'assinged'}: {appId?: string; mode: 'assinged' | 'used-by'}) => {
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

  const {data, isLoading, error, refetch} = useGetPolicies({
    query: {
      page: pagination.pageIndex + 1,
      size: pagination.pageSize,
      query: query,
      appIds: appId && mode === 'assinged' ? [appId] : undefined,
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
      setQuery(value);
      setPagination((prev) => ({...prev, pageIndex: 0}));
    },
    [setQuery, setPagination]
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
        <Card className={cn(!isLoading && 'p-0')} variant="secondary">
          <Table
            columns={PoliciesColumns()}
            data={dataPolicies}
            isLoading={isLoading}
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
                void navigate(path, {replace: true});
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
                isLoading={isLoading}
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
            onPaginationChange={setPagination}
            rowCount={Number(data?.pagination?.total) || 0}
            rowsPerPageOptions={[1, 15, 25, 50, 100]}
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
                    void navigate(PATHS.policies.create, {replace: true});
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
