/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Policy} from '@/types/api/policy';
import {MRT_ColumnDef} from 'material-react-table';

export const PoliciesColumns = (): MRT_ColumnDef<Policy, any>[] => {
  const columns: MRT_ColumnDef<Policy, any>[] = [
    {
      accessorKey: 'name',
      header: 'Name'
    },
    {
      accessorKey: 'assignedTo',
      header: 'Assigned To'
    }
  ];
  return columns;
};
