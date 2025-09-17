/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {useAuth} from '@/hooks';
import {TenantReponse} from '@/types/api/iam';
import {OverflowTooltip, Tag} from '@cisco-eti/spark-design';
import {MRT_ColumnDef} from 'material-react-table';

export const OrganizationsColumns = (): MRT_ColumnDef<TenantReponse, any>[] => {
  const {authInfo} = useAuth();
  const columns: MRT_ColumnDef<TenantReponse, any>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      Cell: ({row}) => {
        return (
          <div className="flex items-center gap-2 max-w-[400px]">
            <OverflowTooltip value={row.original.name} someLongText={row.original.name} />
            {authInfo?.user?.tenant?.id === row.original.id && (
              <Tag size="small" style={{background: '#FAECFF'}}>
                Current
              </Tag>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'id',
      header: 'ID',
      Cell: ({row}) => {
        return <OverflowTooltip value={row.original.id} someLongText={row.original.id} />;
      }
    }
  ];
  return columns;
};
