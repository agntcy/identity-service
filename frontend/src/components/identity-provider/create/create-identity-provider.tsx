/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useState} from 'react';
import {StepperControls, StepperNavigation, StepperPanel, StepperProvider, StepperStep, useStepper} from './stepper';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {ProviderInfo} from './steps/provider-info';
import {RegisterProvider} from './steps/register-provider';
import {Form} from '@/components/ui/form';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {Button, toast, Typography} from '@outshift/spark-design';
import {IdpType, IssuerSettings} from '@/types/api/settings';
import {IdentityProvidersFormValues, IdentityProvidersSchema} from '@/schemas/identity-provider-schema';
import {validateForm} from '@/lib/utils';
import {useSetIdentityProvider} from '@/mutations';

export const CreateIdentityProvider = () => {
  return (
    <StepperProvider variant="vertical" className="space-y-4">
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

  const mutationSetIdentityProvider = useSetIdentityProvider({
    callbacks: {
      onSuccess: () => {
        setIsLoading(false);
        toast({
          title: 'Success',
          description: 'Identity provider saved successfully.',
          type: 'success'
        });
      },
      onError: () => {
        setIsLoading(false);
        toast({
          title: 'Error',
          description: 'An error occurred while saving the identity provider. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const handleOnClear = useCallback(() => {
    setIsLoading(false);
    form.reset({
      provider: undefined,
      orgUrl: undefined,
      clientId: undefined,
      privateKey: undefined,
      hostname: undefined,
      integrationKey: undefined,
      secretKey: undefined
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
      orgUrl: values.orgUrl,
      clientId: values.clientId,
      privateKey: values.privateKey,
      hostname: values.hostname,
      integrationKey: values.integrationKey,
      secretKey: values.secretKey
    });
    methods.next();
  }, [form, methods]);

  const handleSave = useCallback(() => {
    setIsLoading(true);
    const values = form.getValues() as IdentityProvidersFormValues;
    const data: IssuerSettings = {
      idpType: values.provider
    };
    if (values.provider === IdpType.IDP_TYPE_DUO) {
      data.duoIdpSettings = {
        hostname: values.hostname,
        integrationKey: values.integrationKey,
        secretKey: values.secretKey
      };
    } else if (values.provider === IdpType.IDP_TYPE_OKTA) {
      data.oktaIdpSettings = {
        orgUrl: values.orgUrl,
        clientId: values.clientId,
        privateKey: values.privateKey
      };
    }
    mutationSetIdentityProvider.mutate({
      issuerSettings: {
        ...data
      }
    });
  }, [form, mutationSetIdentityProvider]);

  const onSubmit = useCallback(() => {
    if (methods.current.id === 'providerInfo') {
      return handleSelectProvider();
    }
    if (methods.current.id === 'registerProvider') {
      return handleSave();
    }
  }, [handleSave, handleSelectProvider, methods]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <StepperPanel className="w-full">
            <Accordion type="single" collapsible className="w-full" defaultValue={methods.get('providerInfo').id} value={methods.current.id}>
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
                        {step.id === 'providerInfo' ? (
                          <ProviderInfo isLoading={isLoading} />
                        ) : step.id === 'registerProvider' ? (
                          <RegisterProvider />
                        ) : null}
                        <div className="flex justify-between items-center">
                          <Button variant="tertariary" onClick={handleOnClear} disabled={isLoading}>
                            Cancel
                          </Button>
                          <StepperControls className="pt-4">
                            {!methods.isFirst && (
                              <Button variant="outlined" onClick={methods.prev} disabled={methods.isFirst || isLoading} className="cursor-pointer">
                                Previous
                              </Button>
                            )}
                            <Button
                              loading={isLoading}
                              loadingPosition="start"
                              type="submit"
                              disabled={isLoading || !form.formState.isValid}
                              className="cursor-pointer"
                            >
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
    </>
  );
};
