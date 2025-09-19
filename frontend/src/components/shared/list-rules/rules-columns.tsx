/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import DateHover from '@/components/ui/date-hover';
import {labels} from '@/constants/labels';
import {Rule} from '@/types/api/policy';
import {GeneralSize, Tag, Tags, TagStatus} from '@open-ui-kit/core';
import {MRT_ColumnDef} from 'material-react-table';
import {useMemo} from 'react';
import {TagActionTask} from '../policies/tag-action-task';

export const RulesColumns = (): MRT_ColumnDef<Rule, any>[] => {
  const columns: MRT_ColumnDef<Rule, any>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name'
      },
      {
        accessorKey: 'tasks',
        header: 'Tasks',
        Cell: ({row}) => {
          if (!row.original.tasks || row.original.tasks.length === 0) {
            return (
              <Tag status={TagStatus.Info} size={GeneralSize.Small}>
                No Tasks
              </Tag>
            );
          }
          return (
            <Tags
              size={GeneralSize.Small}
              items={row.original.tasks.map((task) => ({
                valueFormatter: () => task.name || 'Unknown Task'
              }))}
              showOnlyFirst
              shouldTruncate
            />
          );
        }
      },
      {
        accessorKey: 'action',
        header: 'Action',
        Cell: ({row}) => {
          return (
            <TagActionTask
              action={row.original.action}
              text={row.original.action ? labels.rulesActions[row.original.action] : 'Unknown Action'}
              size={GeneralSize.Small}
            />
          );
        }
      },
      {
        accessorKey: 'needsApproval',
        header: 'Needs Approval?',
        Cell: ({row}) => {
          return (
            <Tag status={row.original.needsApproval ? TagStatus.Positive : TagStatus.Negative} size={GeneralSize.Small}>
              {row.original.needsApproval ? 'Yes' : 'No'}
            </Tag>
          );
        }
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
