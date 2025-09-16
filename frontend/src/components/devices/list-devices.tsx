/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useAddDevice, useDeleteDevice, useTestDevice} from '@/mutations';
import {useGetDevices} from '@/queries';
import {EmptyState, Table, toast, Typography} from '@outshift/spark-design';
import React, {useCallback, useMemo, useState} from 'react';
import {ConfirmModal} from '../ui/confirm-modal';
import {useAnalytics} from '@/hooks';
import {Device} from '@/types/api/device';
import {PATHS} from '@/router/paths';
import {QRCodeModal} from '../ui/qr-code-modal';
import {Card} from '../ui/card';
import {Box, MenuItem} from '@mui/material';
import {BellIcon, PlusIcon, Trash2Icon} from 'lucide-react';
import {DevicesColumns} from './devices-columns';
import {FilterSections} from '../ui/filters-sections';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {useSearchParams} from 'react-router-dom';
import {DEFAULT_ROWS_PER_PAGE, ROWS_PER_PAGE_OPTION} from '@/constants/pagination';

export const ListDevices: React.FC = () => {
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
  const [openQrCodeModal, setQrCodeModal] = useState(false);
  const [tempDevice, setTempDevice] = useState<Device | undefined>();
  const [showActionsModal, setShowActionsModal] = useState<boolean>(false);

  const {data, error, isFetching, isRefetching, refetch} = useGetDevices({
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    query: query
  });

  const dataCount = useMemo(() => {
    return Number(data?.pagination?.total);
  }, [data?.pagination?.total]);

  const {analyticsTrack} = useAnalytics();

  const deleteMutation = useDeleteDevice({
    callbacks: {
      onSuccess: () => {
        setTempDevice(undefined);
        toast({
          title: 'Success',
          description: 'Device deleted successfully.',
          type: 'success'
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'An error occurred while deleting the device. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const addDeviceMutation = useAddDevice({
    callbacks: {
      onSuccess: (resp) => {
        setTempDevice(resp.data);
        toast({
          title: 'Onboarding Device',
          description: "Don't forget to scan the QR code with your device.",
          type: 'info'
        });
        handleChangeQrCodeModal(true);
      },
      onError: () => {
        setTempDevice(undefined);
        toast({
          title: 'Error adding device',
          description: 'An error occurred while adding the device. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const testDeviceMutation = useTestDevice({
    callbacks: {
      onSuccess: () => {
        toast({
          title: 'Device Test',
          description: 'Notification sent to the device successfully.',
          type: 'success'
        });
      },
      onError: () => {
        toast({
          title: 'Error Testing Device',
          description: 'An error occurred while testing the device. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const link = useMemo(() => {
    if (tempDevice) {
      const path = `${PATHS.onboardDevice.base}?id=${tempDevice.id}`;
      return `${window.location.origin}${path}`;
    }
    return undefined;
  }, [tempDevice]);

  const handleConfirmAction = useCallback(() => {
    if (tempDevice?.id) {
      analyticsTrack('CLICK_DELETE_DEVICE');
      deleteMutation.mutate(tempDevice.id);
    }
    setShowActionsModal(false);
  }, [analyticsTrack, deleteMutation, tempDevice]);

  const handleChangeQrCodeModal = useCallback((value: boolean) => {
    setQrCodeModal(value);
  }, []);

  const handleClickDone = useCallback(() => {
    setTempDevice(undefined);
    handleChangeQrCodeModal(false);
    void refetch();
  }, [handleChangeQrCodeModal, refetch]);

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

  const handleOnAddDevice = useCallback(() => {
    analyticsTrack('CLICK_ADD_DEVICE');
    addDeviceMutation.mutate({});
  }, [addDeviceMutation, analyticsTrack]);

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

  const handleOnTestDevice = useCallback(
    (id?: string) => {
      testDeviceMutation.mutate(id!);
    },
    [testDeviceMutation]
  );

  return (
    <>
      <ConditionalQueryRenderer
        itemName="Devices"
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
            columns={DevicesColumns()}
            data={data?.devices || []}
            isLoading={isFetching || deleteMutation.isPending}
            renderTopToolbar={() => (
              <FilterSections
                title={`${dataCount ?? 0} ${dataCount > 1 ? 'Devices' : 'Device'}`}
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
            renderRowActionMenuItems={({row}) => {
              return [
                <MenuItem
                  key="test-device"
                  onClick={() => {
                    analyticsTrack('CLICK_TEST_DEVICE');
                    handleOnTestDevice(row.original.id);
                  }}
                  sx={{display: 'flex', alignItems: 'center', gap: '8px'}}
                >
                  <BellIcon className="w-4 h-4" color="#062242" />
                  <Typography variant="body2" color="#1A1F27">
                    Test
                  </Typography>
                </MenuItem>,
                <MenuItem
                  key="delete-device"
                  onClick={() => {
                    analyticsTrack('CLICK_DELETE_DEVICE');
                    setTempDevice(row.original);
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
                  title="Add Device"
                  description="Register a new device to your account. This will allow you to manage and authenticate your devices securely."
                  containerProps={{paddingBottom: '40px'}}
                  actionTitle="Add Device"
                  actionCallback={() => {
                    handleOnAddDevice();
                  }}
                  actionButtonProps={{
                    sx: {fontWeight: '600 !important'},
                    startIcon: <PlusIcon className="w-4 h-4" />,
                    variant: 'outlined'
                  }}
                />
              </Box>
            )}
          />
        </Card>
        <ConfirmModal
          open={showActionsModal}
          title="Confirm Action"
          description="Are you sure you want to delete this device? This action cannot be undone."
          confirmButtonText="Delete Device"
          onCancel={() => {
            setShowActionsModal(false);
            setTempDevice(undefined);
          }}
          onConfirm={handleConfirmAction}
        />
      </ConditionalQueryRenderer>
      <QRCodeModal
        open={openQrCodeModal}
        title="Onboard Device"
        subtitle={<>Scan the QR code below with your device to register it to your account.</>}
        link={link}
        onClose={() => {
          handleClickDone();
        }}
      />
    </>
  );
};
