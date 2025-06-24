/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useState} from 'react';
import {StepperControls, StepperNavigation, StepperPanel, StepperProvider, StepperStep, useStepper} from './stepper';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {validateForm} from '@/lib/utils';
import {IdentityProvidersFormValues, IdentityProvidersSchema} from '@/schemas/identity-provider-schema';
import {ProviderInfo} from './steps/provider-info';
import {RegisterProvider} from './steps/register-provider';
import {Form} from '@/components/ui/form';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {ActivityTimeline, Button, Typography} from '@outshift/spark-design';

export const CreateUpdateIdentityProvider = () => {
  return (
    <StepperProvider variant="vertical" className="space-y-4">
      <FormStepperComponent />
    </StepperProvider>
  );
};

const FormStepperComponent: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const methods = useStepper();

  const form = useForm<z.infer<typeof methods.current.schema>>({
    resolver: zodResolver(methods.current.schema),
    mode: 'all'
  });

  const handleOnClear = useCallback(() => {
    form.reset({
      type: undefined,
      provider: undefined,
      issuer: undefined,
      clientId: undefined,
      clientSecret: undefined
    });
    methods.reset();
    methods.resetMetadata();
    methods.goTo('providerInfo');
  }, [form, methods]);

  const handleSelectProvider = useCallback(() => {
    const values = form.getValues() as IdentityProvidersFormValues;
    const validationResult = validateForm(IdentityProvidersSchema, values);
    if (!validationResult.success) {
      validationResult.errors?.forEach((error) => {
        const fieldName = error.path[0] as keyof z.infer<typeof IdentityProvidersSchema>;
        form.setError(fieldName, {type: 'manual', ...error});
      });
      return;
    }
    methods.setMetadata('providerInfo', {
      ...methods.getMetadata('providerInfo'),
      provider: values.provider,
      issuer: values.issuer,
      clientId: values.clientId,
      clientSecret: values.clientSecret
    });
    methods.next();
  }, [form, methods]);

  const handleSave = useCallback(() => {
    // setIsLoading(true);
    // methods.next();
    // const values = form.getValues() as PasswordManagmentProviderFormValues;
    // const validationResult = validateForm(PasswordManagmentProviderSchema, values);
    // if (!validationResult.success) {
    //   validationResult.errors?.forEach((error) => {
    //     const fieldName = error.path[0] as keyof z.infer<typeof PasswordManagmentProviderSchema>;
    //     form.setError(fieldName, {type: 'manual', ...error});
    //   });
    //   return;
    // }
    // methods.setMetadata('passwordManagement', {...methods.getMetadata('passwordManagement'), manager: values.manager});
    // const identityProvider = methods.getMetadata('providerInfo');
    // setTimeout(() => {
    //   setPasswordManagementProvider(values.manager);
    //   setIdentityProvider({
    //     provider: identityProvider?.provider,
    //     issuer: identityProvider?.issuer,
    //     clientId: identityProvider?.clientId,
    //     clientSecret: identityProvider?.clientSecret
    //   });
    //   toast.success('Identity provider connected successfully');
    //   setIsLoading(false);
    //   // void navigate(PATHS.verifiableCredentials, {replace: true});
    // }, 2500);
  }, []);

  const onSubmit = useCallback(() => {
    if (methods.current.id === 'providerInfo') {
      return handleSelectProvider();
    }
  }, [handleSelectProvider, methods]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <StepperPanel className="w-full">
          <Accordion type="single" collapsible className="w-full" defaultValue={methods.get('providerInfo').id} value={methods.current.id}>
            {methods.all.map((step) => {
              return (
                <div className="flex gap-2 items-top -ml-1" key={step.id}>
                  <StepperNavigation>
                    <StepperStep of={step.id} onlyIcon />
                  </StepperNavigation>
                  <AccordionItem value={step.id} className="border-b-0 w-full">
                    <AccordionTrigger className="pt-0 w-full cursor-default" useArrow={false}>
                      <div className="w-full -mt-1">
                        <Typography variant="h6" fontSize={18} sx={(theme) => ({color: theme.palette.vars.baseTextStrong})}>
                          {step.title}
                        </Typography>
                        <Typography variant="body2">{step.description}</Typography>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {step.id === 'providerInfo' ? (
                        <ProviderInfo isLoading={isLoading} />
                      ) : step.id === 'registerProvider' ? (
                        <RegisterProvider isLoading={isLoading} />
                      ) : null}
                      <div className="flex justify-between items-center mt-2">
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
                            {methods.isLast ? 'Register' : 'Next'}
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
  );
};
