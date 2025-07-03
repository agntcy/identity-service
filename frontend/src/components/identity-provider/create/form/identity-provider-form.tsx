/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {useFormContext} from 'react-hook-form';
import {FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {IdentityProvidersFormValues} from '@/schemas/identity-provider-schema';
import {SharedProvider, SharedProviderProps} from '@/components/shared/shared-provider';
import {Input} from '@/components/ui/input';
import {PasswordInput} from '@/components/ui/password-input';
import {IconButton} from '@mui/material';
import {Link, Tooltip, Typography} from '@outshift/spark-design';
import {ExternalLinkIcon, InfoIcon} from 'lucide-react';
import DuoLogo from '@/assets/duo.svg?react';
import OktaLogo from '@/assets/okta.svg?react';
import OasfLogo from '@/assets/oasf.svg?react';
import {IdpType} from '@/types/api/settings';

export const IdentityProviderForm = ({isLoading = false}: {isLoading?: boolean}) => {
  const {control, watch} = useFormContext<IdentityProvidersFormValues>();

  const identityProviders: SharedProviderProps<IdpType>[] = [
    {
      type: IdpType.IDP_TYPE_DUO,
      title: 'Duo',
      imgURI: <DuoLogo />,
      isDisabled: isLoading
    },
    {
      type: IdpType.IDP_TYPE_OKTA,
      title: 'Okta',
      imgURI: <OktaLogo />,
      isDisabled: isLoading
    },
    {
      type: IdpType.IDP_TYPE_SELF,
      title: 'Agntcy',
      imgURI: <OasfLogo />,
      isDisabled: isLoading,
      infoAction: (
        <Tooltip title="Agntcy is an open-source identity provider that allows you to manage your own identity and access management system." arrow>
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

  const idpType = watch('provider') as IdpType;

  return (
    <Card className="text-start py-4 rounded-[8px] p-[24px]" variant="secondary">
      <CardContent className="space-y-8 p-0">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Typography variant="subtitle1" fontWeight={600}>
              Select Identity Provider
            </Typography>
            <Link href="" openInNewTab>
              <div className="flex items-center gap-1">
                View Documentation
                <ExternalLinkIcon className="w-4 h-4 ml-1" />
              </div>
            </Link>
          </div>
          <FormField
            control={control}
            name="provider"
            render={({field}) => (
              <FormItem className="space-y-2">
                <FormControl>
                  <div className="card-group">
                    {identityProviders.map((provider, index) => (
                      <SharedProvider key={index} {...provider} isSelected={field.value === provider.type} onSelect={field.onChange} />
                    ))}
                  </div>
                </FormControl>
                <Typography variant="body2">
                  <b>Note:</b> This selection can only be made one time.
                </Typography>
              </FormItem>
            )}
          />
        </div>
        {idpType === IdpType.IDP_TYPE_DUO && (
          <div className="space-y-4">
            <div>
              <Typography variant="subtitle1" fontWeight={600}>
                Provider details
              </Typography>
            </div>
            <div className="space-y-2">
              <FormField
                control={control}
                name="hostname"
                render={({field}) => (
                  <FormItem className="w-[50%] pr-2">
                    <FormLabel className="form-label">Hostname</FormLabel>
                    <FormControl>
                      <Input placeholder="Type hostname..." {...field} disabled={isLoading} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex gap-4 items-start pt-2">
                <FormField
                  control={control}
                  name="integrationKey"
                  render={({field}) => (
                    <FormItem className="w-[50%]">
                      <FormLabel className="form-label">Integration Key</FormLabel>
                      <FormControl>
                        <Input placeholder="Type integration key..." {...field} disabled={isLoading} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="secretKey"
                  render={({field}) => (
                    <FormItem className="w-[50%]">
                      <FormLabel className="form-label">Secret Key</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder="Type secret key..." {...field} disabled={isLoading} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        )}
        {idpType === IdpType.IDP_TYPE_OKTA && (
          <div className="space-y-4">
            <div>
              <Typography variant="subtitle1" fontWeight={600}>
                Provider details
              </Typography>
            </div>
            <div className="space-y-2">
              <FormField
                control={control}
                name="orgUrl"
                render={({field}) => (
                  <FormItem className="w-[50%] pr-2">
                    <FormLabel className="form-label">Org URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Type org URL..." {...field} disabled={isLoading} />
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
                        <Input placeholder="Type client id..." {...field} disabled={isLoading} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="privateKey"
                  render={({field}) => (
                    <FormItem className="w-[50%]">
                      <FormLabel className="form-label">Private Key</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder="Type private key..." {...field} disabled={isLoading} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
