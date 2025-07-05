/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  DropdownAutocompleteTree,
  DropdownAutocompleteTreeProps,
  SearchField,
  SearchFieldProps,
  SelectNodeType,
  Stack,
  Typography,
  useDropdownAutocompleteTree
} from '@outshift/spark-design';
import {useEffect, useState} from 'react';

interface CustomDropdownProps<T>
  extends Omit<
    DropdownAutocompleteTreeProps,
    'flattenedTreeOptions' | 'setSearchText' | 'toggleExpand' | 'updateCheckbox' | 'selectAllNode' | 'searchText'
  > {
  treeData: SelectNodeType<T>[];
  onSelectValues?: (selectedValues: SelectNodeType<T>[]) => void;
}

interface FilterSectionProps<T> {
  searchFieldProps?: SearchFieldProps;
  dropDowns?: CustomDropdownProps<T>[];
  title?: string;
}

export const FilterSections = <T,>({title, searchFieldProps, dropDowns}: FilterSectionProps<T>) => {
  function useDebounceCallback(callback: (value: string) => void, delay: number) {
    const [value, setValue] = useState<string>('');

    useEffect(() => {
      const handler = setTimeout(() => {
        callback(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay, callback]);

    return setValue;
  }

  const debouncedOnChange = useDebounceCallback((value: string) => {
    searchFieldProps?.onChangeCallback?.(value);
  }, 150);

  return (
    <Stack marginBottom="16px">
      {title && (
        <Typography variant="h6" sx={(theme) => ({color: theme.palette.vars.baseTextStrong})}>
          {title}
        </Typography>
      )}
      <Stack direction="row" gap={2} alignItems="center" justifyContent="end">
        {searchFieldProps && (
          <SearchField
            sx={{'& .MuiInputBase-root': {marginTop: 0, width: '320px', height: '32px'}}}
            {...searchFieldProps}
            onChangeCallback={debouncedOnChange}
          />
        )}
        {dropDowns?.map((dropdown, index) => <CustomDropdown<T> key={index} {...dropdown} />)}
      </Stack>
    </Stack>
  );
};

const CustomDropdown = <T,>({treeData, onSelectValues, isSearchFieldEnabled, ...props}: CustomDropdownProps<T>) => {
  const {flattenedTreeOptions, onSelectAllChange, selectAllNode, selectedValues, setSearchText, toggleExpand, updateCheckbox, searchTextDebounced} =
    useDropdownAutocompleteTree({
      treeData: treeData,
      parentSelectOnly: true,
      selectAllIcon: null
    });

  useEffect(() => {
    onSelectValues?.(selectedValues);
  }, [selectedValues, onSelectValues]);

  return (
    <DropdownAutocompleteTree
      flattenedTreeOptions={
        isSearchFieldEnabled ? flattenedTreeOptions.flattenedSelectTreeWithSearch : flattenedTreeOptions.flattenedSelectTreeWithoutSearch
      }
      onSelectAllChange={onSelectAllChange}
      searchText={searchTextDebounced}
      setSearchText={setSearchText}
      selectAllNode={selectAllNode}
      toggleExpand={toggleExpand}
      updateCheckbox={updateCheckbox}
      isSearchFieldEnabled={isSearchFieldEnabled}
      popOverPaperSx={{
        width: 'fit-content'
      }}
      {...props}
    />
  );
};
