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
  Skeleton,
  Stack,
  Typography,
  useDropdownAutocompleteTree
} from '@outshift/spark-design';
import {useEffect} from 'react';
import {useDebouncedCallback} from 'use-debounce';

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
  isLoading?: boolean;
}

export const FilterSections = <T,>({title, isLoading = true, searchFieldProps, dropDowns}: FilterSectionProps<T>) => {
  const debounced = useDebouncedCallback((value) => {
    searchFieldProps?.onChangeCallback?.(value);
  }, 250);

  return (
    <Stack marginBottom="16px">
      {isLoading ? (
        <Skeleton sx={{width: '200px', height: '20px'}} />
      ) : (
        title && (
          <Typography variant="h6" sx={(theme) => ({color: theme.palette.vars.baseTextStrong})}>
            {title}
          </Typography>
        )
      )}
      <Stack direction="row" gap={2} alignItems="center" justifyContent="end">
        {searchFieldProps && (
          <SearchField
            sx={{'& .MuiInputBase-root': {marginTop: 0, width: '320px', height: '36px'}}}
            {...searchFieldProps}
            onChangeCallback={debounced}
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
