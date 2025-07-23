/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import * as _ from 'lodash';
import {
  SearchFieldWithAutocomplete,
  SearchFieldWithAutocompleteOption
} from '@/components/ui/search-field-with-auto-complete';
import {generatePath, useNavigate} from 'react-router-dom';
import {ListItemIcon, ListItemText, Typography} from '@mui/material';
import {App} from '@/types/api/app';
import {Policy} from '@/types/api/policy';
import {useCallback, useMemo, useState} from 'react';
import {useGetAgenticServices} from '@/queries';
import {AgenticServiceType} from '../agentic-services/agentic-service-type';
import {PATHS} from '@/router/paths';
type GlobalSearchOptionType = App | Policy;

const ApplicationListItem = ({app}: {app: App}) => (
  <>
    <ListItemIcon>
      <AgenticServiceType type={app.type} showLabel={false} />
    </ListItemIcon>
    <ListItemText primary={<Typography variant="body2">{app.name}</Typography>} />
  </>
);

export const GlobalSearch = () => {
  const [query, setQuery] = useState('');

  const navigate = useNavigate();

  const {data: dataAgenticServices, isLoading: loadingAgenticServices} = useGetAgenticServices(
    {
      query: query
    },
    !!query
  );

  const dataSources = useMemo(() => {
    return [
      {
        id: 'agentic-services',
        items: dataAgenticServices?.apps?.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')) || [],
        renderer: (item: GlobalSearchOptionType) => <ApplicationListItem app={item} />
      }
    ];
  }, [dataAgenticServices]);

  const dataLabels = useMemo(() => {
    return {
      'agentic-services': 'Agentic Services'
    };
  }, []);

  const options = useMemo(() => {
    return dataSources.reduce((acc, ds) => {
      ds.items.forEach((item: GlobalSearchOptionType) => {
        acc.push({
          category: ds.id,
          entity: item,
          renderer: ds.renderer
        });
      });
      return acc;
    }, [] as SearchFieldWithAutocompleteOption<GlobalSearchOptionType>[]);
  }, [dataSources]);

  const handleChange = (option: string | SearchFieldWithAutocompleteOption<unknown>) => {
    if (typeof option === 'string') {
      return;
    }
    const typedOption = option as SearchFieldWithAutocompleteOption<GlobalSearchOptionType>;
    switch (typedOption.category) {
      case 'agentic-services': {
        const path = generatePath(PATHS.agenticServices.info, {
          id: typedOption.entity.id
        });
        void navigate(path);
        break;
      }
    }
  };

  const handleChangeQuery = useCallback((value: string) => {
    setQuery(value);
  }, []);

  return (
    <SearchFieldWithAutocomplete
      onChange={handleChange}
      onSearch={handleChangeQuery}
      serverFiltering={true}
      loading={loadingAgenticServices}
      options={options as any}
      labels={dataLabels}
    />
  );
};
