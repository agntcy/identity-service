/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import DateHover from '@/components/ui/date-hover';
import {Device} from '@/types/api/device';
import {MRT_ColumnDef} from 'material-react-table';

export const DevicesColumns = (): MRT_ColumnDef<Device, any>[] => {
  const columns: MRT_ColumnDef<Device, any>[] = [
    {
      accessorKey: 'name',
      header: 'Name'
    },
    {
      accessorKey: 'userId',
      header: 'User ID'
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      Cell: ({row}) => {
        return <DateHover date={row.original.createdAt || 'Not provided'} />;
      }
    }
  ];
  return columns;
};
