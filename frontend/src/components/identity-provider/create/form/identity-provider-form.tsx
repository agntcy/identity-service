/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {useFormContext} from 'react-hook-form';
import {FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {IdentityProvidersFormValues} from '@/schemas/identity-provider-schema';
import {SharedProvider, SharedProviderProps} from '@/components/ui/shared-provider';
import {Input} from '@/components/ui/input';
import {PasswordInput} from '@/components/ui/password-input';
import {Link, Typography} from '@open-ui-kit/core';
import {ExternalLinkIcon, InfoIcon} from 'lucide-react';
import DuoLogo from '@/assets/duo.svg?react';
import OktaLogo from '@/assets/okta.svg?react';
import OasfLogo from '@/assets/oasf.svg?react';
import OryLogo from '@/assets/ory.svg?react';
import PingLogo from '@/assets/ping.svg?react';
import KeycloakLogo from '@/assets/keycloak.png';
import EntraLogo from '@/assets/entra.svg?react';
import {IdpType} from '@/types/api/settings';
import {docs} from '@/utils/docs';
import {useAnalytics} from '@/hooks';
import {IconButton, Tooltip} from '@mui/material';
import {useSettingsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';

export const IdentityProviderForm = ({isLoading = false}: {isLoading?: boolean}) => {
  const {control, watch} = useFormContext<IdentityProvidersFormValues>();

  const {analyticsTrack} = useAnalytics();

  const {isEmptyIdp} = useSettingsStore(
    useShallow((state) => ({
      isEmptyIdp: state.isEmptyIdp
    }))
  );

  const identityProviders: SharedProviderProps<IdpType>[] = [
    {
      type: IdpType.IDP_TYPE_DUO,
      title: 'Duo',
      imgURI: <DuoLogo />,
      isDisabled: isLoading || !isEmptyIdp,
      useTooltip: isEmptyIdp
    },
    {
      type: IdpType.IDP_TYPE_OKTA,
      title: 'Okta',
      imgURI: <OktaLogo />,
      isDisabled: isLoading || !isEmptyIdp,
      useTooltip: isEmptyIdp
    },
    {
      type: IdpType.IDP_TYPE_ORY,
      title: 'Ory',
      imgURI: <OryLogo />,
      isDisabled: isLoading || !isEmptyIdp,
      useTooltip: isEmptyIdp
    },
    {
      type: IdpType.IDP_TYPE_ENTRA_ID,
      title: 'Microsoft Entra ID',
      imgURI: <EntraLogo />,
      isDisabled: isLoading || !isEmptyIdp,
      useTooltip: isEmptyIdp
    },
    {
      type: IdpType.IDP_TYPE_KEYCLOAK,
      title: 'Keycloak',
      imgURI: <img src={KeycloakLogo} alt="Keycloak Logo" className="w-6 h-6" />,
      isDisabled: isLoading || !isEmptyIdp,
      useTooltip: isEmptyIdp
    },
    {
      type: IdpType.IDP_TYPE_PING,
      title: 'Ping',
      imgURI: <PingLogo />,
      isDisabled: isLoading || !isEmptyIdp,
      useTooltip: isEmptyIdp
    },
    {
      type: IdpType.IDP_TYPE_SELF,
      title: 'AGNTCY',
      imgURI: <OasfLogo />,
      isDisabled: isLoading || !isEmptyIdp,
      useTooltip: isEmptyIdp,

      infoAction: (
        <Tooltip
          title="AGNTCY is an open-source identity provider that allows you to manage your own identity and access management system."
          arrow
          placement="right"
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

  const idpType = watch('provider') as IdpType;

  return (
    <Card className="text-start py-4 rounded-[8px] p-[24px]" variant="secondary">
      <CardContent className="space-y-8 p-0">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Typography variant="subtitle1" fontWeight={600}>
              Select Identity Provider
            </Typography>
            <Link href={docs('idp')} openInNewTab>
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
                      <SharedProvider
                        key={index}
                        {...provider}
                        isSelected={field.value === provider.type}
                        onSelect={(type) => {
                          field.onChange(type);
                          analyticsTrack('ADD_IDENTITY_PROVIDER_TYPE_SELECTED', {type});
                        }}
                      />
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
                      <Input placeholder="Type hostname..." {...field} disabled={isLoading || !isEmptyIdp} />
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
                        <Input placeholder="Type integration key..." {...field} disabled={isLoading || !isEmptyIdp} />
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
                      <Input placeholder="Type org URL..." {...field} disabled={isLoading || !isEmptyIdp} />
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
                        <Input placeholder="Type client id..." {...field} disabled={isLoading || !isEmptyIdp} />
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
        {idpType === IdpType.IDP_TYPE_ORY && (
          <div className="space-y-4">
            <div>
              <Typography variant="subtitle1" fontWeight={600}>
                Provider details
              </Typography>
            </div>
            <div className="space-y-3">
              <FormField
                control={control}
                name="projectSlug"
                render={({field}) => (
                  <FormItem className="w-[50%]">
                    <FormLabel className="form-label">Project Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="Type the project slug..." {...field} disabled={isLoading || !isEmptyIdp} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="apiKey"
                render={({field}) => (
                  <FormItem className="w-[50%]">
                    <FormLabel className="form-label">API Key</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="Type the API key..." {...field} disabled={isLoading} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
        {idpType === IdpType.IDP_TYPE_ENTRA_ID && (
          <div className="space-y-4">
            <div>
              <Typography variant="subtitle1" fontWeight={600}>
                Provider details
              </Typography>
            </div>
            <div className="space-y-2">
              <FormField
                control={control}
                name="tenantIdEntra"
                render={({field}) => (
                  <FormItem className="w-[50%] pr-2">
                    <FormLabel className="form-label">Tenant ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Type tenant ID..." {...field} disabled={isLoading || !isEmptyIdp} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex gap-4 items-start pt-2">
                <FormField
                  control={control}
                  name="clientIdEntra"
                  render={({field}) => (
                    <FormItem className="w-[50%]">
                      <FormLabel className="form-label">Client ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Type client ID..." {...field} disabled={isLoading || !isEmptyIdp} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="clientSecretEntra"
                  render={({field}) => (
                    <FormItem className="w-[50%]">
                      <FormLabel className="form-label">Client Secret</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder="Type client secret..." {...field} disabled={isLoading} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        )}
        {idpType === IdpType.IDP_TYPE_KEYCLOAK && (
          <div className="space-y-4">
            <div>
              <Typography variant="subtitle1" fontWeight={600}>
                Provider details
              </Typography>
            </div>
            <div className="space-y-2">
              <div className="flex gap-4 items-start">
                <FormField
                  control={control}
                  name="baseUrl"
                  render={({field}) => (
                    <FormItem className="w-[50%]">
                      <FormLabel className="form-label">Base URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Type base URL..." {...field} disabled={isLoading || !isEmptyIdp} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="realm"
                  render={({field}) => (
                    <FormItem className="w-[50%]">
                      <FormLabel className="form-label">Realm</FormLabel>
                      <FormControl>
                        <Input placeholder="Type realm..." {...field} disabled={isLoading || !isEmptyIdp} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-4 items-start pt-2">
                <FormField
                  control={control}
                  name="client"
                  render={({field}) => (
                    <FormItem className="w-[50%]">
                      <FormLabel className="form-label">Client ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Type client id..." {...field} disabled={isLoading || !isEmptyIdp} />
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
                        <PasswordInput placeholder="Type client secret..." {...field} disabled={isLoading} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        )}
        {idpType === IdpType.IDP_TYPE_PING && (
          <div className="space-y-4">
            <div>
              <Typography variant="subtitle1" fontWeight={600}>
                Provider details
              </Typography>
            </div>
            <div className="space-y-2">
              <div className="flex gap-4 items-start">
                <FormField
                  control={control}
                  name="environmentId"
                  render={({field}) => (
                    <FormItem className="w-[50%]">
                      <FormLabel className="form-label">Environment ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Type environment ID..." {...field} disabled={isLoading || !isEmptyIdp} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="region"
                  render={({field}) => (
                    <FormItem className="w-[50%]">
                      <FormLabel className="form-label">Region</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Type region (e.g., com, eu, asia)..."
                          {...field}
                          disabled={isLoading || !isEmptyIdp}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-4 items-start pt-2">
                <FormField
                  control={control}
                  name="clientId"
                  render={({field}) => (
                    <FormItem className="w-[50%]">
                      <FormLabel className="form-label">Client ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Type client ID..." {...field} disabled={isLoading || !isEmptyIdp} />
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
                        <PasswordInput placeholder="Type client secret..." {...field} disabled={isLoading} />
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
