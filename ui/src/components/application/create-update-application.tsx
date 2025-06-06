/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useState} from 'react';
import {StepperControls, StepperNavigation, StepperPanel, StepperProvider, StepperStep, useStepper} from './stepper';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {Card} from '../ui/card';
import {z} from 'zod';
import {Form} from '../ui/form';
import {Button} from '../ui/button';
import {validateForm} from '@/lib/utils';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '../ui/accordion';
import {ApplicationType} from './steps/application-type';
import {SourceInfo} from './steps/source-info';
import {ApplicationTypeFormValues, ApplicationTypeSchema, SourceInformationFormValues, SourceInformationSchema} from '@/schemas/application-schema';
import {SaveApplication} from './steps/save-application';

interface CreateUpdateApplicationProps {
  mode?: 'create' | 'update';
}

export const CreateUpdateApplication: React.FC<CreateUpdateApplicationProps> = ({mode = 'create'}) => {
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

  const handleSelectType = useCallback(() => {
    const values = form.getValues() as ApplicationTypeFormValues;
    const validationResult = validateForm(ApplicationTypeSchema, values);
    if (!validationResult.success) {
      validationResult.errors?.forEach((error) => {
        const fieldName = error.path[0] as keyof z.infer<typeof ApplicationTypeSchema>;
        form.setError(fieldName, {type: 'manual', ...error});
      });
      return;
    }
    methods.setMetadata('applicationType', {
      ...methods.getMetadata('applicationType'),
      type: values.type
    });
    methods.next();
  }, [form, methods]);

  const handleSourceInfo = useCallback(() => {
    const values = form.getValues() as SourceInformationFormValues;
    const validationResult = validateForm(SourceInformationSchema, values);
    if (!validationResult.success) {
      validationResult.errors?.forEach((error) => {
        const fieldName = error.path[0] as keyof z.infer<typeof SourceInformationSchema>;
        form.setError(fieldName, {type: 'manual', ...error});
      });
      return;
    }
    methods.setMetadata('sourceInfo', {
      ...methods.getMetadata('sourceInfo'),
      type: values.type,
      text: values.text
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
    if (methods.current.id === 'applicationType') {
      return handleSelectType();
    } else if (methods.current.id === 'sourceInfo') {
      return handleSourceInfo();
    }
  }, [handleSelectType, handleSourceInfo, methods]);

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <StepperPanel className="w-full">
            <Accordion type="single" collapsible className="w-full" defaultValue={methods.get('applicationType').id} value={methods.current.id}>
              {methods.all.map((step) => {
                return (
                  <div className="flex gap-4 items-top -ml-1" key={step.id}>
                    <StepperNavigation>
                      <StepperStep of={step.id} onlyIcon />
                    </StepperNavigation>
                    <AccordionItem value={step.id} className="border-b-0 w-full">
                      <AccordionTrigger className="pt-0 w-full cursor-default" useArrow={false}>
                        <div className="w-full -mt-1">
                          <p className="text-[#00142B] text-[18px] font-bold">{step.title}</p>
                          <p className="text-muted-foreground text-[12px]">{step.description}</p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {step.id === 'applicationType' ? (
                          <ApplicationType isLoading={isLoading} />
                        ) : step.id === 'sourceInfo' ? (
                          <SourceInfo isLoading={isLoading} />
                        ) : step.id === 'saveApplication' ? (
                          <SaveApplication isLoading={isLoading} />
                        ) : null}
                        <StepperControls className="pt-4">
                          {!methods.isFirst && (
                            <Button variant="ghost" onClick={methods.prev} disabled={methods.isFirst || isLoading} className="cursor-pointer">
                              Previous
                            </Button>
                          )}
                          <Button type="submit" disabled={isLoading || !form.formState.isValid} className="cursor-pointer">
                            {methods.isLast ? 'Save' : 'Next'}
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
    </Card>
  );
};
