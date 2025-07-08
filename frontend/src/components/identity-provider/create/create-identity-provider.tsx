/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Form} from '@/components/ui/form';
import {IdpType, IssuerSettings} from '@/types/api/settings';
import {IdentityProvidersFormValues, IdentityProvidersSchema} from '@/schemas/identity-provider-schema';
import {validateForm} from '@/lib/utils';
import {useSetIdentityProvider} from '@/mutations';
import {Button, toast} from '@outshift/spark-design';
import {IdentityProviderForm} from './form/identity-provider-form';
import {useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';

export const CreateIdentityProvider = () => {
  const [navigateToAgenticServices, setNavigateToAgenticServices] = useState(false);

  const form = useForm<IdentityProvidersFormValues>({
    resolver: zodResolver(IdentityProvidersSchema),
    mode: 'all'
  });

  const navigate = useNavigate();

  const mutationSetIdentityProvider = useSetIdentityProvider({
    callbacks: {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Identity provider connected successfully.',
          type: 'success'
        });
        if (navigateToAgenticServices) {
          void navigate(PATHS.agenticServices.create, {replace: true});
        } else {
          void navigate(PATHS.settings.base, {replace: true});
        }
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to connect identity provider. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const handleOnClear = useCallback(() => {
    form.reset({
      provider: undefined,
      orgUrl: undefined,
      clientId: undefined,
      privateKey: undefined,
      hostname: undefined,
      integrationKey: undefined,
      secretKey: undefined,
      projectSlug: undefined,
      apiKey: undefined
    });
  }, [form]);

  const handleSave = useCallback(
    (navigateToCreate = false) => {
      const values = form.getValues();
      const validationResult = validateForm(IdentityProvidersSchema, values);
      if (!validationResult.success) {
        validationResult.errors?.forEach((error) => {
          const fieldName = error.path[0] as keyof z.infer<typeof IdentityProvidersSchema>;
          form.setError(fieldName, {type: 'manual', ...error});
        });
        return;
      }
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
          orgUrl: values.orgUrl?.replace(/\/$/, ''),
          clientId: values.clientId,
          privateKey: values.privateKey
        };
      } else if (values.provider === IdpType.IDP_TYPE_ORY) {
        data.oryIdpSettings = {
          apiKey: values.apiKey,
          projectSlug: values.projectSlug
        };
      }
      setNavigateToAgenticServices(navigateToCreate);
      mutationSetIdentityProvider.mutate({
        issuerSettings: {
          ...data
        }
      });
    },
    [form, mutationSetIdentityProvider]
  );

  const onSubmit = useCallback(() => {
    handleSave(false);
  }, [handleSave]);

  const onSubmitAndNavigate = useCallback(() => {
    handleSave(true);
  }, [handleSave]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <IdentityProviderForm isLoading={mutationSetIdentityProvider.isPending} />
        <div className="flex justify-end gap-4 items-center">
          <Button
            variant="tertariary"
            onClick={handleOnClear}
            sx={{
              fontWeight: '600 !important'
            }}
            disabled={mutationSetIdentityProvider.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={mutationSetIdentityProvider.isPending && !navigateToAgenticServices}
            loadingPosition="start"
            disabled={mutationSetIdentityProvider.isPending || !form.formState.isValid}
            className="cursor-pointer"
            sx={{
              fontWeight: '600 !important'
            }}
            variant="secondary"
          >
            Save
          </Button>
          <Button
            loading={mutationSetIdentityProvider.isPending && navigateToAgenticServices}
            loadingPosition="start"
            disabled={mutationSetIdentityProvider.isPending || !form.formState.isValid}
            className="cursor-pointer"
            sx={{
              fontWeight: '600 !important'
            }}
            onClick={onSubmitAndNavigate}
          >
            Save and Add Agentic Service
          </Button>
        </div>
      </form>
    </Form>
  );
};
