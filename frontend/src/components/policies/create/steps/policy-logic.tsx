/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {Form} from '@/components/ui/form';
import {cn, validateForm} from '@/lib/utils';
import {RuleFormValues, RuleSchema} from '@/schemas/rule-schema';
import {zodResolver} from '@hookform/resolvers/zod';
import {GripVerticalIcon, PlusIcon, XIcon} from 'lucide-react';
import {useCallback, useState} from 'react';
import {useFieldArray, useForm, UseFormReturn} from 'react-hook-form';
import z from 'zod';
import lodash from 'lodash';
import {RuleAccordion} from '@/components/shared/rule-accordion';
import {DragDropContext, Droppable, Draggable} from '@hello-pangea/dnd';
import {useStepper} from '../stepper';
import {RuleForm} from '@/components/shared/rule-form';
import {Button, Divider, IconButton} from '@mui/material';
import {PolicyLogicyFormValues} from '@/schemas/policy-logic-schema';
import {Accordion, Tooltip} from '@outshift/spark-design';

export const PolicyLogic = ({isLoading = false, policyForm}: {policyForm: UseFormReturn<PolicyLogicyFormValues>; isLoading?: boolean}) => {
  const methods = useStepper();

  const {
    fields,
    append: appendRule,
    remove: removeRule
  } = useFieldArray({
    control: policyForm.control,
    name: 'rules'
  });

  // const ruleForm = useForm<RuleFormValues>({
  //   resolver: zodResolver(RuleSchema),
  //   mode: 'all',
  //   defaultValues: {
  //     name: '',
  //     description: '',
  //     needsApproval: 'no',
  //     tasks: [
  //       {
  //         task: '',
  //         action: ''
  //       }
  //     ]
  //   }
  // });

  // const onSubmit = useCallback(() => {
  //   const values = ruleForm.getValues();
  //   const validationResult = validateForm(RuleSchema, values);
  //   if (!validationResult.success) {
  //     validationResult.errors?.forEach((error) => {
  //       const fieldName = error.path[0] as keyof z.infer<typeof RuleSchema>;
  //       ruleForm.setError(fieldName, {type: 'manual', ...error});
  //     });
  //     return;
  //   }
  //   console.log('onSubmit', values);
  // }, [ruleForm]);

  // useEffect(() => {
  //   methods.setMetadata('policyLogic', {
  //     rules: rules
  //   });
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [rules]);

  const handleRemove = useCallback(
    (fieldIndex: number) => {
      removeRule(fieldIndex);
    },
    [removeRule]
  );

  const handleAddRule = useCallback(() => {
    appendRule({
      name: '',
      description: '',
      needsApproval: 'no',
      tasks: [
        {
          task: '',
          action: ''
        }
      ]
    });
  }, [appendRule]);

  return (
    <Card className="text-start py-4 rounded-[8px] p-[24px]" variant="secondary">
      <CardContent className="p-0 space-y-6">
        <Form {...policyForm}>
          {fields.map((field, index) => {
            return (
              <div key={field.id}>
                <div className="flex justify-between items-start gap-4">
                  <div className="w-full">
                    <Accordion title={'Rule'} defaultValue={field.id}>
                      <div className="mt-4 pl-8">
                        {/* <Form {...form}>
                          <RuleForm />
                        </Form> */}
                      </div>
                    </Accordion>
                  </div>
                  {index > 0 && (
                    <Tooltip title="Remove this rule">
                      <IconButton
                        sx={(theme) => ({
                          color: theme.palette.vars.baseTextDefault,
                          width: '24px',
                          height: '24px'
                        })}
                        onClick={() => handleRemove(index)}
                      >
                        <XIcon className="h-4 w-4" />
                      </IconButton>
                    </Tooltip>
                  )}
                </div>
                {index < fields.length - 1 && (
                  <div className="my-8">
                    <Divider />
                  </div>
                )}
              </div>
            );
          })}
          <div>
            <Divider />
          </div>
          <div className="flex justify-end">
            <Button
              variant="tertariary"
              sx={{fontWeight: '600 !important'}}
              startIcon={<PlusIcon className="w-4 h-4" />}
              loading={isLoading}
              loadingPosition="start"
              // disabled={isLoading || !ruleForm.formState.isValid}
              onClick={handleAddRule}
            >
              Add Logic
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};
