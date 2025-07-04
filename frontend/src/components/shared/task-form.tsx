/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Control} from 'react-hook-form';
import {FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {GeneralSize, MenuItem, Select, Tag, Typography} from '@outshift/spark-design';
import {RuleFormValues} from '@/schemas/rule-schema';

export const TaskForm = ({
  control,
  index,
  isLoading = false
}: {
  isLoading?: boolean;
  control: Control<RuleFormValues>;
  index: number;
  register?: any;
}) => {
  const optionsTasks = [
    {label: 'Task 1', value: 'task1'},
    {label: 'Task 2', value: 'task2'},
    {label: 'Task 3', value: 'task3'}
  ];

  const optionsActions = [
    {label: 'Action 1', value: 'action1'},
    {label: 'Action 2', value: 'action2'},
    {label: 'Action 3', value: 'action3'}
  ];

  return (
    <div className="w-full flex gap-8">
      <FormField
        control={control}
        name={`tasks.${index}.task` as any}
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
              </Select>
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`tasks.${index}.action` as any}
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
                renderValue={(select: any) => {
                  if (!select) {
                    return (
                      <Typography variant="body1" fontSize={14} sx={(theme) => ({color: theme.palette.vars.baseTextWeak})}>
                        Select action...
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
  );
};
