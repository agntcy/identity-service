/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useState} from 'react';
import {ConditionalQueryRenderer} from '../../ui/conditional-query-renderer';
import {Box, EmptyState, Table} from '@outshift/spark-design';
import {useGetPolicyRules} from '@/queries';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {Card} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import {generatePath, useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {FilterSections} from '@/components/shared/filters-sections';
import {PlusIcon} from 'lucide-react';
import {RulesColumns} from './rules-columns';

export const ListRules = ({policyId}: {policyId?: string}) => {
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 15
  });
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [query, setQuery] = useState<string | undefined>(undefined);

  const {data, isLoading, error, refetch} = useGetPolicyRules({
    policyId: policyId,
    query: {
      page: pagination.pageIndex + 1,
      size: pagination.pageSize,
      query: query
    }
  });

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
        itemName="Rules"
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
            densityCompact
            columns={RulesColumns()}
            data={data?.rules || []}
            isLoading={isLoading}
            muiTableBodyRowProps={() => ({
              sx: {cursor: 'default'}
            })}
            renderTopToolbar={() => (
              <FilterSections
                title={`${data?.pagination?.total ?? 0} ${Number(data?.pagination?.total) > 1 ? 'Rules' : 'Rule'}`}
                searchFieldProps={{
                  placeholder: 'Search...',
                  value: query,
                  onChangeCallback: handleQueryChange
                }}
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
                  title="No Rules Found"
                  description="Create a new rule associated with this policy to get started."
                  containerProps={{paddingBottom: '40px'}}
                  actionTitle="Add Rule"
                  actionCallback={() => {
                    void navigate(PATHS.policies.edit, {replace: true});
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
