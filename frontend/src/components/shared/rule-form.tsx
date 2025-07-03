/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useFormContext} from 'react-hook-form';
import {FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {GeneralSize, MenuItem, Select, Tag, Typography} from '@outshift/spark-design';
import {RuleFormValues} from '@/schemas/rule-schema';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {useEffect} from 'react';

export const RuleForm = ({isLoading = false, values}: {isLoading?: boolean; values?: any}) => {
  const form = useFormContext<RuleFormValues>();

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

  useEffect(() => {
    form.reset({
      name: values?.name || '',
      description: values?.description || '',
      needsApproval: values?.needsApproval ? 'yes' : 'no'
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  return (
    <div className="space-y-6">
      <div className="w-full flex gap-8">
        <FormField
          control={form.control}
          name="name"
          render={({field}) => (
            <FormItem className="w-full">
              <FormLabel className="form-label">Name</FormLabel>
              <FormControl>
                <Input placeholder="Type the name..." {...field} disabled={isLoading} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({field}) => (
            <FormItem className="w-full">
              <FormLabel className="form-label">Description</FormLabel>
              <FormControl>
                <Input placeholder="Type the description..." {...field} disabled={isLoading} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <div className="w-full flex gap-8">
        <FormField
          control={form.control}
          name="task"
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
                  value={form.watch('task') ?? ''}
                  onChange={(e) => {
                    form.setValue('task', e.target.value);
                  }}
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
          control={form.control}
          name="action"
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
                  value={form.watch('action') ?? ''}
                  onChange={(e) => {
                    form.setValue('action', e.target.value);
                  }}
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
      <FormField
        control={form.control}
        name="needsApproval"
        render={({field}) => (
          <FormItem className="space-y-2">
            <FormLabel className="form-label">Requires Approval</FormLabel>
            <FormControl>
              <RadioGroup disabled={isLoading} onValueChange={field.onChange} className="flex flex-col" {...field}>
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <RadioGroupItem value="yes" />
                  </FormControl>
                  <Typography variant="body2">Yes</Typography>
                </FormItem>
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <RadioGroupItem value="no" />
                  </FormControl>
                  <Typography variant="body2">No</Typography>
                </FormItem>
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};
