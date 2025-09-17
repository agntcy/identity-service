/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {AgenticServiceType} from '@/components/shared/agentic-services/agentic-service-type';
import DateHover from '@/components/ui/date-hover';
import {useGetAgenticService} from '@/queries';
import {Policy, RuleAction} from '@/types/api/policy';
import {GeneralSize, Skeleton, Tag, Tags, TagStatus, Typography} from '@cisco-eti/spark-design';
import {BanIcon, CheckIcon} from 'lucide-react';
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
    <Tag size={GeneralSize.Small}>
      <div className="flex items-center gap-2">
        <AgenticServiceType type={data?.type} showLabel={false} />
        <Typography variant="body2">{data?.name ?? 'Not provided'}</Typography>
      </div>
    </Tag>
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
          const total = row.original.rules?.length || 0;
          const totalAllow = row.original.rules?.filter((rule) => rule.action === RuleAction.RULE_ACTION_ALLOW).length || 0;
          const totalDeny = row.original.rules?.filter((rule) => rule.action === RuleAction.RULE_ACTION_DENY).length || 0;
          return (
            <Tags
              size={GeneralSize.Small}
              items={[
                {
                  valueFormatter: () => (
                    <Typography variant="captionMedium">
                      Total: <b>{total}</b>
                    </Typography>
                  )
                },
                {
                  valueFormatter: () => (
                    <div className="flex items-center gap-1">
                      <CheckIcon className="w-4 h-4 text-[#00B285]" />
                      {totalAllow}
                    </div>
                  )
                },
                {
                  valueFormatter: () => (
                    <div className="flex items-center gap-1">
                      <BanIcon className="w-3 h-3 text-[#C0244C]" />
                      {totalDeny}
                    </div>
                  )
                }
              ]}
              shouldTruncate
              maxTooltipTags={3}
              showOnlyFirst={false}
            />
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
