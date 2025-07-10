/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AgenticServiceType} from '@/components/shared/agentic-service-type';
import {useGetAgenticService} from '@/queries';
import {PATHS} from '@/router/paths';
import {Task} from '@/types/api/policy';
import {Skeleton, Typography} from '@mui/material';
import {GeneralSize, Link, Tag, TagStatus} from '@outshift/spark-design';
import {MRT_ColumnDef} from 'material-react-table';
import {generatePath} from 'react-router-dom';

const CellAgenticService = ({row}: {row: {original: Task}}) => {
  const {data, isError, isLoading} = useGetAgenticService(row.original.appId);

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
    <Link href={generatePath(PATHS.agenticServices.info, {id: row.original.appId || ''})}>
      <div className="flex items-center gap-2">
        <AgenticServiceType type={data?.type} className="h-[20px] w-[20px]" showLabel={false} />
        <Typography variant="body2">{data?.name ?? 'Not provided'}</Typography>
      </div>
    </Link>
  );
};

export const TasksColumns = (): MRT_ColumnDef<Task, any>[] => {
  const columns: MRT_ColumnDef<Task, any>[] = [
    {
      accessorKey: 'name',
      header: 'Name'
    },
    {
      accessorKey: 'appId',
      header: 'Agentic Service',
      Cell: CellAgenticService
    }
  ];
  return columns;
};
