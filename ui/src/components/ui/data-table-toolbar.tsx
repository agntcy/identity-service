import {Cross2Icon} from '@radix-ui/react-icons';
import {Table} from '@tanstack/react-table';
import {Button, ButtonProps} from './button';
import DataTableViewOptions from './data-table-view-options';
import {Input, InputProps} from './input';
import {useState} from 'react';
import {cn} from '@/lib/utils';
import DataTableFacetedFilter, {DataTableFacetedFilterProps} from './data-table-faceted-filter';

export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  showViewOptions?: boolean;
  placeholder?: string;
  onRefreshClick?: () => void;
  onChangeSearch?: (search?: string) => void;
  inputProps?: InputProps;
  buttonProps?: ButtonProps;
  classNameContainer?: string;
  showSearch?: boolean;
  count?: number;
  facetedOptions?: FacetedOptionsProps[];
}

interface FacetedOptionsProps extends Omit<DataTableFacetedFilterProps<any, any>, 'column'> {
  column: string;
}

export function DataTableToolbar<TData>({
  table,
  showViewOptions = true,
  placeholder,
  inputProps,
  buttonProps,
  classNameContainer,
  showSearch = true,
  facetedOptions,
  onRefreshClick,
  onChangeSearch
}: DataTableToolbarProps<TData>) {
  const [search, setSearch] = useState('');
  const isFiltered = table.getState().columnFilters.length > 0;
  return (
    <div className={cn('flex justify-between my-4', classNameContainer)}>
      {showSearch && (
        <div className="flex gap-4 items-center">
          <Input
            type="search"
            placeholder={placeholder || 'Search...'}
            className="min-w-[300px] md:w-[300px] lg:w-[300px] h-[36px]"
            {...inputProps}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onChangeSearch?.(e.target.value);
            }}
          />
          {facetedOptions?.map((option, index) => {
            if (!table.getColumn(option.column)) {
              return null;
            }
            return <DataTableFacetedFilter key={index} {...option} column={table.getColumn(option.column)} />;
          })}
          {isFiltered && (
            <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
              Reset
              <Cross2Icon className="ml-1 h-4 w-4" />
            </Button>
          )}
          <p className="text-sm w-full">{table.getRowCount()} result</p>
        </div>
      )}
      <div className="flex gap-2">
        {showViewOptions && <DataTableViewOptions table={table} />}
        {/* {onRefreshClick && <RefreshButton {...buttonProps} onClickRefresh={onRefreshClick} />} */}
      </div>
    </div>
  );
}
