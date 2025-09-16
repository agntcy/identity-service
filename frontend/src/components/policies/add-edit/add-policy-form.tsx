/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useState} from 'react';
import {StepperControls, StepperNavigation, StepperPanel, StepperStep, useStepper} from './stepper';
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
import {PolicyLogic} from './steps/policy-logic';
import {useCreatePolicy, useCreateRule} from '@/mutations';
import {PolicyLogicyFormValues, PolicyLogicySchema} from '@/schemas/policy-logic-schema';
import {generatePath, useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {PolicyReview} from './steps/policy-review';
import {useAnalytics} from '@/hooks';

export const AddPolicyForm = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tempPolicy, setTempPolicy] = useState<Policy | undefined>(undefined);

  const methods = useStepper();

  const navigate = useNavigate();

  const {analyticsTrack} = useAnalytics();

  const form = useForm<z.infer<typeof methods.current.schema>>({
    resolver: zodResolver(methods.current.schema),
    mode: 'all'
  });

  const policyLogicForm = useForm<PolicyLogicyFormValues>({
    resolver: zodResolver(PolicyLogicySchema),
    mode: 'all',
    defaultValues: {
      rules: [
        {
          name: '',
          description: '',
          needsApproval: false,
          action: RuleAction.RULE_ACTION_UNSPECIFIED,
          tasks: []
        }
      ]
    }
  });

  const mutationCreateRule = useCreateRule({
    callbacks: {
      onSuccess: () => {},
      onError: () => {}
    }
  });

  const mutationCreatePolicy = useCreatePolicy({
    callbacks: {
      onSuccess: async (resp) => {
        setTempPolicy(resp.data);
        if (resp.data) {
          await handleCreateRules(resp.data);
          toast({
            title: 'Success',
            description: 'Policy created successfully.',
            type: 'success'
          });
          const path = generatePath(PATHS.policies.info, {
            id: resp.data.id
          });
          void navigate(path, {replace: true});
          analyticsTrack('SAVE_POLICY', {
            policyId: resp.data.id,
            policyName: resp.data.name,
            assignedTo: resp.data.assignedTo
          });
        }
      },
      onError: () => {
        setTempPolicy(undefined);
        setIsLoading(false);
        toast({
          title: 'Error',
          description: 'An error occurred while adding the policy. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const handleCreateRules = useCallback(
    async (policy: Policy) => {
      const valuesPolicyLogic = policyLogicForm.getValues();
      if (valuesPolicyLogic?.rules?.length > 0 && policy.id) {
        try {
          await Promise.all(
            valuesPolicyLogic.rules.map((rule) => {
              if (rule.action !== RuleAction.RULE_ACTION_UNSPECIFIED) {
                return mutationCreateRule.mutateAsync({
                  id: policy.id,
                  data: {
                    name: rule.name,
                    description: rule.description,
                    needsApproval: rule.needsApproval,
                    tasks: [...rule.tasks],
                    action: rule.action
                  }
                });
              }
              return Promise.resolve();
            })
          );
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          toast({
            title: 'Error',
            description: 'An error occurred while adding the rules. Please try again.',
            type: 'error'
          });
        } finally {
          setIsLoading(false);
        }
      }
    },
    [policyLogicForm, mutationCreateRule]
  );

  const handleOnClear = useCallback(() => {
    setIsLoading(false);
    setTempPolicy(undefined);
    form.reset({
      name: '',
      description: '',
      assignedTo: ''
    });
    policyLogicForm.reset({
      rules: [
        {
          name: '',
          description: '',
          needsApproval: false,
          action: RuleAction.RULE_ACTION_UNSPECIFIED,
          tasks: []
        }
      ]
    });
    methods.reset();
    methods.resetMetadata();
    void navigate(PATHS.policies.base, {replace: true});
  }, [form, methods, navigate, policyLogicForm]);

  const handleSavePolicyForm = useCallback(() => {
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

  const handleSavePolicyLogicForm = useCallback(() => {
    const values = policyLogicForm.getValues();
    const validationResult = validateForm(PolicyLogicySchema, values);
    if (!validationResult.success) {
      toast({
        title: 'Error',
        description: 'Please fix the errors in the policy logic form.',
        type: 'error'
      });
      return;
    }
    methods.setMetadata('policyLogic', {
      ...methods.getMetadata('policyLogic'),
      rules: values.rules
    });
    methods.next();
  }, [methods, policyLogicForm]);

  const handleSave = useCallback(async () => {
    const valuesPolicy = form.getValues() as PolicyFormValues;
    setIsLoading(true);
    analyticsTrack('CLICK_SAVE_NEW_POLICY');
    if (!tempPolicy) {
      mutationCreatePolicy.mutate({
        assignedTo: valuesPolicy.assignedTo,
        description: valuesPolicy.description,
        name: valuesPolicy.name
      });
    } else {
      await handleCreateRules(tempPolicy);
      toast({
        title: 'Success',
        description: 'Policy created successfully.',
        type: 'success'
      });
      const path = generatePath(PATHS.policies.info, {
        id: tempPolicy.id
      });
      void navigate(path, {replace: true});
    }
  }, [form, analyticsTrack, tempPolicy, mutationCreatePolicy, handleCreateRules, navigate]);

  const onSubmit = useCallback(() => {
    if (methods.current.id === 'policyForm') {
      return handleSavePolicyForm();
    }
    if (methods.current.id === 'policyLogic') {
      return handleSavePolicyLogicForm();
    }
    if (methods.current.id === 'policyReview') {
      return handleSave();
    }
  }, [handleSave, handleSavePolicyForm, handleSavePolicyLogicForm, methods]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <StepperPanel className="w-full">
            <Accordion
              type="single"
              collapsible
              className="w-full"
              defaultValue={methods.get('policyForm').id}
              value={methods.current.id}
            >
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
                            <Typography
                              variant="h6"
                              fontSize={18}
                              sx={(theme) => ({color: theme.palette.vars.baseTextStrong})}
                            >
                              {step.title}
                            </Typography>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {step.id === 'policyForm' ? (
                          <PolicyForm isLoading={isLoading} />
                        ) : step.id === 'policyLogic' ? (
                          <PolicyLogic isLoading={isLoading} policyLogicForm={policyLogicForm} />
                        ) : (
                          step.id === 'policyReview' && <PolicyReview />
                        )}
                        <div className="mt-4 flex justify-between items-center">
                          <div>
                            <Button
                              variant="tertariary"
                              onClick={() => {
                                analyticsTrack('CLICK_CANCEL_ADD_POLICY');
                                handleOnClear();
                              }}
                              disabled={isLoading}
                              sx={{
                                fontWeight: '600 !important'
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                          <StepperControls>
                            {!methods.isFirst && (
                              <Button
                                variant="outlined"
                                onClick={methods.prev}
                                disabled={isLoading}
                                sx={{
                                  fontWeight: '600 !important'
                                }}
                              >
                                Previous
                              </Button>
                            )}
                            <Button
                              loading={isLoading}
                              loadingPosition="start"
                              type="submit"
                              disabled={
                                isLoading ||
                                !form.formState.isValid ||
                                (methods.current.id === 'policyLogic' && !policyLogicForm.formState.isValid)
                              }
                              className="cursor-pointer"
                              sx={{
                                fontWeight: '600 !important'
                              }}
                            >
                              {methods.current.id === 'policyReview' ? 'Save' : 'Next'}
                            </Button>
                          </StepperControls>
                        </div>
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
