/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useState} from 'react';
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
import {Policy} from '@/types/api/policy';
import {PolicyLogic} from './steps/policy-logic';
import {useCreatePolicy} from '@/mutations';
import {PolicyLogicyFormValues, PolicyLogicySchema} from '@/schemas/policy-logic-schema';

export const CreatePolicyStepper = () => {
  return (
    <StepperProvider variant="vertical">
      <FormStepperComponent />
    </StepperProvider>
  );
};

const FormStepperComponent = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [policy, setPolicy] = useState<Policy | undefined>(undefined);

  const methods = useStepper();

  const form = useForm<z.infer<typeof methods.current.schema>>({
    resolver: zodResolver(methods.current.schema),
    mode: 'all'
  });

  const policyLogicForm = useForm<PolicyLogicyFormValues>({
    resolver: zodResolver(PolicyLogicySchema),
    mode: 'all'
  });

  const mutationCreate = useCreatePolicy({
    callbacks: {
      onSuccess: (resp) => {
        setIsLoading(false);
        toast({
          title: 'Success',
          description: `Policy "${resp.data.name}" created successfully.`,
          type: 'success'
        });
        setPolicy(resp.data);
        methods.next();
      },
      onError: () => {
        setIsLoading(false);
        toast({
          title: 'Error',
          description: 'An error occurred while creating the policy. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const handleOnClear = useCallback(() => {
    setIsLoading(false);
    setPolicy(undefined);
    form.reset({
      name: '',
      description: '',
      assignedTo: ''
    });
    methods.reset();
    methods.resetMetadata();
    methods.goTo('policyForm');
  }, [form, methods]);

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

  const handleSave = useCallback(() => {
    // setIsLoading(true);
    // const values = form.getValues() as AgenticServiceFormValues;
    // mutationCreate.mutate({
    //   type: values.type,
    //   name: values.name,
    //   description: values.description
    // });
  }, [form, mutationCreate]);

  const onSubmit = useCallback(() => {
    if (methods.current.id === 'policyForm') {
      return handleSavePolicyForm();
    }
    // if (methods.current.id === 'confirmAgenticService') {
    //   return handleSave();
    // }
  }, [handleSavePolicyForm, methods]);

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
                          <PolicyLogic isLoading={isLoading} />
                        ) : null}
                        <StepperControls className="pt-4">
                          <Button
                            variant="tertariary"
                            onClick={handleOnClear}
                            disabled={isLoading}
                            sx={{
                              fontWeight: '600 !important'
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            loading={isLoading}
                            loadingPosition="start"
                            type="submit"
                            disabled={isLoading || !form.formState.isValid}
                            className="cursor-pointer"
                            sx={{
                              fontWeight: '600 !important'
                            }}
                          >
                            {methods.current.id === 'policyLogic' ? 'Save' : 'Next'}
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
