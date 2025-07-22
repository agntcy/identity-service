/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AgenticServiceType} from '@/components/shared/agentic-services/agentic-service-type';
import DateHover from '@/components/ui/date-hover';
import {useGetAgenticService} from '@/queries';
import {Policy} from '@/types/api/policy';
import {GeneralSize, Skeleton, Tag, TagStatus, Typography} from '@outshift/spark-design';
import {MRT_ColumnDef} from 'material-react-table';
import {useMemo} from 'react';

const CellAgenticService = ({row}: {row: {original: Policy}}) => {
  const {data, isError, isLoading} = useGetAgenticService(row.original.assignedTo);

  if (isLoading) {
    return <Skeleton sx={{width: '100px', height: '20px'}} />;
  }

  if (isError) {
    return (
      <Tag status={TagStatus.Negative} size={GeneralSize.Small}>
        Error loading agentic service
      </Tag>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <AgenticServiceType type={data?.type} showLabel={false} />
      <Typography variant="body2">{data?.name ?? 'Not provided'}</Typography>
    </div>
  );
};

export const PoliciesColumns = (): MRT_ColumnDef<Policy, any>[] => {
  const columns: MRT_ColumnDef<Policy, any>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name'
      },
      {
        accessorKey: 'rules',
        header: 'Rules',
        Cell: ({row}) => {
          if (!row.original.rules || row.original.rules.length === 0) {
            return (
              <Tag status={TagStatus.Info} size={GeneralSize.Small}>
                No Rules
              </Tag>
            );
          }
          return (
            <Tag status={TagStatus.Info} size={GeneralSize.Small}>
              {row.original.rules.length} Rule{row.original.rules.length > 1 ? 's' : ''}
            </Tag>
          );
        }
      },
      {
        accessorKey: 'assignedTo',
        header: 'Assigned To',
        Cell: CellAgenticService
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated At',
        Cell: ({row}) => {
          return <DateHover date={row.original.updatedAt || 'Not provided'} />;
        }
      },
      {
        accessorKey: 'createdAt',
        header: 'Created At',
        Cell: ({row}) => {
          return <DateHover date={row.original.createdAt || 'Not provided'} />;
        }
      }
    ],
    []
  );
  return columns;
};
