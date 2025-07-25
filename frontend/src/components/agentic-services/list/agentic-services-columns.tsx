/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AgenticServiceType} from '@/components/shared/agentic-services/agentic-service-type';
import {StatusAgenticService} from '@/components/shared/agentic-services/status-agentic-service';
import DateHover from '@/components/ui/date-hover';
import {App} from '@/types/api/app';
import {GeneralSize, Tag} from '@outshift/spark-design';
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
        return (
          <Tag size={GeneralSize.Small}>
            <AgenticServiceType type={row.original.type} />
          </Tag>
        );
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
      accessorKey: 'resolverMetadataId',
      header: 'Identity'
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
