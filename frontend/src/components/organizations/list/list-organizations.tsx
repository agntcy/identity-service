/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useState} from 'react';
import {ConditionalQueryRenderer} from '../../ui/conditional-query-renderer';
import {MenuItem, Table} from '@outshift/spark-design';
import {useGetTenants} from '@/queries';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {OrganizationsColumns} from './organizations-columns';
import {Card} from '@/components/ui/card';
import {Typography} from '@mui/material';
import {Trash2Icon, UserRoundPlusIcon} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useAuth} from '@/hooks';
import {generatePath, useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';

export const ListOrganizations = () => {
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });
  const [sorting, setSorting] = useState<MRT_SortingState>([]);

  const {data, isLoading, isFetching, refetch, error} = useGetTenants();
  const {authInfo} = useAuth();

  const navigate = useNavigate();

  return (
    <>
      <Card className={cn('bg-[#F5F8FD]', isFetching || isLoading ? 'p-[24px]' : 'p-0')}>
        <ConditionalQueryRenderer
          itemName="organizations"
          data={data?.tenants}
          error={error}
          isLoading={isLoading || isFetching}
          useRelativeLoader
          errorListStateProps={{
            actionCallback: () => {
              void refetch();
            },
            actionTitle: 'Retry'
          }}
        >
          <Table
            columns={OrganizationsColumns()}
            data={data?.tenants || []}
            isLoading={isLoading || isFetching}
            densityCompact
            muiTableBodyRowProps={({row}) => ({
              sx: {cursor: 'pointer', '& .MuiIconButton-root': {color: (theme) => theme.palette.vars.interactiveSecondaryDefaultDefault}},
              onClick: () => {
                const path = generatePath(PATHS.settingsOrganizationInfo, {id: row.original?.id});
                void navigate(path, {replace: true});
              }
            })}
            enableRowActions
            topToolbarProps={{
              enableActions: false
            }}
            muiTableContainerProps={{
              style: {
                border: '1px solid #D5DFF7'
              }
            }}
            onPaginationChange={setPagination}
            rowCount={data?.tenants.length ?? 0}
            rowsPerPageOptions={[1, 10, 25, 50, 100]}
            title={{label: 'organizations', count: data?.tenants?.length || 0}}
            state={{pagination, sorting}}
            onSortingChange={setSorting}
            renderRowActionMenuItems={({row}) => {
              if (authInfo?.user?.tenant?.id !== row.original.id) {
                return [];
              }
              return [
                <MenuItem key="edit" onClick={() => console.info('Edit', row)} sx={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <UserRoundPlusIcon className="w-4 h-4" color="#062242" />
                  <Typography variant="body2" color="#1A1F27">
                    Add user
                  </Typography>
                </MenuItem>,
                <MenuItem key="delete" onClick={() => console.info('Delete', row)} sx={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <Trash2Icon className="w-4 h-4" color="#C62953" />
                  <Typography variant="body2" color="#C0244C">
                    Delete organization
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
        </ConditionalQueryRenderer>
      </Card>
    </>
  );
};
