/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback} from 'react';
import {StepperControls, StepperNavigation, StepperPanel, StepperProvider, StepperStep, useStepper} from './stepper';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Form} from '@/components/ui/form';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {Button, toast, Typography} from '@outshift/spark-design';
import {AgenticServicForm} from './steps/agentic-service-form';
import {ConfirmInfo} from './steps/confirm-info';
import {AgenticServiceFormValues, AgenticServiceSchema} from '@/schemas/agentic-service-schema';
import {validateForm} from '@/lib/utils';
import {useCreateAgenticService} from '@/mutations';
import {generatePath, useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {useAnalytics} from '@/hooks';

export const AddAgenticServiceStepper = () => {
  return (
    <StepperProvider variant="vertical">
      <FormStepperComponent />
    </StepperProvider>
  );
};

const FormStepperComponent = () => {
  const methods = useStepper();

  const navigate = useNavigate();

  const {analyticsTrack} = useAnalytics();

  const form = useForm<z.infer<typeof methods.current.schema>>({
    resolver: zodResolver(methods.current.schema),
    mode: 'all'
  });

  const mutationCreate = useCreateAgenticService({
    callbacks: {
      onSuccess: (resp) => {
        analyticsTrack('SAVE_AGENTIC_SERVICE ', {
          serviceType: resp.data.type,
          serviceId: resp.data.id,
          serviceName: resp.data.name
        });
        toast({
          title: 'Success',
          description: 'Agentic service added successfully.',
          type: 'success'
        });
        const path = generatePath(PATHS.agenticServices.info.base, {
          id: resp.data.id
        });
        void navigate(path, {replace: true});
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to add agentic service. Please check the details and try again.',
          type: 'error'
        });
      }
    }
  });

  const handleOnClear = useCallback(() => {
    form.reset({
      type: undefined,
      name: undefined,
      description: undefined,
      oasfSpecs: undefined,
      mcpServer: undefined,
      oasfSpecsContent: undefined,
      wellKnownServer: undefined
    });
    methods.reset();
    methods.resetMetadata();
    void navigate(PATHS.agenticServices.base, {replace: true});
  }, [form, methods, navigate]);

  const handleSelectAgenticService = useCallback(() => {
    const values = form.getValues() as AgenticServiceFormValues;
    const validationResult = validateForm(AgenticServiceSchema, values);
    if (!validationResult.success) {
      validationResult.errors?.forEach((error) => {
        const fieldName = error.path[0] as keyof z.infer<typeof AgenticServiceSchema>;
        form.setError(fieldName, {type: 'manual', ...error});
      });
      return;
    }
    methods.setMetadata('agenticServiceForm', {
      ...methods.getMetadata('agenticServiceForm'),
      type: values.type,
      name: values.name,
      description: values.description
    });
    methods.next();
  }, [form, methods]);

  const handleSave = useCallback(() => {
    const values = form.getValues() as AgenticServiceFormValues;
    analyticsTrack('CLICK_SAVE_NEW_AGENTIC_SERVICE', {
      type: values.type,
      name: values.name
    });
    mutationCreate.mutate({
      type: values.type,
      name: values.name,
      description: values.description
    });
  }, [analyticsTrack, form, mutationCreate]);

  const onSubmit = useCallback(() => {
    if (methods.current.id === 'agenticServiceForm') {
      return handleSelectAgenticService();
    }
    if (methods.current.id === 'confirmAgenticService') {
      return handleSave();
    }
  }, [handleSave, handleSelectAgenticService, methods]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <StepperPanel className="w-full">
            <Accordion
              type="single"
              collapsible
              className="w-full"
              defaultValue={methods.get('agenticServiceForm').id}
              value={methods.current.id}
            >
              {methods.all.map((step) => {
                return (
                  <div className="flex gap-2 items-top -ml-1" key={step.id}>
                    <StepperNavigation>
                      <StepperStep
                        of={step.id}
                        onlyIcon
                        isLoading={methods.current.id === step.id && mutationCreate.isPending}
                      />
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
                        {step.id === 'agenticServiceForm' ? (
                          <AgenticServicForm isLoading={mutationCreate.isPending} />
                        ) : step.id === 'confirmAgenticService' ? (
                          <ConfirmInfo />
                        ) : null}
                        <div className="flex justify-between items-center mt-4">
                          <div>
                            <Button
                              sx={{
                                fontWeight: '600 !important'
                              }}
                              variant="tertariary"
                              onClick={handleOnClear}
                              disabled={mutationCreate.isPending}
                            >
                              Cancel
                            </Button>
                          </div>
                          <StepperControls>
                            {!methods.isFirst && (
                              <Button
                                sx={{
                                  fontWeight: '600 !important'
                                }}
                                variant="outlined"
                                onClick={methods.prev}
                                disabled={mutationCreate.isPending}
                              >
                                Previous
                              </Button>
                            )}
                            <Button
                              loading={mutationCreate.isPending}
                              loadingPosition="start"
                              type="submit"
                              disabled={mutationCreate.isPending || !form.formState.isValid}
                              className="cursor-pointer"
                              sx={{
                                fontWeight: '600 !important'
                              }}
                            >
                              {methods.current.id === 'confirmAgenticService' ? 'Save' : 'Next'}
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
