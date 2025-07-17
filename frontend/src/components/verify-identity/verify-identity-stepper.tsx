/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useEffect} from 'react';
import {StepperControls, StepperNavigation, StepperPanel, StepperProvider, StepperStep, useStepper} from './stepper';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Form} from '@/components/ui/form';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {Button, toast, Typography} from '@outshift/spark-design';
import {validateForm} from '@/lib/utils';
import {IconButton, Tooltip} from '@mui/material';
import {InfoIcon} from 'lucide-react';
import {VerifyIdentityForm} from './steps/verify-identity-form';
import {VerifyIdentityFormValues, VerifyIdentitySchema} from '@/schemas/verify-identity-schema';
import {useVerifyBadge} from '@/mutations/badge';
import {VerificationResults} from './steps/verification-results';
import {useAnalytics} from '@/hooks';
import {Badge} from '@/types/api/badge';
import {parseJwt} from '@/utils/utils';
import {Card} from '../ui/card';
import {LoaderRelative} from '../ui/loading';
import {useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';

export const VerifyIdentityStepper = ({badge}: {badge?: Badge}) => {
  return (
    <StepperProvider variant="vertical">
      <FormStepperComponent badge={badge} />
    </StepperProvider>
  );
};
const FormStepperComponent = ({badge}: {badge?: Badge}) => {
  const methods = useStepper();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof methods.current.schema>>({
    resolver: zodResolver(methods.current.schema),
    mode: 'all'
  });

  const {analyticsTrack} = useAnalytics();

  const verifyIdentityMutation = useVerifyBadge({
    callbacks: {
      onSuccess: (resp) => {
        methods.setMetadata('verficationResults', {
          results: resp.data
        });
        toast({
          title: 'Badge verified successfully',
          description: 'The badge has been verified successfully, check the results below.',
          type: 'success'
        });
        methods.goTo('verficationResults');
      },
      onError: () => {
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
      badge: '',
      file: undefined,
      badgeContent: '',
      proofValue: ''
    });
    methods.reset();
    methods.resetMetadata();
    methods.goTo('verifyIdentityForm');
    void navigate(PATHS.verifyIdentity.base, {replace: true});
  }, [form, methods, navigate]);

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
    analyticsTrack('CLICK_VERIFY_IDENTITY_VERIFY');
    verifyIdentityMutation.mutate({
      badge: values.proofValue
    });
  }, [analyticsTrack, form, verifyIdentityMutation]);

  const onSubmit = useCallback(() => {
    if (methods.current.id === 'verifyIdentityForm') {
      return handleVerifyBadge();
    }
    if (methods.current.id === 'verficationResults') {
      return handleOnClear();
    }
  }, [handleOnClear, handleVerifyBadge, methods]);

  useEffect(() => {
    if (badge?.verifiableCredential) {
      const VC = badge.verifiableCredential;
      const proofValue = VC?.proof?.proofValue;
      const decodeJwt = parseJwt(proofValue || '');
      if (proofValue && decodeJwt) {
        form.reset({
          proofValue: proofValue
        });
        handleVerifyBadge();
      } else {
        handleOnClear();
        toast({
          title: 'Invalid Badge',
          description: 'The field does not contain a valid badge.',
          type: 'error'
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badge]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <StepperPanel className="w-full">
            <Accordion
              type="single"
              collapsible
              className="w-full"
              defaultValue={methods.get('verifyIdentityForm').id}
              value={methods.current.id}
            >
              {methods.all.map((step) => {
                return (
                  <div className="flex gap-2 items-top -ml-1" key={step.id}>
                    <StepperNavigation>
                      <StepperStep
                        of={step.id}
                        onlyIcon
                        isLoading={methods.current.id === step.id && verifyIdentityMutation.isPending}
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
                            {step.id === 'verifyIdentityForm' && (
                              <Tooltip title="The JOSE enveloped badge to verify" arrow placement="right">
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
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {step.id === 'verifyIdentityForm' ? (
                          badge && verifyIdentityMutation.isPending ? (
                            <Card variant="secondary">
                              <LoaderRelative />
                            </Card>
                          ) : (
                            <VerifyIdentityForm isLoading={verifyIdentityMutation.isPending} />
                          )
                        ) : (
                          step.id === 'verficationResults' && <VerificationResults />
                        )}
                        <StepperControls className="pt-4">
                          <Button
                            variant="tertariary"
                            onClick={() => {
                              analyticsTrack('CLICK_VERIFY_IDENTITY_CANCEL');
                              handleOnClear();
                            }}
                            sx={{
                              fontWeight: '600 !important'
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            loading={verifyIdentityMutation.isPending}
                            loadingPosition="start"
                            disabled={verifyIdentityMutation.isPending || !form.formState.isValid}
                            className="cursor-pointer"
                            sx={{
                              fontWeight: '600 !important'
                            }}
                          >
                            {methods.isLast ? 'Done' : 'Verify'}
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
