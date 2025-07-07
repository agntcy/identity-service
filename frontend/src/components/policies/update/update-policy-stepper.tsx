/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useEffect, useState} from 'react';
import {StepperControls, StepperNavigation, StepperPanel, StepperProvider, StepperStep, useStepper} from './stepper';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Form} from '@/components/ui/form';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {Button, toast, Typography} from '@outshift/spark-design';
import {validateForm} from '@/lib/utils';
import {PolicyForm} from './steps/policy-form';
import {PolicyFormValues, PolicySchema} from '@/schemas/policy-schema';
import {Policy, RuleAction} from '@/types/api/policy';
import {useCreateRule, useDeleteRule, useUpdatePolicy, useUpdateRule} from '@/mutations';
import {PolicyLogicyFormValues, PolicyLogicySchema} from '@/schemas/policy-logic-schema';
import {useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {PolicyLogic} from './steps/policy-logic';

export const UpdatePolicyStepper = ({policy}: {policy?: Policy}) => {
  return (
    <StepperProvider variant="vertical">
      <FormStepperComponent policy={policy} />
    </StepperProvider>
  );
};

const FormStepperComponent = ({policy}: {policy?: Policy}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [flagCreateRules, setFlagCreateRules] = useState(true);

  const methods = useStepper();

  const navigate = useNavigate();

  const form = useForm<z.infer<typeof methods.current.schema>>({
    resolver: zodResolver(methods.current.schema),
    mode: 'all',
    defaultValues: {
      name: policy?.name || '',
      description: policy?.description || '',
      assignedTo: policy?.assignedTo || ''
    }
  });

  const policyLogicForm = useForm<PolicyLogicyFormValues>({
    resolver: zodResolver(PolicyLogicySchema),
    mode: 'all',
    defaultValues: {
      rules: policy?.rules?.map((rule) => ({
        ruleId: rule.id,
        name: rule.name,
        description: rule.description || '',
        needsApproval: rule.needsApproval,
        tasks: {
          action: rule.action,
          tasks: rule?.tasks?.map((task) => task.id) || []
        }
      }))
    }
  });

  const mutationDeleteRule = useDeleteRule();
  const mutationUpdateRule = useUpdateRule();
  const mutationCreateRule = useCreateRule();

  const mutationUpdatePolicy = useUpdatePolicy({
    callbacks: {
      onSuccess: (resp) => {
        void handleUpdateRules(resp.data);
      },
      onError: () => {
        setIsLoading(false);
        toast({
          title: 'Error',
          description: 'An error occurred while updating the policy. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const handleUpdateRules = useCallback(
    async (policy: Policy) => {
      const valuesPolicyLogic = policyLogicForm.getValues();
      const rulesIds = (methods.getMetadata('policyLogic')?.rulesIds as string[]) || [];
      if (valuesPolicyLogic.rules.length > 0 && policy.id && rulesIds) {
        try {
          await Promise.all(
            rulesIds?.map((ruleId) => {
              return mutationDeleteRule.mutateAsync({
                policyId: policy.id || '',
                ruleId
              });
            })
          );
          await Promise.all(
            valuesPolicyLogic.rules.map((rule) => {
              if (rule.tasks.action !== RuleAction.RULE_ACTION_UNSPECIFIED) {
                if (rule.ruleId) {
                  return mutationUpdateRule.mutateAsync({
                    policyId: policy.id || '',
                    ruleId: rule.ruleId,
                    data: {
                      name: rule.name,
                      description: rule.description,
                      needsApproval: rule.needsApproval,
                      tasks: [...rule.tasks.tasks],
                      action: rule.tasks.action
                    }
                  });
                } else {
                  return mutationCreateRule.mutateAsync({
                    id: policy.id,
                    data: {
                      name: rule.name,
                      description: rule.description,
                      needsApproval: rule.needsApproval,
                      tasks: [...rule.tasks.tasks],
                      action: rule.tasks.action
                    }
                  });
                }
              }
              return Promise.resolve();
            })
          );
          toast({
            title: 'Success',
            description: `Policy "${policy.name}" and its rules updated successfully.`,
            type: 'success'
          });
          void navigate(PATHS.policies.base, {replace: true});
        } catch (error) {
          toast({
            title: 'Error',
            description: 'An error occurred while updating the rules. Please try again.',
            type: 'error'
          });
        } finally {
          setIsLoading(false);
        }
      }
    },
    [policyLogicForm, methods, navigate, mutationDeleteRule, mutationUpdateRule, mutationCreateRule]
  );

  const handleOnCancel = useCallback(() => {
    void navigate(PATHS.policies.base, {replace: true});
  }, [navigate]);

  const handleUpdatePolicyForm = useCallback(() => {
    const values = form.getValues() as PolicyFormValues;
    const validationResult = validateForm(PolicySchema, values);
    if (!validationResult.success) {
      validationResult.errors?.forEach((error) => {
        const fieldName = error.path[0] as keyof z.infer<typeof PolicySchema>;
        form.setError(fieldName, {type: 'manual', ...error});
      });
      return;
    }
    methods.setMetadata('policyForm', {
      ...methods.getMetadata('policyForm'),
      name: values.name,
      description: values.description,
      assignedTo: values.assignedTo
    });
    methods.next();
  }, [form, methods]);

  const handleUpdate = useCallback(() => {
    const valuesPolicy = form.getValues() as PolicyFormValues;
    setIsLoading(true);
    mutationUpdatePolicy.mutate({
      id: policy?.id || '',
      data: {
        name: valuesPolicy.name,
        description: valuesPolicy.description,
        assignedTo: valuesPolicy.assignedTo
      }
    });
  }, [form, mutationUpdatePolicy, policy?.id]);

  const onSubmit = useCallback(() => {
    if (methods.current.id === 'policyForm') {
      return handleUpdatePolicyForm();
    }
    if (methods.current.id === 'policyLogic') {
      return handleUpdate();
    }
  }, [handleUpdate, handleUpdatePolicyForm, methods]);

  useEffect(() => {
    form.reset({
      name: policy?.name || '',
      description: policy?.description || '',
      assignedTo: policy?.assignedTo || ''
    });
    policyLogicForm.reset({
      rules:
        policy?.rules?.map((rule) => ({
          ruleId: rule.id,
          name: rule.name,
          description: rule.description || '',
          needsApproval: rule.needsApproval,
          tasks: {
            action: rule.action,
            tasks: rule?.tasks?.map((task) => task.id) || []
          }
        })) || []
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policy]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <StepperPanel className="w-full">
            <Accordion type="single" collapsible className="w-full" defaultValue={methods.get('policyForm').id} value={methods.current.id}>
              {methods.all.map((step) => {
                return (
                  <div className="flex gap-2 items-top -ml-1" key={step.id}>
                    <StepperNavigation>
                      <StepperStep of={step.id} onlyIcon isLoading={methods.current.id === step.id && isLoading} />
                    </StepperNavigation>
                    <AccordionItem value={step.id} className="border-b-0 w-full">
                      <AccordionTrigger className="pt-0 w-full cursor-default" useArrow={false}>
                        <div className="w-full -mt-[3px]">
                          <div className="flex items-center gap-2">
                            <Typography variant="h6" fontSize={18} sx={(theme) => ({color: theme.palette.vars.baseTextStrong})}>
                              {step.title}
                            </Typography>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {step.id === 'policyForm' ? (
                          <PolicyForm isLoading={isLoading} />
                        ) : step.id === 'policyLogic' ? (
                          <PolicyLogic policyLogicForm={policyLogicForm} isLoading={isLoading} />
                        ) : null}
                        <StepperControls className="pt-4">
                          <Button
                            variant="tertariary"
                            onClick={handleOnCancel}
                            disabled={isLoading}
                            sx={{
                              fontWeight: '600 !important'
                            }}
                          >
                            Cancel
                          </Button>
                          {!methods.isFirst && (
                            <Button
                              variant="secondary"
                              onClick={() => methods.prev()}
                              disabled={isLoading}
                              sx={{
                                fontWeight: '600 !important'
                              }}
                            >
                              Previous
                            </Button>
                          )}
                          <Button
                            loading={isLoading && flagCreateRules}
                            loadingPosition="start"
                            type="submit"
                            disabled={
                              isLoading || !form.formState.isValid || (methods.current.id === 'policyLogic' && !policyLogicForm.formState.isValid)
                            }
                            className="cursor-pointer"
                            sx={{
                              fontWeight: '600 !important'
                            }}
                          >
                            {methods.current.id === 'policyLogic' ? 'Update Policy and Rules' : 'Next'}
                          </Button>
                        </StepperControls>
                      </AccordionContent>
                    </AccordionItem>
                  </div>
                );
              })}
            </Accordion>
          </StepperPanel>
        </form>
      </Form>
    </>
  );
};
