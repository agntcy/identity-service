/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {useStepper} from '../stepper';
import {useFormContext} from 'react-hook-form';
import {FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {useEffect} from 'react';
import {IdentityProvidersFormValues} from '@/schemas/identity-provider-schema';
import {SharedProvider, SharedProviderProps} from '@/components/shared/shared-provider';
import {Input} from '@/components/ui/input';
import {PasswordInput} from '@/components/ui/password-input';
import {IdentityProviders} from '@/types/providers';
import {IconButton} from '@mui/material';
import {Link, Tooltip, Typography} from '@outshift/spark-design';
import {ExternalLinkIcon, InfoIcon} from 'lucide-react';
import DuoLogo from '@/assets/duo.svg?react';
import OktaLogo from '@/assets/okta.svg?react';
import OasfLogo from '@/assets/oasf.svg?react';

export const ProviderInfo = ({isLoading = false}: {isLoading?: boolean}) => {
  const {control, reset} = useFormContext<IdentityProvidersFormValues>();
  const methods = useStepper();

  const metaData = methods.getMetadata('providerInfo');

  const identityProviders: SharedProviderProps<IdentityProviders>[] = [
    {
      type: IdentityProviders.DUO,
      title: 'Duo',
      imgURI: <DuoLogo />,
      isDisabled: isLoading
    },
    {
      type: IdentityProviders.OKTA,
      title: 'Okta',
      imgURI: <OktaLogo />,
      isDisabled: isLoading
    },
    {
      type: IdentityProviders.OASF,
      title: 'Agntcy',
      imgURI: <OasfLogo />,
      isDisabled: isLoading,
      infoAction: (
        <Tooltip
          title="Agntcy is an open-source identity provider that allows you to manage your own identity and access management system."
          placement="bottom"
          arrow
        >
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
      )
    }
  ];

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
    <Card className="text-start py-4 bg-[#F5F8FD] rounded-[8px] p-[24px] space-y-4" variant="secondary">
      <div className="flex justify-between items-center">
        <Typography variant="subtitle1">Select identity provider</Typography>
        <Link href="https://github.com/agntcy/identity?tab=readme-ov-file#step-3-register-as-an-issuer" openInNewTab>
          <div className="flex items-center gap-1">
            View documentation
            <ExternalLinkIcon className="w-4 h-4 ml-1" />
          </div>
        </Link>
      </div>
      <CardContent className="space-y-4 p-0">
        <div className="space-y-2">
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
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-2 pt-2">
          <Typography variant="subtitle1">Provider details</Typography>
          <div className="space-y-2 mt-4">
            <FormField
              control={control}
              name="issuer"
              render={({field}) => (
                <FormItem className="w-[50%]">
                  <FormLabel className="form-label">Issuer</FormLabel>
                  <FormControl>
                    <Input placeholder="Type issuer name..." {...field} disabled={isLoading} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex gap-4 items-start pt-2">
              <FormField
                control={control}
                name="clientId"
                render={({field}) => (
                  <FormItem className="w-[50%]">
                    <FormLabel className="form-label">Client ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Type client ID..." {...field} disabled={isLoading} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="clientSecret"
                render={({field}) => (
                  <FormItem className="w-[50%]">
                    <FormLabel className="form-label">Client Secret</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="Type client Secret..." {...field} disabled={isLoading} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
