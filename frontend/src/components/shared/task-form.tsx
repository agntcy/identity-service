/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useFormContext} from 'react-hook-form';
import {FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {GeneralSize, MenuItem, Select, Skeleton, Tag, Typography} from '@outshift/spark-design';
import {PolicyLogicyFormValues} from '@/schemas/policy-logic-schema';
import {RuleAction} from '@/types/api/policy';
import {labels} from '@/constants/labels';
import {useStepper} from '../policies/create/stepper';
import {PolicyFormValues} from '@/schemas/policy-schema';
import {useGetGetTasksAgenticService} from '@/queries';
import {useMemo} from 'react';

export const TaskForm = ({index, fieldIndex, isLoading = false}: {isLoading?: boolean; index: number; fieldIndex: number; register?: any}) => {
  const policyForm = useFormContext<PolicyLogicyFormValues>();
  const methods = useStepper();
  const metaData = methods.getMetadata('policyForm') as PolicyFormValues | undefined;
  const assignedTo = metaData?.assignedTo ?? '';

  const {data: dataTasks, isLoading: isLoadingTasks, isError: isErrorTasks} = useGetGetTasksAgenticService(assignedTo);

  const tasks = useMemo(() => {
    return dataTasks?.tasks ?? [];
  }, [dataTasks]);

  const optionsTasks = useMemo(() => {
    return tasks.map((task) => ({
      label: task.name ?? 'Unknown Task',
      value: task.id ?? ''
    }));
  }, [tasks]);

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

  return (
    <div className="w-full flex gap-8">
      <div className="w-[50%]">
        {isLoadingTasks || isErrorTasks ? (
          <Skeleton sx={{marginTop: '14px', height: '60px'}} />
        ) : (
          <FormField
            control={policyForm.control}
            name={`rules.${fieldIndex}.tasks.${index}.task`}
            render={({field}) => (
              <FormItem className="w-full">
                <FormLabel className="form-label">Task</FormLabel>
                <FormControl>
                  <Select
                    disabled={isLoading}
                    fullWidth
                    label="Select tasks"
                    variant="standard"
                    displayEmpty
                    sx={{
                      height: '36px',
                      marginTop: 0,
                      '&.MuiInputBase-root': {backgroundColor: '#FBFCFE', marginTop: 0, border: '2px solid #E8EEFB'},
                      '& .MuiSelect-select': {backgroundColor: '#fbfcfe', color: '#777D85'},
                      '& .MuiSelect-icon': {
                        color: 'currentColor'
                      }
                    }}
                    renderValue={(select: any) => {
                      if (!select) {
                        return (
                          <Typography variant="body1" fontSize={14} sx={(theme) => ({color: theme.palette.vars.baseTextWeak})}>
                            Select task...
                          </Typography>
                        );
                      }
                      return (
                        <div className="mb-1">
                          <Tag size={GeneralSize.Small}>{select}</Tag>
                        </div>
                      );
                    }}
                    {...field}
                  >
                    {optionsTasks.map((option, key) => (
                      <MenuItem key={key} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                    {optionsTasks.length === 0 && (
                      <MenuItem value="" disabled>
                        <div className="flex items-center gap-2">
                          <Skeleton variant="circular" width={20} height={20} />
                          <Typography variant="body1" fontSize={14} sx={(theme) => ({color: theme.palette.vars.baseTextWeak})}>
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
          name={`rules.${fieldIndex}.tasks.${index}.action`}
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
                    '&.MuiInputBase-root': {backgroundColor: '#FBFCFE', marginTop: 0, border: '2px solid #E8EEFB'},
                    '& .MuiSelect-select': {backgroundColor: '#fbfcfe', color: '#777D85'},
                    '& .MuiSelect-icon': {
                      color: 'currentColor'
                    }
                  }}
                  renderValue={(select: RuleAction) => {
                    if (!select || select === RuleAction.RULE_ACTION_UNSPECIFIED) {
                      return (
                        <Typography variant="body1" fontSize={14} sx={(theme) => ({color: theme.palette.vars.baseTextWeak})}>
                          Select action...
                        </Typography>
                      );
                    }
                    return (
                      <div className="mb-1">
                        <Tag size={GeneralSize.Small}>{labels.rulesActions[select]}</Tag>
                      </div>
                    );
                  }}
                  {...field}
                >
                  {optionsActions.map((option, key) => (
                    <MenuItem key={key} value={option.value}>
                      {option.label}
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
