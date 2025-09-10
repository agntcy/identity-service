/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {forwardRef, useCallback, useMemo, useState} from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import * as _ from 'lodash';
import SearchIcon from '@mui/icons-material/Search';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import {Theme} from '@mui/material';

const INITIAL_COUNT = 3;
const GAP = 10;

const FlooredCount = ({count, childrenCount}: {count: number; childrenCount: number}) => {
  const remainingCount = count - childrenCount;
  if (remainingCount <= 0) {
    return null;
  }
  const formattedCount = remainingCount < 10 ? remainingCount : `${Math.floor(remainingCount / 10) * 10}+`;
  return (
    <Typography sx={{float: 'left', margin: '10px'}} variant="body2">
      {formattedCount} results not shown
    </Typography>
  );
};

export interface SearchFieldWithAutocompleteOption<T> {
  category: string;
  filteringFields?: string[];
  entity: T;
  renderer: (entity: T) => React.ReactNode;
}

export interface SearchFieldWithAutocompleteProps<T> {
  options: SearchFieldWithAutocompleteOption<T>[];
  placeholder?: string;
  serverFiltering?: boolean;
  loading?: boolean;
  labels: {[key: string]: string};
  onChange: (value: string | SearchFieldWithAutocompleteOption<T>) => void;
  onSearch?: (query: string) => void;
}

export const SearchFieldWithAutocomplete = forwardRef(function SearchFieldWithAutocomplete<T>(
  {
    options,
    placeholder,
    serverFiltering = false,
    loading = false,
    labels,
    onChange,
    onSearch
  }: SearchFieldWithAutocompleteProps<T>,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  const [inputValue, setInputValue] = useState('');
  const [categoryMaxCounts, setCategoryMaxCounts] = useState<{[key: string]: number}>({});

  const theme = useTheme();

  const handleExpandButtonClicked = useCallback(
    (categoryKey: any) => {
      setCategoryMaxCounts({...categoryMaxCounts, [categoryKey]: (categoryMaxCounts[categoryKey] ?? INITIAL_COUNT) + GAP});
    },
    [categoryMaxCounts]
  );

  const handleReset = useCallback(
    (categoryKey: any) => {
      setCategoryMaxCounts({...categoryMaxCounts, [categoryKey]: INITIAL_COUNT});
    },
    [categoryMaxCounts]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      if (serverFiltering && onSearch) {
        onSearch(value);
      }
    },
    [serverFiltering, onSearch]
  );

  const filteredOptions = useMemo(() => {
    if (inputValue.length === 0) {
      return {} as _.Dictionary<SearchFieldWithAutocompleteOption<T>[]>;
    }

    if (serverFiltering) {
      return _.groupBy(options, (option) => option.category);
    }

    const filtered = options.filter((option) =>
      option.filteringFields?.some((field) => {
        if (!_.has(option.entity, field) || typeof option.entity[field] === 'object') {
          return false;
        }
        return _.toString(option.entity[field]).toLowerCase().includes(inputValue.toLowerCase());
      })
    );

    return _.groupBy(filtered, (option) => option.category);
  }, [options, inputValue, serverFiltering]);

  return (
    <Autocomplete
      ref={ref}
      options={options}
      fullWidth={false}
      loading={loading}
      openOnFocus={true}
      clearOnEscape={true}
      disableClearable={true}
      inputValue={inputValue}
      onInputChange={(_, value) => handleInputChange(value)}
      groupBy={(option) => option.category}
      onChange={(_, value) => {
        if (value !== null) {
          onChange(value);
        }
      }}
      getOptionLabel={(option) =>
        typeof option === 'string'
          ? option
          : (option.entity as Record<string, any>)['name'] || (option.entity as Record<string, any>)['title'] || ''
      }
      filterOptions={() => {
        const limitedOptions = Object.keys(filteredOptions).flatMap((category) => {
          const categoryOptions = filteredOptions[category];
          return categoryOptions.slice(0, categoryMaxCounts[category] ?? INITIAL_COUNT);
        });
        return limitedOptions;
      }}
      sx={{'& fieldset': {borderWidth: '2px'}}}
      slotProps={{
        paper: {
          sx: {
            padding: '16px',
            minWidth: '360px',
            '.MuiAutocomplete-listbox .MuiAutocomplete-option': {
              paddingX: 0
            },
            'li:last-child hr': {
              display: 'none'
            },
            '.MuiAutocomplete-listbox': {
              maxHeight: '50vh'
            },
            '.MuiAutocomplete-noOptions': {
              padding: 0,
              textAlign: 'center',
              color: theme.palette.vars.baseTextWeak,
              ...theme.typography.subtitle2
            },
            '.MuiAutocomplete-loading': {
              padding: 0,
              textAlign: 'center',
              color: theme.palette.vars.baseTextWeak,
              ...theme.typography.subtitle2
            }
          }
        }
      }}
      renderGroup={(params) => (
        <Box component="li" key={params.key} sx={{margin: 0, padding: 0}}>
          <Typography variant="body2Semibold">{labels[params.group] || params.group}</Typography>
          <List sx={{paddingTop: '4px'}}>{params.children}</List>
          <div className="flex justify-between items-center">
            <span>
              <FlooredCount
                count={filteredOptions[params.group].length}
                childrenCount={React.Children.count(params.children)}
              />
            </span>
            {filteredOptions[params.group].length > INITIAL_COUNT ? (
              filteredOptions[params.group].length - React.Children.count(params.children) > 0 ? (
                <Button
                  variant="tertariary"
                  size="small"
                  onClick={() => handleExpandButtonClicked(params.group)}
                  sx={{float: 'right'}}
                >
                  Show more...
                </Button>
              ) : (
                <Button
                  variant="tertariary"
                  size="small"
                  onClick={() => handleReset(params.group)}
                  sx={{float: 'right', marginTop: '8px'}}
                >
                  Reset
                </Button>
              )
            ) : null}
          </div>
          <Divider sx={{marginTop: '16px', marginBottom: '22px'}} />
        </Box>
      )}
      renderOption={(props, option) => (
        <ListItem {...props} sx={{paddingX: '12px !important', minHeight: '16px !important'}}>
          {option.renderer(option.entity)}
        </ListItem>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder || 'Search...'}
          sx={{
            padding: 0,
            '& .MuiInput-root': {
              marginTop: 0
            },
            '& .MuiInputBase-root': {
              marginTop: '0px !important',
              width: '360px',
              height: '36px',
              padding: '8px 12px !important'
            }
          }}
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={searchIconStyle(theme)} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => handleInputChange('')}
                    sx={clearButtonStyle(!!inputValue.length)}
                    data-testid="clear-button"
                  >
                    <HighlightOffIcon sx={clearIconStyle(theme)} />
                  </IconButton>
                </InputAdornment>
              )
            }
          }}
        />
      )}
    />
  );
});

const searchIconStyle = (theme: Theme) => ({
  color: theme.palette.vars?.controlIconWeak,
  '.Mui-focused &': {
    color: theme.palette.vars.brandIconPrimaryDefault
  }
});

const clearIconStyle = (theme: Theme) => ({
  width: '21.6px',
  height: '21.6px',
  color: theme.palette.vars?.controlIconWeak
});

const clearButtonStyle = (inputHasValue: boolean) => {
  return {
    padding: '1px',
    visibility: inputHasValue ? 'visible' : 'hidden'
  };
};
