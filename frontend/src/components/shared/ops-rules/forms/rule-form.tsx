/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useFormContext} from 'react-hook-form';
import {FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Checkbox} from '@outshift/spark-design';
import {TaskForm} from './task-form';
import {RuleFormValues} from '@/schemas/rule-schema';
import {Policy} from '@/types/api/policy';

export const RuleForm = ({isLoading = false, policy}: {isLoading?: boolean; policy?: Policy}) => {
  const policyForm = useFormContext<RuleFormValues>();
  return (
    <div className="space-y-6 w-full">
      <div className="w-full flex gap-8">
        <FormField
          control={policyForm.control}
          name={'name'}
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
          name={'description'}
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
      <TaskForm isLoading={isLoading} policy={policy} />
      <FormField
        control={policyForm.control}
        name={'needsApproval'}
        render={({field}) => (
          <FormItem className="w-full">
            <FormControl>
              <div className="flex items-center">
                <Checkbox
                  id="needs-approval-checkbox"
                  checked={field.value}
                  onChange={(checked) => field.onChange(checked)}
                />
                <FormLabel className="form-label">Needs Approval?</FormLabel>
              </div>
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};
