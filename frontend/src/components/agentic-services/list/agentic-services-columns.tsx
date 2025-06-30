/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AgenticServiceType} from '@/components/shared/agentic-service-type';
import {App} from '@/types/api/app';
import {MRT_ColumnDef} from 'material-react-table';

export const AgenticServiceColumns = (): MRT_ColumnDef<App, any>[] => {
  const columns: MRT_ColumnDef<App, any>[] = [
    {
      accessorKey: 'name',
      header: 'Name'
    },
    {
      accessorKey: 'description',
      header: 'Description'
    },
    {
      accessorKey: 'type',
      header: 'Type',
      Cell: ({row}) => {
        return <AgenticServiceType type={row.original.type} />;
      }
    }
  ];
  return columns;
};
