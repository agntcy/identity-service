/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Form} from '@/components/ui/form';
import {IdpType, IssuerSettings} from '@/types/api/settings';
import {IdentityProvidersFormValues, IdentityProvidersSchema} from '@/schemas/identity-provider-schema';
import {validateForm} from '@/lib/utils';
import {useSetIdentityProvider} from '@/mutations';
import {Button, toast} from '@open-ui-kit/core';
import {IdentityProviderForm} from './form/identity-provider-form';
import {useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {useAnalytics} from '@/hooks';
import {useSettingsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';

export const CreateIdentityProvider = () => {
  const form = useForm<IdentityProvidersFormValues>({
    resolver: zodResolver(IdentityProvidersSchema),
    mode: 'all'
  });

  const navigate = useNavigate();

  const {analyticsTrack} = useAnalytics();

  const {isEmptyIdp, issuerSettings} = useSettingsStore(
    useShallow((state) => ({
      isEmptyIdp: state.isEmptyIdp,
      issuerSettings: state.issuerSettings
    }))
  );

  const mutationSetIdentityProvider = useSetIdentityProvider({
    callbacks: {
      onSuccess: (resp) => {
        analyticsTrack('SAVE_IDENTITY_PROVIDER_CONNECTION', {
          identityProvider: resp.data.idpType
        });
        toast({
          title: 'Success',
          description: 'Identity provider connected successfully.',
          type: 'success'
        });
        void navigate(PATHS.settings.base, {replace: true});
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
      apiKey: undefined,
      baseUrl: undefined,
      realm: undefined,
      client: undefined,
      clientSecret: undefined
    });
  }, [form]);

  const handleSave = useCallback(() => {
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
    } else if (values.provider === IdpType.IDP_TYPE_KEYCLOAK) {
      data.keycloakIdpSettings = {
        baseUrl: values.baseUrl?.replace(/\/$/, ''),
        realm: values.realm,
        clientId: values.client,
        clientSecret: values.clientSecret
      };
    }
    analyticsTrack('CLICK_SAVE_NEW_IDENTITY_PROVIDER', {
      type: values.provider
    });
    mutationSetIdentityProvider.mutate({
      issuerSettings: {
        ...data
      }
    });
  }, [analyticsTrack, form, mutationSetIdentityProvider]);

  const onSubmit = useCallback(() => {
    handleSave();
  }, [handleSave]);

  useEffect(() => {
    if (issuerSettings) {
      form.reset({
        provider: issuerSettings.idpType,
        // okta
        orgUrl: issuerSettings.oktaIdpSettings?.orgUrl,
        clientId: issuerSettings.oktaIdpSettings?.clientId,
        privateKey: undefined,
        // duo
        hostname: issuerSettings.duoIdpSettings?.hostname,
        integrationKey: issuerSettings.duoIdpSettings?.integrationKey,
        secretKey: undefined,
        // ory
        projectSlug: issuerSettings.oryIdpSettings?.projectSlug,
        apiKey: undefined
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issuerSettings]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <IdentityProviderForm isLoading={mutationSetIdentityProvider.isPending} />
        <div className="flex justify-end gap-4 items-center">
          <Button
            variant="tertariary"
            onClick={() => {
              if (isEmptyIdp) {
                handleOnClear();
              } else {
                void navigate(PATHS.settings.base);
              }
            }}
            sx={{
              fontWeight: '600 !important'
            }}
            disabled={mutationSetIdentityProvider.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={mutationSetIdentityProvider.isPending}
            loadingPosition="start"
            disabled={mutationSetIdentityProvider.isPending || !form.formState.isValid}
            className="cursor-pointer"
            sx={{
              fontWeight: '600 !important'
            }}
          >
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
};
