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

export const ListOrganizations = () => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 15
  });
  const [sorting, setSorting] = useState<MRT_SortingState>([]);

  const {data, isLoading, isFetching, refetch, error} = useGetTenants();
  const {authInfo} = useAuth();

  // const deleteAirMutation = useDeleteAir({
  //   callbacks: {
  //     onSuccess: () => {
  //       toast.success('AIR Engine Configuration deleted.');
  //       setTempAirConfig(undefined);
  //     },
  //     onError: () => {
  //       toast.error('Failed to delete AIR Engine configuration.');
  //       setTempAirConfig(undefined);
  //     }
  //   }
  // });

  // const deleteCatalogMutation = useDeleteCatalog({});

  // const handleRefresh = useCallback(() => {
  //   void refetch();
  //   toast.success('AIR Engine Configurations refreshed.');
  // }, [refetch]);

  // const onSearch = useCallback((keyword?: string) => {
  //   setSearchKeyword(keyword);
  // }, []);

  // const filteredData = useMemo(() => {
  //   return data?.airs?.filter((f) => f.id?.toLowerCase().includes(searchKeyword?.toLowerCase() || ''));
  // }, [data?.airs, searchKeyword]);

  // const handleOnConfirmDelete = useCallback(() => {
  //   if (tempAirConfig?.id) {
  //     setConfirmOpen(false);
  //     deleteAirMutation.mutate({id: tempAirConfig.id});
  //     if (tempAirConfig?.catalogId) {
  //       deleteCatalogMutation.mutate({id: tempAirConfig.catalogId});
  //     }
  //   }
  // }, [deleteAirMutation, deleteCatalogMutation, tempAirConfig?.catalogId, tempAirConfig?.id]);

  // const handleOnDelete = useCallback((air?: Air) => {
  //   if (air) {
  //     setTempAirConfig(air);
  //     setConfirmOpen(true);
  //   }
  // }, []);

  return (
    <>
      <Card className={cn('bg-[#F5F8FD]', isFetching || isLoading ? 'p-4' : 'p-0')}>
        <ConditionalQueryRenderer
          itemName="organizations"
          data={data?.tenants}
          error={error}
          isLoading={isLoading || isFetching}
          useRelativeLoader
          emptyListStateProps={{
            actionCallback: () => {
              // setApiKeyMutation.mutate();
            },
            actionTitle: 'New organization'
          }}
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
            densityCompact
            state={{pagination, sorting}}
            manualPagination
            onSortingChange={setSorting}
            onPaginationChange={setPagination}
            title={{label: 'organizations', count: data?.tenants?.length || 0}}
            enableRowActions
            enableColumnPinning={false}
            isLoading={isLoading || isFetching}
            topToolbarProps={{
              enableArrangeColumns: false,
              enableActions: false
            }}
            muiTableContainerProps={{
              style: {
                border: '1px solid #D5DFF7'
              }
            }}
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
          />
          {/* <Card className="flex justify-between items-center w-full">
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <Typography variant="body2" fontWeight={600}>
              API Key:
            </Typography>
            <Typography variant="body2">
              {data?.apiKey?.apiKey ? `${'*'.repeat(55)}${data.apiKey.apiKey.slice(-3)}` : 'No API Key available'}
            </Typography>
          </div>
          <CopyButton
            text={data?.apiKey?.apiKey || ''}
            onCopy={() => {
              toast({
                title: 'API Key copied to clipboard',
                description: 'You can now use this API Key in your applications.',
                type: 'success'
              });
            }}
          />
        </div>

        <Tooltip title="Refresh API Key" placement="top">
          <Button
            onClick={() => handleChangeActionsModal(true)}
            variant="primary"
            color="negative"
            startIcon={<RefreshCcwIcon className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </Tooltip>
      </Card>
      <ConfirmModal
        open={openActionsModal}
        title="Confirm Action"
        description="Are you sure you want to refresh your API Key? This action will invalidate your current API Key and generate a new one. Please ensure that you update your applications accordingly."
        confirmButtonText="Refresh API Key"
        onCancel={() => handleChangeActionsModal(false)}
        onConfirm={handleConfirmAction}
      /> */}
        </ConditionalQueryRenderer>
        {/* <CardContent>
          <ConditionalQueryRenderer
            data={undefined}
            isLoading={true}
            error={''}
            itemName="AIR Configurations"
            customLoader={<CustomLoaderTable />}
            // customEmpty={<Empty />}
            classNameContainer="p-0 my-8"
          >
            <DataTable
              showToolbar
              filterBarProps={{
                count: filteredData?.length || 0,
                placeholder: 'Search configurations...',
                onRefreshClick: handleRefresh,
                onChangeSearch: onSearch
              }}
              columns={ConfigurationsColumns({handleOnDelete})}
              data={filteredData ?? []}
              usePagination
              rowCount={filteredData?.length || 0}
            />
          </ConditionalQueryRenderer>
        </CardContent> */}
      </Card>
      {/* {tempAirConfig &&
        createPortal(
          <ConfirmDialog
            title="Are you sure you want to delete AIR configuration?"
            description={`Deleting a AIR configuration is irreversible. (${tempAirConfig.id})`}
            open={confirmOpen}
            onCancel={() => {
              setTempAirConfig(undefined);
              setConfirmOpen(false);
            }}
            onConfirm={() => {
              handleOnConfirmDelete();
            }}
          />,
          document.body
        )} */}
    </>
  );
};
