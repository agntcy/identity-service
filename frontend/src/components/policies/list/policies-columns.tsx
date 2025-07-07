/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AgenticServiceType} from '@/components/shared/agentic-service-type';
import DateHover from '@/components/ui/date-hover';
import {labels} from '@/constants/labels';
import {useGetAgenticService} from '@/queries';
import {Policy} from '@/types/api/policy';
import {GeneralSize, Skeleton, Tag, TagBackgroundColorVariants, Tags, Typography} from '@outshift/spark-design';
import {MRT_ColumnDef} from 'material-react-table';
import {useMemo} from 'react';

const CellAgenticService = ({row}: {row: {original: Policy}}) => {
  const {data, isError, isLoading} = useGetAgenticService(row.original.assignedTo);

  if (isLoading) {
    return <Skeleton sx={{width: '100px', height: '20px'}} />;
  }

  if (isError) {
    return (
      <Tag color={TagBackgroundColorVariants.AccentIWeak} size={GeneralSize.Small}>
        Error loading agentic service
      </Tag>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <AgenticServiceType type={data?.type} className="h-[20px] w-[20px]" showLabel={false} />
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
        header: 'Actions',
        Cell: ({row}) => {
          if (!row.original.rules || row.original.rules.length === 0) {
            return (
              <Tag color={TagBackgroundColorVariants.AccentIWeak} size={GeneralSize.Small}>
                No Actions
              </Tag>
            );
          }
          return (
            <Tags
              size={GeneralSize.Small}
              items={row.original.rules.map((rule) => ({
                valueFormatter: () =>
                  rule.action && labels.rulesActions[rule.action as keyof typeof labels.rulesActions]
                    ? labels.rulesActions[rule.action as keyof typeof labels.rulesActions]
                    : 'Unknown Action',
                value: rule.action
              }))}
              showOnlyFirst={false}
              shouldTruncate
              maxTooltipTags={3}
            />
          );
        }
      },
      {
        accessorKey: 'assignedTo',
        header: 'Assigned To',
        Cell: CellAgenticService
      }
    ],
    []
  );
  return columns;
};
