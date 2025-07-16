/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useState} from 'react';
import {ConditionalQueryRenderer} from '../../ui/conditional-query-renderer';
import {Box, EmptyState, MenuItem, Table, Typography} from '@outshift/spark-design';
import {useGetPolicyRules} from '@/queries';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {Card} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import {FilterSections} from '@/components/shared/filters-sections';
import {PencilIcon, PlusIcon, Trash2Icon} from 'lucide-react';
import {RulesColumns} from './rules-columns';
import {OpsRule} from '../ops-rules/ops-rule';
import {Policy, Rule} from '@/types/api/policy';
import {useAnalytics} from '@/hooks';

export const ListRules = ({policy, showRulesOps = false}: {policy?: Policy; showRulesOps?: boolean}) => {
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
  const [tempRule, setTempRule] = useState<Rule | undefined>(undefined);
  const [isDelete, setIsDelete] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [isAdd, setIsAdd] = useState<boolean>(false);

  const {data, isLoading, error, refetch} = useGetPolicyRules({
    policyId: policy?.id,
    query: {
      page: pagination.pageIndex + 1,
      size: pagination.pageSize,
      query: query
    }
  });

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      setPagination((prev) => ({...prev, pageIndex: 0}));
    },
    [setQuery, setPagination]
  );

  const {analyticsTrack} = useAnalytics();

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
            renderRowActionMenuItems={({row}) => {
              if (!showRulesOps) {
                return [];
              }
              return [
                <MenuItem
                  key="edit-rule"
                  sx={{display: 'flex', alignItems: 'center', gap: '8px'}}
                  onClick={() => {
                    analyticsTrack('CLICK_EDIT_RULE_POLICY');
                    setTempRule(row.original);
                    setIsEdit(true);
                  }}
                >
                  <PencilIcon className="w-4 h-4" color="#062242" />
                  <Typography variant="body2" color="#1A1F27">
                    Edit
                  </Typography>
                </MenuItem>,
                <MenuItem
                  key="delete-rule"
                  onClick={() => {
                    analyticsTrack('CLICK_DELETE_RULE_POLICY');
                    setTempRule(row.original);
                    setIsDelete(true);
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
            renderEmptyRowsFallback={() => (
              <Box
                sx={(theme) => ({
                  backgroundColor: theme.palette.vars.controlBackgroundDefault
                })}
              >
                {showRulesOps ? (
                  <EmptyState
                    title="No Rules Found"
                    description="Create a new rule associated with this policy to get started."
                    containerProps={{paddingBottom: '40px'}}
                    actionTitle="Add Rule"
                    actionCallback={() => {
                      analyticsTrack('CLICK_ADD_RULE_POLICY');
                      setTempRule(undefined);
                      setIsAdd(true);
                    }}
                    actionButtonProps={{
                      sx: {fontWeight: '600 !important'},
                      startIcon: <PlusIcon className="w-4 h-4" />
                    }}
                  />
                ) : (
                  <EmptyState
                    title="No Rules Found"
                    description="There are no rules associated with this policy."
                    containerProps={{paddingBottom: '40px'}}
                  />
                )}
              </Box>
            )}
          />
        </Card>
        {showRulesOps && (
          <OpsRule
            policy={policy}
            rule={tempRule}
            isDelete={isDelete}
            isEdit={isEdit}
            isAdd={isAdd}
            onClose={() => {
              setTempRule(undefined);
              setIsDelete(false);
              setIsEdit(false);
              setIsAdd(false);
            }}
          />
        )}
      </ConditionalQueryRenderer>
    </>
  );
};
