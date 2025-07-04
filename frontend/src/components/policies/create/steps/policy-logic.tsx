/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {Form} from '@/components/ui/form';
import {PlusIcon, XIcon} from 'lucide-react';
import {useCallback} from 'react';
import {useFieldArray, UseFormReturn} from 'react-hook-form';
import {RuleForm} from '@/components/shared/rule-form';
import {Button, Divider, IconButton} from '@mui/material';
import {PolicyLogicyFormValues} from '@/schemas/policy-logic-schema';
import {Accordion, Tooltip} from '@outshift/spark-design';
import {RuleAction} from '@/types/api/policy';

export const PolicyLogic = ({isLoading = false, policyForm}: {policyForm: UseFormReturn<PolicyLogicyFormValues>; isLoading?: boolean}) => {
  const {
    fields,
    append: appendRule,
    remove: removeRule
  } = useFieldArray({
    control: policyForm.control,
    name: 'rules'
  });

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
      tasks: {
        task: '',
        action: RuleAction.RULE_ACTION_UNSPECIFIED
      }
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
                    {field.name ? (
                      <div className="w-full flex justify-between items-start gap-4">
                        <div className="w-full">
                          <Accordion title={field.name}>
                            <RuleForm isLoading={isLoading} fieldIndex={index} />
                          </Accordion>
                        </div>
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
                      </div>
                    ) : (
                      <RuleForm isLoading={isLoading} fieldIndex={index} />
                    )}
                  </div>
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
              disabled={isLoading || !policyForm.formState.isValid}
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
