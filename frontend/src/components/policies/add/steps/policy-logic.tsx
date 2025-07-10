/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {Form} from '@/components/ui/form';
import {PlusIcon, XIcon} from 'lucide-react';
import {useCallback} from 'react';
import {useFieldArray, UseFormReturn} from 'react-hook-form';
import {Button, Divider, IconButton, Typography} from '@mui/material';
import {PolicyLogicyFormValues} from '@/schemas/policy-logic-schema';
import {Accordion, GeneralSize, Tag, Tooltip} from '@outshift/spark-design';
import {RuleAction} from '@/types/api/policy';
import {RuleForm} from './rule-form';
import {labels} from '@/constants/labels';
import {Separator} from '@/components/ui/separator';

export const PolicyLogic = ({isLoading = false, policyLogicForm}: {policyLogicForm: UseFormReturn<PolicyLogicyFormValues>; isLoading?: boolean}) => {
  const {
    fields,
    append: appendRule,
    remove: removeRule
  } = useFieldArray({
    control: policyLogicForm.control,
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
      needsApproval: false,
      tasks: {
        tasks: [],
        action: RuleAction.RULE_ACTION_UNSPECIFIED
      }
    });
  }, [appendRule]);

  return (
    <Card className="text-start py-4 rounded-[8px] p-[24px] space-y-6" variant="secondary">
      <div>
        <Typography variant="subtitle1" fontWeight={600}>
          Rules
        </Typography>
      </div>
      <CardContent className="p-0 space-y-6">
        <Form {...policyLogicForm}>
          {fields.map((field, index) => {
            return (
              <div key={field.id}>
                <div className="flex justify-between items-start gap-4">
                  <div className="w-full">
                    {field.name ? (
                      <div className="w-full flex justify-between items-start gap-4">
                        <div className="w-full">
                          <Accordion
                            title={field.name}
                            subTitle={
                              (
                                <div className="flex gap-4 items-center h-[24px] mt-1">
                                  <Separator orientation="vertical" />
                                  <Tag size={GeneralSize.Small}>{labels.rulesActions[field.tasks.action]}</Tag>
                                </div>
                              ) as any
                            }
                          >
                            <div className="pl-6">
                              <RuleForm isLoading={isLoading} fieldIndex={index} />
                            </div>
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
                      <div className="w-full">
                        {index > 0 && fields.length > 0 && (
                          <div className="flex justify-end">
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
                        )}
                        <RuleForm isLoading={isLoading} fieldIndex={index} />
                      </div>
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
              disabled={(isLoading || !policyLogicForm.formState.isValid) && fields.length > 0}
              onClick={handleAddRule}
            >
              Add Rule
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};
