/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AgenticServiceType} from '@/components/shared/agentic-service-type';
import {StatusAgenticService} from '@/components/shared/status-agentic-service';
import DateHover from '@/components/ui/date-hover';
import {App} from '@/types/api/app';
import {MRT_ColumnDef} from 'material-react-table';

export const AgenticServiceColumns = (): MRT_ColumnDef<App, any>[] => {
  const columns: MRT_ColumnDef<App, any>[] = [
    {
      accessorKey: 'name',
      header: 'Name'
    },
    {
      accessorKey: 'type',
      header: 'Type',
      Cell: ({row}) => {
        return <AgenticServiceType type={row.original.type} />;
      }
    },
    {
      accessorKey: 'status',
      header: 'Badge Status',
      Cell: ({row}) => {
        return <StatusAgenticService status={row.original.status} />;
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      Cell: ({row}) => {
        return <DateHover date={row.original.createdAt} />;
      }
    }
  ];
  return columns;
};
