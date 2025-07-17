/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  ColumnDef,
  getCoreRowModel,
  flexRender,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  TableOptions,
  getPaginationRowModel,
  ExpandedState,
  getExpandedRowModel,
  Cell,
  Row
} from '@tanstack/react-table';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from './table';
import {DEFAULT_ROWS_PER_PAGE} from '@/constants/pagination';
import {cn} from '@/lib/utils';
import {Card} from './card';
import {forwardRef, ReactNode, useImperativeHandle, useRef, useState} from 'react';
import {DataTableToolbar, DataTableToolbarProps} from './data-table-toolbar';
import ScrollShadowWrapper from './scroll-shadow-wrapper';
import {DataTablePagination} from './data-table-pagination';
import DataTableColumnHeader from './data-table-column-header';

interface DataTableProps<TData, TValue> extends Omit<TableOptions<TData>, 'getCoreRowModel'> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  usePagination?: boolean;
  showHeader?: boolean;
  showToolbar?: boolean;
  propsToolbar?: {
    showViewOptions?: boolean;
  };
  classNameTableColumn?: string;
  isLoading?: boolean;
  containerClass?: string;
  cardClassName?: string;
  showRowsPerPage?: boolean;
  onRowClick?: (value: TData) => void;
  filterBarProps?: Partial<DataTableToolbarProps<TData>>;
}

export interface DataTableRef {
  scrollToTop: () => void;
}

export const DataTable = forwardRef<DataTableRef, DataTableProps<any, any>>(
  (
    {
      columns,
      data,
      usePagination = true,
      showHeader = true,
      showToolbar = false,
      showRowsPerPage = true,
      containerClass,
      classNameTableColumn,
      onRowClick,
      cardClassName,
      filterBarProps,
      ...props
    },
    ref
  ) => {
    const topRef = useRef<null | HTMLAnchorElement>(null);
    const [expanded, setExpanded] = useState<ExpandedState>({});

    const table = useReactTable({
      data,
      columns,
      getPaginationRowModel: getPaginationRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
      onExpandedChange: setExpanded,
      getFilteredRowModel: getFilteredRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
      getRowCanExpand: (row) => {
        return !!row.original.subComponent;
      },
      state: {
        expanded
      },
      initialState: {
        pagination: {
          pageSize: DEFAULT_ROWS_PER_PAGE
        }
      },
      ...props,
      getCoreRowModel: getCoreRowModel()
    });

    const scrollToTop = () => {
      topRef.current?.scrollIntoView({behavior: 'smooth'});
    };

    useImperativeHandle(ref, () => ({
      scrollToTop
    }));

    return (
      <div className={cn('space-y-4 w-full', containerClass)}>
        {showToolbar && <DataTableToolbar {...filterBarProps} table={table} />}
        <Card className={cn('!shadow-none rounded-sm', cardClassName)}>
          <a ref={topRef} />
          <ScrollShadowWrapper withBorder={false}>
            <Table>
              {showHeader && (
                <TableHeader className="bg-secondary">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead
                            key={header.id}
                            colSpan={header.colSpan}
                            className={cn('whitespace-nowrap', classNameTableColumn)}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(<DataTableColumnHeader column={header.column} />, header.getContext())}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
              )}
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table
                    .getRowModel()
                    .rows.map((row) => (
                      <TableRowWrapper
                        table={table}
                        key={row.id}
                        row={row}
                        onRowClick={onRowClick}
                        className={classNameTableColumn}
                      />
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollShadowWrapper>
        </Card>
        {usePagination && <DataTablePagination table={table} showRowsPerPage={showRowsPerPage} />}
      </div>
    );
  }
);

const TableRowWrapper = <TData extends Row<TData>>({
  table,
  row,
  className,
  onRowClick
}: {
  table: any;
  row: Row<TData>;
  className?: string;
  onRowClick?: (value: TData) => void;
}) => {
  const subComponentWrapper = (subComponent: ReactNode) => (
    <div>
      <span className="" />
      <div>
        <div className="">{subComponent}</div>
      </div>
    </div>
  );

  return (
    <>
      <TableRow
        key={row.id}
        data-state={row.getIsSelected() && 'selected'}
        className="group"
        onClick={() => onRowClick?.(row.original)}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCellWrapper cell={cell} className={className} key={cell.column.id} />
        ))}
      </TableRow>
      {row.getIsExpanded() && (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length}>
            {subComponentWrapper((row.original as {subComponent?: ReactNode}).subComponent)}
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const TableCellWrapper = <TData, TValue>({cell, className}: {cell: Cell<TData, TValue>; className?: string}) => {
  return (
    <TableCell
      style={{width: cell.column.getSize()}}
      className={cn('whitespace-nowrap', className, (cell.column.columnDef.meta as any)?.className as string)}
      align={(cell.column.columnDef.meta as any)?.align}
      onClick={cell.row.getToggleExpandedHandler()}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  );
};

DataTable.displayName = 'DataTable';
