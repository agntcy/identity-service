/* eslint-disable indent */
/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SearchFieldWithAutocomplete,
  SearchFieldWithAutocompleteOption
} from '@/components/ui/search-field-with-auto-complete';
import {generatePath, useNavigate} from 'react-router-dom';
import {ListItemIcon, ListItemText, Typography} from '@mui/material';
import {App} from '@/types/api/app';
import {Policy} from '@/types/api/policy';
import {useCallback, useMemo, useState} from 'react';
import {useGetAgenticService, useGetAgenticServices, useGetPolicies} from '@/queries';
import {AgenticServiceType} from '../agentic-services/agentic-service-type';
import {PATHS} from '@/router/paths';
import {useFeatureFlagsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';
import {GeneralSize, Tag, Tags, TagStatus} from '@outshift/spark-design';
type GlobalSearchOptionType = App | Policy;

const ApplicationListItem = ({app}: {app: App}) => (
  <div className="flex items-center">
    <ListItemIcon>
      <AgenticServiceType type={app.type} showLabel={false} />
    </ListItemIcon>
    <ListItemText
      primary={
        <Tags
          size={GeneralSize.Small}
          items={[
            {
              valueFormatter: () => app.name || 'Unknown Application'
            },
            ...(app.description
              ? [
                  {
                    valueFormatter: () => app.description || undefined
                  }
                ]
              : [])
          ]}
          showOnlyFirst={false}
          shouldTruncate
          maxTooltipTags={2}
        />
      }
    />
  </div>
);

const PolicyListItem = ({policy}: {policy: Policy}) => {
  const {data} = useGetAgenticService(policy.assignedTo);
  return (
    <div className="flex items-center gap-2">
      <ListItemText
        primary={
          <Tags
            size={GeneralSize.Small}
            items={[
              {
                valueFormatter: () => policy.name || 'Unknown Policy'
              },
              ...(policy.description
                ? [
                    {
                      valueFormatter: () => policy.description || undefined
                    }
                  ]
                : [])
            ]}
            showOnlyFirst={false}
            shouldTruncate
            maxTooltipTags={2}
          />
        }
      />
      <Tag status={TagStatus.Info} size={GeneralSize.Small}>
        {policy.rules?.length ?? 0} Rule{(policy.rules?.length ?? 0) > 1 ? 's' : ''}
      </Tag>
      <Tag size={GeneralSize.Small}>
        <div className="flex items-center gap-2">
          <AgenticServiceType type={data?.type} showLabel={false} />
          <Typography variant="body2">{data?.name ?? 'Not provided'}</Typography>
        </div>
      </Tag>
    </div>
  );
};

export const GlobalSearch = () => {
  const [query, setQuery] = useState('');

  const navigate = useNavigate();

  const {isTbacEnable} = useFeatureFlagsStore(
    useShallow((state) => ({
      isTbacEnable: state.featureFlags.isTbacEnable
    }))
  );

  const {data: dataAgenticServices, isLoading: loadingAgenticServices} = useGetAgenticServices(
    {
      query: query
    },
    !!query
  );

  const {data: dataPolicies, isLoading: loadingPolicies} = useGetPolicies({
    query: {
      query: query
    },
    enable: !!query && isTbacEnable
  });

  const dataSources = useMemo(() => {
    return [
      {
        id: 'agentic-services',
        items: dataAgenticServices?.apps?.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')) || [],
        renderer: (item: GlobalSearchOptionType) => <ApplicationListItem app={item} />
      },
      ...(isTbacEnable
        ? [
            {
              id: 'policies',
              items: dataPolicies?.policies?.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')) || [],
              renderer: (item: GlobalSearchOptionType) => <PolicyListItem policy={item} />
            }
          ]
        : [])
    ];
  }, [dataAgenticServices?.apps, dataPolicies?.policies, isTbacEnable]);

  const dataLabels = useMemo(() => {
    return {
      'agentic-services': 'Agentic Services',
      ...(isTbacEnable ? {policies: 'Policies'} : {})
    };
  }, [isTbacEnable]);

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
      case 'policies': {
        const path = generatePath(PATHS.policies.info, {
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
      loading={loadingAgenticServices || (isTbacEnable && loadingPolicies)}
      options={options as any}
      labels={dataLabels}
    />
  );
};
