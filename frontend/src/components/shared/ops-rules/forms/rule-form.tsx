/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useFormContext} from 'react-hook-form';
import {FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Checkbox, IconButton, Skeleton} from '@outshift/spark-design';
import {TaskForm} from './task-form';
import {RuleFormValues} from '@/schemas/rule-schema';
import {Policy} from '@/types/api/policy';
import {InfoIcon} from 'lucide-react';
import {useGetDevices} from '@/queries';
import {useMemo} from 'react';

export const RuleForm = ({isLoading = false, policy}: {isLoading?: boolean; policy?: Policy}) => {
  const policyForm = useFormContext<RuleFormValues>();

  const {data: dataDevices, isLoading: isLoadingDevices, isError: isErrorDevices} = useGetDevices();

  const hasDevices = useMemo(() => {
    return (dataDevices?.devices?.length ?? 0) > 0;
  }, [dataDevices]);

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
      {isLoadingDevices || isErrorDevices ? (
        <Skeleton sx={{marginTop: '14px', height: '50px', width: '50px'}} />
      ) : (
        <FormField
          control={policyForm.control}
          name={'needsApproval'}
          render={({field}) => (
            <FormItem className="w-full">
              <FormControl>
                <div className="flex items-center">
                  <Checkbox
                    disabled={!hasDevices}
                    id="needs-approval-checkbox"
                    checked={field.value}
                    onChange={(checked) => field.onChange(checked)}
                  />
                  <FormLabel className="form-label">Needs Approval?</FormLabel>
                  <IconButton
                    sx={(theme) => ({
                      color: theme.palette.vars.baseTextDefault,
                      width: '24px',
                      height: '24px',
                      marginLeft: '8px'
                    })}
                  >
                    <InfoIcon className="w-4 h-4" />
                  </IconButton>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      )}
    </div>
  );
};
