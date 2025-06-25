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
import {Button, Card, toast, Typography} from '@outshift/spark-design';
import {AgenticServiceInfo} from './steps/agentic-service-info';
import {RegisterAgenticProvider} from './steps/register-agentic-provider';
import {AgenticServiceFormValues, AgenticServiceSchema} from '@/schemas/agentic-service-schema';
import {validateForm} from '@/lib/utils';
import {useCreateAgenticService} from '@/mutations';
import {useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';

export const CreateAgenticServiceStepper = () => {
  return (
    <StepperProvider variant="vertical" className="space-y-4 mt-2">
      <FormStepperComponent />
    </StepperProvider>
  );
};

const FormStepperComponent = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const methods = useStepper();

  const form = useForm<z.infer<typeof methods.current.schema>>({
    resolver: zodResolver(methods.current.schema),
    mode: 'all'
  });

  const navigate = useNavigate();

  const mutationCreate = useCreateAgenticService({
    callbacks: {
      onSuccess: (resp) => {
        setIsLoading(false);
        toast({
          title: 'Success',
          description: 'Agentic service created successfully.',
          type: 'success'
        });
        void navigate(PATHS.agenticServices);
      },
      onError: () => {
        setIsLoading(false);
        toast({
          title: 'Error',
          description: 'Failed to create agentic service. Please check the details and try again.',
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
      mcpServer: undefined
    });
    methods.reset();
    methods.resetMetadata();
    methods.goTo('agenticServiceInfo');
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
    methods.setMetadata('agenticServiceInfo', {
      ...methods.getMetadata('agenticServiceInfo'),
      type: values.type,
      name: values.name,
      description: values.description,
      oasfSpecs: values.oasfSpecs,
      mcpServer: values.mcpServer
    });
    methods.next();
  }, [form, methods]);

  const handleSave = useCallback(() => {
    setIsLoading(true);
    const values = form.getValues() as AgenticServiceFormValues;
    mutationCreate.mutate({
      type: values.type,
      name: values.name,
      description: values.description
    });
  }, [form, mutationCreate]);

  const onSubmit = useCallback(() => {
    if (methods.current.id === 'agenticServiceInfo') {
      return handleSelectAgenticService();
    }
    if (methods.current.id === 'registerAgenticService') {
      return handleSave();
    }
  }, [handleSave, handleSelectAgenticService, methods]);

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-1">
          <StepperPanel className="w-full">
            <Accordion type="single" collapsible className="w-full" defaultValue={methods.get('agenticServiceInfo').id} value={methods.current.id}>
              {methods.all.map((step) => {
                return (
                  <div className="flex gap-2 items-top -ml-1" key={step.id}>
                    <StepperNavigation>
                      <StepperStep of={step.id} onlyIcon isLoading={methods.current.id === step.id && isLoading} />
                    </StepperNavigation>
                    <AccordionItem value={step.id} className="border-b-0 w-full">
                      <AccordionTrigger className="pt-0 w-full cursor-default" useArrow={false}>
                        <div className="w-full -mt-[3px]">
                          <Typography variant="h6" fontSize={18} sx={(theme) => ({color: theme.palette.vars.baseTextStrong})}>
                            {step.title}
                          </Typography>
                          <Typography variant="body2">{step.description}</Typography>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {step.id === 'agenticServiceInfo' ? (
                          <AgenticServiceInfo isLoading={isLoading} />
                        ) : (
                          step.id === 'registerAgenticService' && <RegisterAgenticProvider isLoading={isLoading} />
                        )}
                        <div className="flex justify-between items-center">
                          <Button variant="tertariary" onClick={handleOnClear}>
                            Cancel
                          </Button>
                          <StepperControls className="pt-4">
                            {!methods.isFirst && (
                              <Button variant="outlined" onClick={methods.prev} disabled={methods.isFirst || isLoading} className="cursor-pointer">
                                Previous
                              </Button>
                            )}
                            <Button type="submit" disabled={isLoading || !form.formState.isValid} className="cursor-pointer">
                              {methods.isLast ? 'Save' : 'Next'}
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
    </Card>
  );
};
