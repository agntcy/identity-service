/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {UserResponse} from '@/types/api/iam';
import {GeneralSize, Tag} from '@outshift/spark-design';
import {MRT_ColumnDef} from 'material-react-table';

export const UsersColumns = (): MRT_ColumnDef<UserResponse, any>[] => {
  const columns: MRT_ColumnDef<UserResponse, any>[] = [
    {
      accessorKey: 'name',
      header: 'Name'
    },
    {
      accessorKey: 'role',
      header: 'Role',
      Cell: ({row}) => {
        return <Tag size={GeneralSize.Small}>{row.original.role}</Tag>;
      }
    }
  ];
  return columns;
};
