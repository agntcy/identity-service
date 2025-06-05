/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useEffect, useState} from 'react';
import {StepperControls, StepperNavigation, StepperPanel, StepperProvider, StepperStep, useStepper} from './stepper';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {Card} from '../ui/card';
import {Separator} from '../ui/separator';
import {z} from 'zod';
import {Form} from '../ui/form';
import {LoaderRelative} from '../ui/loading';
import {Button} from '../ui/button';
import {validateForm} from '@/lib/utils';
import {useShallow} from 'zustand/react/shallow';
import {useStore} from '@/store';
import {toast} from 'sonner';
import {useNavigate} from 'react-router-dom';
import {
  IdentityProvidersFormValues,
  IdentityProvidersSchema,
  PasswordManagmentProviderFormValues,
  PasswordManagmentProviderSchema
} from '@/schemas/identity-provider-schema';
import {ProviderInfo} from './steps/provider-info';
import {PasswordManagment} from './steps/password-managment';
import {PATHS} from '@/router/paths';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '../ui/accordion';

export const CreateUpdateIdentityProvider: React.FC = () => {
  return (
    <StepperProvider variant="vertical" className="space-y-4">
      <FormStepperComponent />
    </StepperProvider>
  );
};

const FormStepperComponent: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const methods = useStepper();
  const navigate = useNavigate();

  const {identityProvider, passwordManagementProvider, setIdentityProvider, setPasswordManagementProvider} = useStore(
    useShallow((store) => ({
      identityProvider: store.identityProvider,
      passwordManagementProvider: store.passwordManagementProvider,
      setIdentityProvider: store.setIdentityProvider,
      setPasswordManagementProvider: store.setPasswordManagementProvider
    }))
  );

  const form = useForm<z.infer<typeof methods.current.schema>>({
    resolver: zodResolver(methods.current.schema),
    mode: 'all'
  });

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
    setIsLoading(true);
    methods.next();
    const values = form.getValues() as PasswordManagmentProviderFormValues;
    const validationResult = validateForm(PasswordManagmentProviderSchema, values);
    if (!validationResult.success) {
      validationResult.errors?.forEach((error) => {
        const fieldName = error.path[0] as keyof z.infer<typeof PasswordManagmentProviderSchema>;
        form.setError(fieldName, {type: 'manual', ...error});
      });
      return;
    }
    methods.setMetadata('passwordManagement', {...methods.getMetadata('passwordManagement'), manager: values.manager});
    const identityProvider = methods.getMetadata('providerInfo');
    setTimeout(() => {
      setPasswordManagementProvider(values.manager);
      setIdentityProvider({
        provider: identityProvider?.provider,
        issuer: identityProvider?.issuer,
        clientId: identityProvider?.clientId,
        clientSecret: identityProvider?.clientSecret
      });
      toast.success('Identity provider connected successfully');
      setIsLoading(false);
      // void navigate(PATHS.verifiableCredentials, {replace: true});
    }, 2500);
  }, [form, methods, setIdentityProvider, setPasswordManagementProvider]);

  const onSubmit = useCallback(() => {
    if (methods.current.id === 'providerInfo') {
      return handleSelectProvider();
    }
    if (methods.current.id === 'passwordManagement') {
      return handleSave();
    }
  }, [handleSave, handleSelectProvider, methods]);

  useEffect(() => {
    methods.setMetadata('providerInfo', {
      ...methods.getMetadata('providerInfo'),
      provider: identityProvider?.provider,
      issuer: identityProvider?.issuer,
      clientId: identityProvider?.clientId,
      clientSecret: identityProvider?.clientSecret
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identityProvider]);

  useEffect(() => {
    methods.setMetadata('passwordManagement', {...methods.getMetadata('passwordManagement'), manager: passwordManagementProvider});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passwordManagementProvider]);

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex gap-4">
            <StepperNavigation>
              {methods.all.map((step) => {
                return <StepperStep key={step.id} of={step.id} onlyIcon isLoading={isLoading && step.id === 'last'} />;
              })}
            </StepperNavigation>
            <StepperPanel className="w-full">
              {isLoading ? (
                <ContainerStepper useAccordion={false}>
                  <div className="flex items-center	h-full">
                    <LoaderRelative />
                  </div>
                </ContainerStepper>
              ) : (
                methods.switch({
                  providerInfo: (step) => (
                    <ContainerStepper title={step.title} description={step.description}>
                      <ProviderInfo />
                    </ContainerStepper>
                  ),
                  passwordManagement: (step) => (
                    <ContainerStepper title={step.title} description={step.description}>
                      <PasswordManagment />
                    </ContainerStepper>
                  )
                })
              )}
            </StepperPanel>
          </div>
          <StepperControls className="pt-4">
            <Button variant="secondary" onClick={methods.prev} disabled={methods.isFirst || isLoading} className="cursor-pointer">
              Previous
            </Button>
            <Button type="submit" disabled={isLoading || !form.formState.isValid} className="cursor-pointer">
              {methods.isLast ? 'Save' : 'Next'}
            </Button>
          </StepperControls>
        </form>
      </Form>
    </Card>
  );
};

const ContainerStepper: React.FC<React.PropsWithChildren & {title?: string; description?: string; useAccordion?: boolean}> = ({
  children,
  title,
  description,
  useAccordion = true
}) => {
  const [value, setValue] = useState('1');

  if (!useAccordion) {
    return (
      <div className="w-full h-full flex -ml-1">
        <Separator orientation="vertical" className="h-full w-[1px] mr-4" />
        <div className="w-full">{children}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex -ml-2">
      <Separator orientation="vertical" className="h-full w-[1px] mr-4" />
      <Accordion type="single" className="w-full" value={value} onValueChange={setValue} collapsible>
        <AccordionItem value="1">
          <AccordionTrigger className="pt-0">
            <div>
              <p className="text-[#00142B] text-[18px] font-bold">{title}</p>
              <p className="text-muted-foreground text-[12px]">{description}</p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="w-full">{children}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
