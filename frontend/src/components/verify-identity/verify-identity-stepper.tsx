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
import {validateForm} from '@/lib/utils';
import {IconButton} from '@mui/material';
import {InfoIcon} from 'lucide-react';
import {VerifyIdentityForm} from './steps/verify-identity-form';
import {VerifyIdentityFormValues, VerifyIdentitySchema} from '@/schemas/verify-identity-schema';
import {useVerifyBadge} from '@/mutations/badge';
import {VerificationResults} from './steps/verification-results';

export const VerifyIdentityStepper = () => {
  return (
    <StepperProvider variant="vertical">
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

  const verifyIdentityMutation = useVerifyBadge({
    callbacks: {
      onSuccess: (resp) => {
        methods.setMetadata('verficationResults', {
          badgeClaims: resp.data
        });
        toast({
          title: 'Badge verified successfully',
          description: 'The badge has been verified successfully, check the results below.',
          type: 'success'
        });
        setIsLoading(false);
        methods.next();
      },
      onError: () => {
        setIsLoading(false);
        toast({
          title: 'Error verifying badge',
          description: 'There was an error verifying the badge. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const handleOnClear = useCallback(() => {
    form.reset({
      badgeId: '',
      file: undefined,
      badgeContent: ''
    });
    methods.reset();
    methods.resetMetadata();
    methods.goTo('verifyIdentityForm');
  }, [form, methods]);

  const handleVerifyBadge = useCallback(() => {
    const values = form.getValues() as VerifyIdentityFormValues;
    const validationResult = validateForm(VerifyIdentitySchema, values);
    if (!validationResult.success) {
      validationResult.errors?.forEach((error) => {
        const fieldName = error.path[0] as keyof z.infer<typeof VerifyIdentitySchema>;
        form.setError(fieldName, {type: 'manual', ...error});
      });
      return;
    }
    setIsLoading(true);
    methods.setMetadata('verifyIdentityForm', {
      ...methods.getMetadata('verifyIdentityForm'),
      badgeContent: values.badgeContent,
      badgeFile: values.badgeFile,
      badgeId: values.badgeId,
      joseEnvelope: values.joseEnvelope
    });
    verifyIdentityMutation.mutate({
      badge: values.badgeId ? values.badgeId : values.joseEnvelope
    });
  }, [form, methods, verifyIdentityMutation]);

  const onSubmit = useCallback(() => {
    if (methods.current.id === 'verifyIdentityForm') {
      return handleVerifyBadge();
    }
    if (methods.current.id === 'verficationResults') {
      return handleOnClear();
    }
  }, [handleOnClear, handleVerifyBadge, methods]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <StepperPanel className="w-full">
            <Accordion type="single" collapsible className="w-full" defaultValue={methods.get('verifyIdentityForm').id} value={methods.current.id}>
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
                            {step.id === 'verifyIdentityForm' && (
                              <Tooltip title="JOSE envelope" arrow placement="top">
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
                            )}
                          </div>
                          <Typography variant="body2">{step.description}</Typography>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {step.id === 'verifyIdentityForm' ? (
                          <VerifyIdentityForm isLoading={isLoading} />
                        ) : (
                          step.id === 'verficationResults' && <VerificationResults />
                        )}
                        <div className="flex justify-between items-center">
                          <Button variant="tertariary" onClick={handleOnClear}>
                            Cancel
                          </Button>
                          <StepperControls className="pt-4">
                            <Button
                              type="submit"
                              loading={isLoading}
                              loadingPosition="start"
                              disabled={isLoading || !form.formState.isValid}
                              className="cursor-pointer"
                            >
                              {methods.isLast ? 'Done' : 'Verify'}
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
