/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useState} from 'react';
import {ConditionalQueryRenderer} from '../../ui/conditional-query-renderer';
import {EmptyState, MenuItem, Table, toast, Typography} from '@outshift/spark-design';
import {useGetPolicies} from '@/queries';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {PoliciesColumns} from './policies-columns';
import {Card} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import {generatePath, useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {FilterSections} from '@/components/shared/filters-sections';
import {PlusIcon, RefreshCcwIcon, Trash2Icon} from 'lucide-react';
import {ConfirmModal} from '@/components/ui/confirm-modal';
import {Policy} from '@/types/api/policy';
import {useDeletePolicy} from '@/mutations';

export const ListPolicies = () => {
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });
  const [sorting, setSorting] = useState<MRT_SortingState>([
    {
      id: 'createdAt',
      desc: true
    }
  ]);
  const [query, setQuery] = useState<string | undefined>(undefined);
  const [tempPolicy, setTempPolicy] = useState<Policy | undefined>(undefined);
  const [showActionsModal, setShowActionsModal] = useState<boolean>(false);

  const {data, isLoading, error, refetch} = useGetPolicies({
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
    setShowActionsModal(false);
    setTempPolicy(undefined);
    deleteMutation.mutate(tempPolicy?.id || '');
  }, [deleteMutation, tempPolicy]);

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
          },
          actionTitle: 'Retry'
        }}
        useContainer
        useLoading={false}
      >
        <Card className={cn(!isLoading && 'p-0')} variant="secondary">
          <Table
            columns={PoliciesColumns()}
            data={data?.policies || []}
            isLoading={isLoading || deleteMutation.isPending}
            densityCompact
            muiTableBodyRowProps={({row}) => ({
              sx: {cursor: 'pointer', '& .MuiIconButton-root': {color: (theme) => theme.palette.vars.interactiveSecondaryDefaultDefault}},
              onClick: () => {
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
                  key="edit-policy"
                  sx={{display: 'flex', alignItems: 'center', gap: '8px'}}
                  onClick={() => {
                    const path = generatePath(PATHS.policies.update, {id: row.original?.id});
                    void navigate(path, {replace: true});
                  }}
                >
                  <RefreshCcwIcon className="w-4 h-4" color="#062242" />
                  <Typography variant="body2" color="#1A1F27">
                    Update
                  </Typography>
                </MenuItem>,
                <MenuItem
                  key="delete-policy"
                  onClick={() => {
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
            )}
          />
        </Card>
      </ConditionalQueryRenderer>
      <ConfirmModal
        open={showActionsModal}
        title="Delete Policy"
        description={
          <>
            Are you sure you want to delete the policy <strong>{tempPolicy?.name}</strong>? This action cannot be undone.
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
