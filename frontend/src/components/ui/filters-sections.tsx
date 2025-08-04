/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {cn} from '@/lib/utils';
import {
  DropdownAutocompleteTree,
  DropdownAutocompleteTreeProps,
  IconButton,
  SearchField,
  SearchFieldProps,
  SelectNodeType,
  Skeleton,
  Stack,
  toast,
  Tooltip,
  Typography,
  useDropdownAutocompleteTree
} from '@outshift/spark-design';
import {RotateCwIcon} from 'lucide-react';
import {useCallback, useEffect} from 'react';
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
  sameLine?: boolean;
  isLoading?: boolean;
  onClickRefresh?: () => void;
}

export const FilterSections = <T,>({
  title,
  isLoading = true,
  sameLine = false,
  searchFieldProps,
  dropDowns,
  onClickRefresh
}: FilterSectionProps<T>) => {
  const debounced = useDebouncedCallback((value) => {
    searchFieldProps?.onChangeCallback?.(value);
  }, 250);

  const handleClickOnRefresh = useCallback(() => {
    toast({
      title: 'Refreshing...',
      type: 'info',
      description: 'Please wait while we refresh the data.'
    });
    onClickRefresh?.();
  }, [onClickRefresh]);

  return (
    <Stack
      marginBottom="16px"
      sx={{
        ...(sameLine
          ? {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}
          : {flexDirection: 'column'})
      }}
    >
      {isLoading ? (
        <Skeleton sx={{width: '200px', height: '20px'}} />
      ) : (
        title && (
          <Typography variant="h6" sx={(theme) => ({color: theme.palette.vars.baseTextStrong})}>
            {title}
          </Typography>
        )
      )}
      {sameLine ? (
        <>
          {searchFieldProps && (
            <SearchField
              sx={{'& .MuiInputBase-root': {marginTop: 0, width: '320px', height: '36px'}}}
              {...searchFieldProps}
              onChangeCallback={debounced}
            />
          )}
          {dropDowns?.map((dropdown, index) => <CustomDropdown<T> key={index} {...dropdown} />)}
          {onClickRefresh && (
            <Tooltip title="Refresh">
              <IconButton
                size="small"
                onClick={handleClickOnRefresh}
                sx={(theme) => ({
                  border: `1px solid ${theme?.palette.vars.controlBorderDefault}`,
                  borderRadius: '4px',
                  padding: '4px',
                  width: '36px',
                  height: '36px',
                  '&:hover': {
                    border: `1px solid ${theme?.palette.vars.controlBorderDefault}`,
                    backgroundColor: 'transparent'
                  },
                  '&.MuiSvgIcon-root, svg': {
                    width: '20px',
                    height: '20px'
                  }
                })}
              >
                <RotateCwIcon className={cn(isLoading && 'animate-spin')} />
              </IconButton>
            </Tooltip>
          )}
        </>
      ) : (
        <Stack direction="row" gap={2} alignItems="center" justifyContent="end">
          {searchFieldProps && (
            <SearchField
              sx={{'& .MuiInputBase-root': {marginTop: 0, width: '320px', height: '36px'}}}
              {...searchFieldProps}
              onChangeCallback={debounced}
            />
          )}
          {dropDowns?.map((dropdown, index) => <CustomDropdown<T> key={index} {...dropdown} />)}
          {onClickRefresh && (
            <Tooltip title="Refresh">
              <IconButton
                size="small"
                onClick={handleClickOnRefresh}
                sx={(theme) => ({
                  border: `1px solid ${theme?.palette.vars.controlBorderDefault}`,
                  borderRadius: '4px',
                  padding: '4px',
                  width: '36px',
                  height: '36px',
                  '&:hover': {
                    border: `1px solid ${theme?.palette.vars.controlBorderDefault}`,
                    backgroundColor: 'transparent'
                  },
                  '&.MuiSvgIcon-root, svg': {
                    width: '20px',
                    height: '20px'
                  }
                })}
              >
                <RotateCwIcon className={cn(isLoading && 'animate-spin')} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      )}
    </Stack>
  );
};

const CustomDropdown = <T,>({treeData, onSelectValues, isSearchFieldEnabled, ...props}: CustomDropdownProps<T>) => {
  const {
    flattenedTreeOptions,
    onSelectAllChange,
    selectAllNode,
    selectedValues,
    setSearchText,
    toggleExpand,
    updateCheckbox,
    searchTextDebounced
  } = useDropdownAutocompleteTree({
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
        isSearchFieldEnabled
          ? flattenedTreeOptions.flattenedSelectTreeWithSearch
          : flattenedTreeOptions.flattenedSelectTreeWithoutSearch
      }
      onSelectAllChange={onSelectAllChange}
      searchText={searchTextDebounced}
      setSearchText={setSearchText}
      selectAllNode={selectAllNode}
      toggleExpand={toggleExpand}
      updateCheckbox={updateCheckbox}
      isSearchFieldEnabled={isSearchFieldEnabled}
      popOverPaperSx={{
        width: 'fit-content',
        height: 'fit-content'
      }}
      buttonProps={{
        style: {
          height: '36px'
        }
      }}
      {...props}
    />
  );
};
