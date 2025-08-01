/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useMemo, useState} from 'react';
import {ConditionalQueryRenderer} from '../../ui/conditional-query-renderer';
import {Box, EmptyState, MenuItem, Table, toast, Typography} from '@outshift/spark-design';
import {useGetPolicies} from '@/queries';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {PoliciesColumns} from './policies-columns';
import {Card} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import {generatePath, useNavigate, useSearchParams} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {FilterSections} from '@/components/ui/filters-sections';
import {PencilIcon, PlusIcon, Trash2Icon} from 'lucide-react';
import {ConfirmModal} from '@/components/ui/confirm-modal';
import {Policy} from '@/types/api/policy';
import {useDeletePolicy} from '@/mutations';
import {ListRules} from '@/components/shared/list-rules/list-rules';
import {useAnalytics} from '@/hooks';

export const ListPolicies = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: Number(searchParams.get('page')) || 0,
    pageSize: Number(searchParams.get('size')) || 15
  });
  const [sorting, setSorting] = useState<MRT_SortingState>([
    {
      id: 'createdAt',
      desc: true
    }
  ]);
  const [query, setQuery] = useState<string | undefined>(searchParams.get('query') || undefined);
  const [tempPolicy, setTempPolicy] = useState<Policy | undefined>(undefined);
  const [showActionsModal, setShowActionsModal] = useState<boolean>(false);

  const {data, isLoading, error, refetch} = useGetPolicies({
    query: {
      page: pagination.pageIndex + 1,
      size: pagination.pageSize,
      query: query
    }
  });

  const {analyticsTrack} = useAnalytics();

  const dataPolicies = useMemo(() => {
    return (
      data?.policies?.map((policy) => ({
        ...policy,
        subRows: <ListRules policy={policy} showRulesOps={true} />
      })) || []
    );
  }, [data]);

  const navigate = useNavigate();

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      const newSearchParams = new URLSearchParams(searchParams);
      if (value) {
        newSearchParams.set('query', value);
      } else {
        newSearchParams.delete('query');
      }
      setSearchParams(newSearchParams);
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

  const deleteMutation = useDeletePolicy({
    callbacks: {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Policy deleted successfully.',
          type: 'success'
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'An error occurred while deleting the policy. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const handleClickOnDelete = useCallback(() => {
    analyticsTrack('CLICK_CONFIRM_DELETE_POLICY');
    setShowActionsModal(false);
    setTempPolicy(undefined);
    deleteMutation.mutate(tempPolicy?.id || '');
  }, [analyticsTrack, deleteMutation, tempPolicy?.id]);

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
            isLoading={isLoading || deleteMutation.isPending}
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
                analyticsTrack('CLICK_NAVIGATION_POLICY_INFO');
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
            onPaginationChange={handlePaginationChange}
            rowCount={Number(data?.pagination?.total) || 0}
            rowsPerPageOptions={[1, 15, 25, 50, 100]}
            state={{pagination, sorting}}
            onSortingChange={setSorting}
            renderRowActionMenuItems={({row}) => {
              return [
                <MenuItem
                  key="edit-policy"
                  sx={{display: 'flex', alignItems: 'center', gap: '8px'}}
                  onClick={() => {
                    analyticsTrack('CLICK_NAVIGATION_EDIT_POLICY');
                    const path = generatePath(PATHS.policies.edit, {id: row.original?.id});
                    void navigate(path);
                  }}
                >
                  <PencilIcon className="w-4 h-4" color="#062242" />
                  <Typography variant="body2" color="#1A1F27">
                    Edit
                  </Typography>
                </MenuItem>,
                <MenuItem
                  key="delete-policy"
                  onClick={() => {
                    analyticsTrack('CLICK_DELETE_POLICY');
                    setTempPolicy(row.original);
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
                  title="No policies found"
                  description="No policies are currently in place. Click 'Add Policy' to create and apply one to your registered agentic services."
                  containerProps={{paddingBottom: '40px'}}
                  actionTitle="Add Policy"
                  actionCallback={() => {
                    analyticsTrack('CLICK_NAVIGATION_ADD_POLICY');
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
      <ConfirmModal
        open={showActionsModal}
        title="Delete Policy"
        description={
          <>
            Are you sure you want to delete this policy? This action cannot be undone.
            <br />
            <br />
            <strong>Note:</strong> Deleting a policy will remove it from all associated agentic services.
          </>
        }
        confirmButtonText="Delete"
        onCancel={() => {
          setShowActionsModal(false);
          setTempPolicy(undefined);
        }}
        onConfirm={handleClickOnDelete}
        buttonConfirmProps={{
          color: 'negative'
        }}
      />
    </>
  );
};
