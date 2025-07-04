/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Control, useFieldArray, useFormContext} from 'react-hook-form';
import {FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Button, Tooltip, Typography} from '@outshift/spark-design';
import {RuleFormValues} from '@/schemas/rule-schema';
import {useCallback} from 'react';
import {TaskForm} from './task-form';
import {PlusIcon, XIcon} from 'lucide-react';
import {Divider, IconButton} from '@mui/material';
import {PolicyLogicyFormValues} from '@/schemas/policy-logic-schema';

export const RuleForm = ({isLoading = false, fieldIndex}: {isLoading?: boolean; fieldIndex: number}) => {
  const policyForm = useFormContext<PolicyLogicyFormValues>();

  const {
    fields,
    append: appendTask,
    remove: removeTask
  } = useFieldArray<PolicyLogicyFormValues>({
    name: `rules.${fieldIndex}.tasks`
  });

  const handleRemoveTask = useCallback((index: number) => {
    // remove(index);
  }, []);

  const handleAddTask = useCallback(() => {
    // append({
    //   task: '',
    //   action: ''
    // });
  }, []);

  return (
    <div className="space-y-4">
      <div className="w-full flex gap-8">
        <FormField
          control={policyForm.control}
          name={`rules.${fieldIndex}.name`}
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
          control={policyForm.control}
          name={`rules.${fieldIndex}.description`}
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
      <div className="bg-[#FBFCFE] p-[24px] rounded-[8px] w-full h-full space-y-6">
        <div>
          <Typography variant="subtitle1" fontWeight={600}>
            Select Tasks and Actions
          </Typography>
        </div>
        <div>
          {/* {fields.map((form, index) => {
            return (
              <div key={form.id} className="flex flex-col gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-full">
                    <TaskForm isLoading={isLoading} control={policyForm.control} index={index} />
                  </div>
                  <Tooltip title="Remove this rule">
                    <IconButton
                      sx={(theme) => ({
                        color: theme.palette.vars.baseTextDefault,
                        width: '24px',
                        height: '24px',
                        marginTop: '24px'
                      })}
                      onClick={() => handleRemoveTask?.(index)}
                    >
                      <XIcon className="h-4 w-4" />
                    </IconButton>
                  </Tooltip>
                </div>
                <div className="mb-4">
                  <Divider />
                </div>
              </div>
            );
          })} */}
        </div>
        <div className="flex justify-end">
          <Button
            variant="tertariary"
            sx={{fontWeight: '600 !important', padding: '0 !important'}}
            startIcon={<PlusIcon className="w-4 h-4" />}
            loadingPosition="start"
            size="small"
            disabled={isLoading || (!policyForm.formState.isValid && fields.length !== 0)}
            onClick={handleAddTask}
          >
            Add Task
          </Button>
        </div>
      </div>
    </div>
  );
};
