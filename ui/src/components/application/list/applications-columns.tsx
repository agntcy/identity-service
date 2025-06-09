import {ColumnDef, Row} from '@tanstack/react-table';
import {generatePath, Link} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {DropMenuActions} from './drop-menu-actions';

const IdentityCell = ({row}: {row: Row<any>}) => {
  // const {data, isLoading} = useAuthorizationContext(row.original.authorizationContextId);
  // if (isLoading) {
  //   return <Skeleton className="h-5 w-full" />;
  // }
  // if (!data) {
  //   return <p className="italic">Emtpy indentity info...</p>;
  // }
  // return (
  //   <div className="space-y-2">
  //     <p className="text-[14px]">
  //       <strong>Issuer</strong>: {data?.authorizationParameters?.[0].issuer}
  //     </p>
  //     <p className="text-[14px]">
  //       <strong>Audience</strong>: {data?.authorizationParameters?.[0].aud}
  //     </p>
  //   </div>
  // );
};

export const ConfigurationsColumns = ({handleOnDelete}: {handleOnDelete?: (application?: any) => void}): ColumnDef<any>[] => {
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({row}) => {
        return (
          <Link className="inline-link" to={generatePath(PATHS.applications, {id: row.original?.id})}>
            {row.original.id}
          </Link>
        );
      },
      enableSorting: false,
      enableHiding: false
    },
    // {
    //   id: 'identity',
    //   header: 'Identity',
    //   cell: IdentityCell,
    //   enableSorting: false
    // },
    {
      id: 'actions',
      size: 1,
      cell: ({row}) => {
        return <DropMenuActions application={row.original} handleOnDelete={handleOnDelete} />;
      },
      enableSorting: false,
      enableHiding: false
    }
  ];
  return columns;
};
