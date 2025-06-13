/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useMemo, useState} from 'react';
import {ConditionalQueryRenderer} from '../../ui/conditional-query-renderer';
import {Card, CardContent, CardHeader, CardTitle} from '../../ui/card';
import {toast} from 'sonner';
import CustomLoaderTable from '../../ui/custom-loader-table';
import {createPortal} from 'react-dom';
import {DataTable} from '../../ui/data-table';

export const ListConfigurations = () => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  // const [tempAirConfig, setTempAirConfig] = useState<Air | undefined>(undefined);
  const [searchKeyword, setSearchKeyword] = useState<string>();

  // const {data, isLoading, refetch, error} = useAirs();

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
      <Card className="p-0">
        <CardHeader className="pb-0">
          <CardTitle>AIR Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          <ConditionalQueryRenderer
            data={undefined}
            isLoading={true}
            error={''}
            itemName="AIR Configurations"
            customLoader={<CustomLoaderTable />}
            // customEmpty={<Empty />}
            classNameContainer="p-0 my-8"
          >
            {/* <DataTable
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
            /> */}
          </ConditionalQueryRenderer>
        </CardContent>
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
