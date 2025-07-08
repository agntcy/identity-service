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
import {Button, toast, Tooltip, Typography} from '@outshift/spark-design';
import {AgenticServicForm} from './steps/agentic-service-form';
import {ConfirmAgenticProvider} from './steps/confirm-agentic-provider-info';
import {AgenticServiceFormValues, AgenticServiceSchema} from '@/schemas/agentic-service-schema';
import {validateForm} from '@/lib/utils';
import {useCreateAgenticService} from '@/mutations';
import {IconButton} from '@mui/material';
import {InfoIcon} from 'lucide-react';
import {App} from '@/types/api/app';
import {CreateBadge} from './steps/create-badge';

export const AddAgenticServiceStepper = () => {
  return (
    <StepperProvider variant="vertical">
      <FormStepperComponent />
    </StepperProvider>
  );
};

const FormStepperComponent = () => {
  const [app, setApp] = useState<App | undefined>(undefined);

  const methods = useStepper();

  const form = useForm<z.infer<typeof methods.current.schema>>({
    resolver: zodResolver(methods.current.schema),
    mode: 'all'
  });

  const mutationCreate = useCreateAgenticService({
    callbacks: {
      onSuccess: (resp) => {
        toast({
          title: 'Success',
          description: 'Agentic service added successfully.',
          type: 'success'
        });
        setApp(resp.data);
        methods.next();
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
    setApp(undefined);
    form.reset({
      type: undefined,
      name: undefined,
      description: undefined,
      oasfSpecs: undefined,
      mcpServer: undefined,
      oasfSpecsContent: undefined,
      wellKnowServer: undefined
    });
    methods.reset();
    methods.resetMetadata();
    methods.goTo('agenticServiceForm');
  }, [form, methods]);

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
    mutationCreate.mutate({
      type: values.type,
      name: values.name,
      description: values.description
    });
  }, [form, mutationCreate]);

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
            <Accordion type="single" collapsible className="w-full" defaultValue={methods.get('agenticServiceForm').id} value={methods.current.id}>
              {methods.all.map((step) => {
                return (
                  <div className="flex gap-2 items-top -ml-1" key={step.id}>
                    <StepperNavigation>
                      <StepperStep of={step.id} onlyIcon isLoading={methods.current.id === step.id && mutationCreate.isPending} />
                    </StepperNavigation>
                    <AccordionItem value={step.id} className="border-b-0 w-full">
                      <AccordionTrigger className="pt-0 w-full cursor-default" useArrow={false}>
                        <div className="w-full -mt-[3px]">
                          <div className="flex items-center gap-2">
                            <Typography variant="h6" fontSize={18} sx={(theme) => ({color: theme.palette.vars.baseTextStrong})}>
                              {step.title}
                            </Typography>
                            {step.id === 'createBadge' && (
                              <div className="flex gap-1 items-center">
                                <Tooltip title="You must be the Agentic service owner to create badges." arrow placement="top">
                                  <IconButton
                                    sx={(theme) => ({
                                      color: theme.palette.vars.baseTextDefault,
                                      width: '24px',
                                      height: '24px'
                                    })}
                                  >
                                    <InfoIcon className="w-4 h-4" />
                                  </IconButton>
                                </Tooltip>
                                <Typography variant="caption">| Optional</Typography>
                              </div>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {step.id === 'agenticServiceForm' ? (
                          <AgenticServicForm isLoading={mutationCreate.isPending} />
                        ) : step.id === 'confirmAgenticService' ? (
                          <ConfirmAgenticProvider />
                        ) : (
                          step.id === 'createBadge' && <CreateBadge app={app} />
                        )}
                        {methods.current.id !== 'createBadge' && (
                          <StepperControls className="pt-4">
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
                              {methods.current.id === 'confirmAgenticService' ? 'Save Agentic Service' : 'Next'}
                            </Button>
                          </StepperControls>
                        )}
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
