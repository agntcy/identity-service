/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useFormContext} from 'react-hook-form';
import {FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {PolicyLogicyFormValues} from '@/schemas/policy-logic-schema';
import {TaskForm} from './task-form';
import {Checkbox} from '@outshift/spark-design';

export const RuleForm = ({isLoading = false, fieldIndex}: {isLoading?: boolean; fieldIndex: number}) => {
  const policyForm = useFormContext<PolicyLogicyFormValues>();
  return (
    <div className="space-y-6 w-full">
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
      <TaskForm isLoading={isLoading} fieldIndex={fieldIndex} />
      <FormField
        control={policyForm.control}
        name={`rules.${fieldIndex}.needsApproval`}
        render={({field}) => (
          <FormItem className="w-full">
            <FormControl>
              <div className="flex items-center">
                <Checkbox id="needs-approval-checkbox" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                <FormLabel className="form-label">Needs Approval?</FormLabel>
              </div>
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};
