/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useFormContext} from 'react-hook-form';
import {FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {GeneralSize, MenuItem, Select, Skeleton, Tag, Tags, Typography} from '@outshift/spark-design';
import {Policy, RuleAction} from '@/types/api/policy';
import {labels} from '@/constants/labels';
import {useGetGetTasksAgenticService} from '@/queries';
import {useMemo} from 'react';
import {Divider, ListSubheader} from '@mui/material';
import {RuleFormValues} from '@/schemas/rule-schema';

export const TaskForm = ({isLoading = false, policy}: {isLoading?: boolean; policy?: Policy}) => {
  const policyForm = useFormContext<RuleFormValues>();

  const {
    data: dataTasks,
    isLoading: isLoadingTasks,
    isError: isErrorTasks
  } = useGetGetTasksAgenticService(policy?.assignedTo ? {excludeAppIds: [policy.assignedTo]} : undefined);

  const tasks = useMemo(() => {
    return dataTasks?.result ?? [];
  }, [dataTasks]);

  const optionsTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return [];
    }
    return Object.entries(tasks).map(([key, value]) => {
      return {
        groupBy: key,
        label: labels.appTypes[key as keyof typeof labels.appTypes] || key,
        values:
          value.tasks?.map((task) => ({
            label: task.name || 'Unknown Task',
            value: task.id || '',
            appId: task.appId || ''
          })) || []
      };
    });
  }, [tasks]);

  const optionsTasksValues = useMemo(() => {
    return optionsTasks.flatMap((group) =>
      group.values.map((task) => {
        return {
          label: task.label,
          value: task.value,
          appId: task.appId
        };
      })
    );
  }, [optionsTasks]);

  const optionsActions = [
    {
      label: labels.rulesActions[RuleAction.RULE_ACTION_ALLOW],
      value: RuleAction.RULE_ACTION_ALLOW
    },
    {
      label: labels.rulesActions[RuleAction.RULE_ACTION_DENY],
      value: RuleAction.RULE_ACTION_DENY
    }
  ];

  const renderSelectTasks = (group: {
    groupBy: string;
    label: string;
    values: {
      label: string;
      value: string;
      appId: string;
    }[];
  }) => {
    const items = group.values.map((t) => {
      return (
        <MenuItem key={t.value} value={t.value} sx={{paddingLeft: '24px'}}>
          <Typography variant="body2">{t.label}</Typography>
        </MenuItem>
      );
    });
    return [
      <ListSubheader key={group.groupBy}>
        <Typography variant="captionSemibold">{group.label}</Typography>
      </ListSubheader>,
      items,
      items.length > 0 && items.length < group.values.length ? <Divider key={`${group.groupBy}-divider`} sx={{margin: '4px 0'}} /> : null
    ];
  };

  return (
    <div className="w-full flex gap-8">
      <div className="w-[50%]">
        {isLoadingTasks || isErrorTasks ? (
          <Skeleton sx={{marginTop: '14px', height: '60px'}} />
        ) : (
          <FormField
            control={policyForm.control}
            name={'tasks'}
            render={({field}) => (
              <FormItem className="w-full">
                <FormLabel className="form-label">Tasks</FormLabel>
                <FormControl className="w-full">
                  <Select
                    multiple
                    disabled={isLoading}
                    fullWidth
                    label="Select tasks"
                    variant="standard"
                    displayEmpty
                    sx={{
                      height: '36px',
                      marginTop: 0,
                      '&.MuiInputBase-root': {backgroundColor: '#FBFCFE', marginTop: 0, border: '2px solid #D5DFF7', height: '32px'},
                      '& .MuiSelect-select': {backgroundColor: '#fbfcfe', color: '#777D85'},
                      '& .MuiSelect-icon': {
                        color: 'currentColor'
                      }
                    }}
                    renderValue={(selected: string[]) => {
                      if (!selected || selected.length === 0) {
                        return (
                          <Typography variant="body2" fontSize={14} sx={(theme) => ({color: theme.palette.vars.baseTextWeak})}>
                            Select tasks...
                          </Typography>
                        );
                      }
                      return (
                        <div className="mt-[1px]">
                          <Tags
                            items={selected.map((value) => ({
                              valueFormatter: () => optionsTasksValues.find((option) => option.value === value)?.label || 'Unknown Task',
                              value
                            }))}
                            showOnlyFirst={false}
                            shouldTruncate
                            maxTooltipTags={2}
                          />
                        </div>
                      );
                    }}
                    error={policyForm.formState.errors.tasks ? true : false}
                    {...field}
                  >
                    {optionsTasks?.map((group) => renderSelectTasks(group))}
                    {optionsTasks.length === 0 && (
                      <MenuItem value="" disabled>
                        <div className="flex items-center gap-2">
                          <Skeleton variant="circular" width={20} height={20} />
                          <Typography variant="body2" fontSize={14} sx={(theme) => ({color: theme.palette.vars.baseTextWeak})}>
                            No tasks available
                          </Typography>
                        </div>
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>
      <div className="w-[50%]">
        <FormField
          control={policyForm.control}
          name={'action'}
          render={({field}) => (
            <FormItem className="w-full">
              <FormLabel className="form-label">Action</FormLabel>
              <FormControl>
                <Select
                  disabled={isLoading}
                  fullWidth
                  label="Select action"
                  variant="standard"
                  displayEmpty
                  sx={{
                    height: '36px',
                    marginTop: 0,
                    '&.MuiInputBase-root': {backgroundColor: '#FBFCFE', marginTop: 0, border: '2px solid #D5DFF7', height: '32px'},
                    '& .MuiSelect-select': {backgroundColor: '#fbfcfe', color: '#777D85'},
                    '& .MuiSelect-icon': {
                      color: 'currentColor'
                    }
                  }}
                  renderValue={(select: RuleAction) => {
                    if (!select || select === RuleAction.RULE_ACTION_UNSPECIFIED) {
                      return (
                        <Typography variant="body2" fontSize={14} sx={(theme) => ({color: theme.palette.vars.baseTextWeak})}>
                          Select action...
                        </Typography>
                      );
                    }
                    return (
                      <div className="mb-[4px]">
                        <Tag size={GeneralSize.Small}>{labels.rulesActions[select]}</Tag>
                      </div>
                    );
                  }}
                  error={policyForm.formState.errors.action ? true : false}
                  {...field}
                >
                  {optionsActions.map((option, key) => (
                    <MenuItem key={key} value={option.value}>
                      <Typography variant="body2">{option.label}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
