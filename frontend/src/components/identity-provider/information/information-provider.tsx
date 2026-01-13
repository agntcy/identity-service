/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {ExternalLinkIcon} from 'lucide-react';
import {Link, Typography} from '@open-ui-kit/core';
import {useMemo} from 'react';
import {IdpType, IssuerSettings} from '@/types/api/settings';
import KeyValue, {KeyValuePair} from '@/components/ui/key-value';
import {ProviderType} from '@/components/shared/identity-provider/provider-type';
import {docs} from '@/utils/docs';

export const InformationProvider = ({idpSettings}: {idpSettings?: IssuerSettings}) => {
  const provider = idpSettings?.idpType;
  const hostname = idpSettings?.duoIdpSettings?.hostname;
  const integrationKey = idpSettings?.duoIdpSettings?.integrationKey;
  const secretKey = idpSettings?.duoIdpSettings?.secretKey;
  const orgUrl = idpSettings?.oktaIdpSettings?.orgUrl;
  const clientId = idpSettings?.oktaIdpSettings?.clientId;
  const privateKey = idpSettings?.oktaIdpSettings?.privateKey;
  const apiKey = idpSettings?.oryIdpSettings?.apiKey;
  const projectSlug = idpSettings?.oryIdpSettings?.projectSlug;
  const environmentId = idpSettings?.pingIdpSettings?.environmentId;
  const pingClientId = idpSettings?.pingIdpSettings?.clientId;
  const pingClientSecret = idpSettings?.pingIdpSettings?.clientSecret;
  const pingRegion = idpSettings?.pingIdpSettings?.region;

  const keyValuePairs = useMemo(() => {
    const temp: KeyValuePair[] = [];
    if (provider === IdpType.IDP_TYPE_DUO) {
      temp.push({
        keyProp: 'Hostname',
        value: hostname || 'Not provided'
      });
      temp.push({
        keyProp: 'Integration Key',
        value: integrationKey || 'Not provided'
      });
      temp.push({
        keyProp: 'Secret Key',
        value: secretKey ? `${'*'.repeat(15)}${secretKey.slice(-5)}` : 'Not provided'
      });
    }
    if (provider === IdpType.IDP_TYPE_OKTA) {
      temp.push({
        keyProp: 'Org URL',
        value: orgUrl || 'Not provided'
      });
      temp.push({
        keyProp: 'Client ID',
        value: clientId || 'Not provided'
      });
      temp.push({
        keyProp: 'Private Key',
        value: privateKey ? `${'*'.repeat(15)}${privateKey.slice(-5)}` : 'Not provided'
      });
    }
    if (provider === IdpType.IDP_TYPE_ORY) {
      temp.push({
        keyProp: 'Project Slug',
        value: projectSlug || 'Not provided'
      });
      temp.push({
        keyProp: 'API Key',
        value: apiKey ? `${'*'.repeat(15)}${apiKey.slice(-5)}` : 'Not provided'
      });
    }
    if (provider === IdpType.IDP_TYPE_KEYCLOAK) {
      temp.push({
        keyProp: 'Base URL',
        value: idpSettings?.keycloakIdpSettings?.baseUrl || 'Not provided'
      });
      temp.push({
        keyProp: 'Realm',
        value: idpSettings?.keycloakIdpSettings?.realm || 'Not provided'
      });
      temp.push({
        keyProp: 'Client ID',
        value: idpSettings?.keycloakIdpSettings?.clientId || 'Not provided'
      });
      temp.push({
        keyProp: 'Client Secret',
        value: idpSettings?.keycloakIdpSettings?.clientSecret
          ? `${'*'.repeat(15)}${idpSettings?.keycloakIdpSettings?.clientSecret.slice(-5)}`
          : 'Not provided'
      });
    }
    if (provider === IdpType.IDP_TYPE_PING) {
      temp.push({
        keyProp: 'Environment ID',
        value: environmentId || 'Not provided'
      });
      temp.push({
        keyProp: 'Region',
        value: pingRegion || 'Not provided'
      });
      temp.push({
        keyProp: 'Client ID',
        value: pingClientId || 'Not provided'
      });
      temp.push({
        keyProp: 'Client Secret',
        value: pingClientSecret ? `${'*'.repeat(15)}${pingClientSecret.slice(-5)}` : 'Not provided'
      });
    }
    temp.push({
      keyProp: 'Type',
      value: <ProviderType type={provider} />
    });
    return temp;
  }, [
    apiKey,
    clientId,
    hostname,
    idpSettings?.keycloakIdpSettings?.baseUrl,
    idpSettings?.keycloakIdpSettings?.clientId,
    idpSettings?.keycloakIdpSettings?.clientSecret,
    idpSettings?.keycloakIdpSettings?.realm,
    integrationKey,
    orgUrl,
    privateKey,
    projectSlug,
    provider,
    secretKey,
    environmentId,
    pingClientId,
    pingClientSecret,
    pingRegion
  ]);

  return (
    <Card className="text-start space-y-6" variant="secondary">
      <div className="flex justify-between items-center">
        <Typography variant="subtitle1" fontWeight={600}>
          About
        </Typography>
        <Link href={docs('idp')} openInNewTab>
          <div className="flex items-center gap-1">
            View documentation
            <ExternalLinkIcon className="w-4 h-4 ml-1" />
          </div>
        </Link>
      </div>
      <CardContent className="p-0 space-y-4">
        <KeyValue pairs={keyValuePairs} useCard={false} />
      </CardContent>
    </Card>
  );
};
