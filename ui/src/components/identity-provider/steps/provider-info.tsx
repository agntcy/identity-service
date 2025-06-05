/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {useStepper} from '../stepper';
import {useFormContext} from 'react-hook-form';
import {FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {useEffect} from 'react';
import {IdentityProvidersFormValues} from '@/schemas/identity-provider-schema';
import {SharedProvider, SharedProviderProps} from '@/components/shared/shared-provider';
import OktaLogo from '@/assets/okta.svg?react';
import DuoLogo from '@/assets/duo.png';
import {Input} from '@/components/ui/input';
import {PasswordInput} from '@/components/ui/password-input';
import {IdentityProviders} from '@/types/providers';

export const ProviderInfo = () => {
  const {control, reset} = useFormContext<IdentityProvidersFormValues>();
  const methods = useStepper();

  const identityProviders: SharedProviderProps<IdentityProviders>[] = [
    {
      type: IdentityProviders.OKTA,
      name: 'Okta',
      details: 'Identity and access management',
      imgURI: <OktaLogo className="w-12 h-12" />
    },
    {
      type: IdentityProviders.DUO,
      name: 'DUO',
      details: 'Multi-factor authentication',
      imgURI: <img src={DuoLogo} className="w-12 h-12" />
    }
  ];

  const metaData = methods.getMetadata('providerInfo');

  useEffect(() => {
    if (metaData) {
      reset({
        provider: metaData.provider ?? undefined,
        issuer: metaData.issuer ?? undefined,
        clientId: metaData.clientId ?? undefined,
        clientSecret: metaData.clientSecret ?? undefined
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaData]);

  return (
    <Card className="text-start py-4" variant="secondary">
      <CardContent className="px-4 space-y-4">
        <div className="space-y-2">
          <FormLabel className="text-start font-semibold text-[14px]">1. Identity Provider</FormLabel>
          <FormField
            control={control}
            name="provider"
            render={({field}) => (
              <FormItem>
                <FormControl>
                  <div className="card-group">
                    {identityProviders.map((provider, index) => (
                      <SharedProvider key={index} {...provider} isSelected={field.value === provider.type} onSelect={field.onChange} />
                    ))}
                  </div>
                </FormControl>
                <FormDescription className="text-[12px]">Select your identity provider.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-2">
          <FormLabel className="text-start font-semibold text-[14px]">2. Provider Details</FormLabel>
          <div className="space-y-2">
            <FormField
              control={control}
              name="issuer"
              render={({field}) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Issuer..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="clientId"
              render={({field}) => (
                <FormItem>
                  <FormControl>
                    <PasswordInput placeholder="Cliend ID..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="clientSecret"
              render={({field}) => (
                <FormItem>
                  <FormControl>
                    <PasswordInput placeholder="Cliend Secret..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
