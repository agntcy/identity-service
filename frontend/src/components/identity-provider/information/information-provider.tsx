/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {ExternalLinkIcon} from 'lucide-react';
import {Link, Typography} from '@outshift/spark-design';
import {useMemo} from 'react';
import {IdpType, IssuerSettings} from '@/types/api/settings';
import KeyValue, {KeyValuePair} from '@/components/ui/key-value';
import {ProviderType} from '@/components/shared/provider-type';

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
    temp.push({
      keyProp: 'Type',
      value: <ProviderType type={provider} />
    });
    return temp;
  }, [apiKey, clientId, hostname, integrationKey, orgUrl, privateKey, projectSlug, provider, secretKey]);

  return (
    <Card className="text-start space-y-6" variant="secondary">
      <div className="flex justify-between items-center">
        <Typography variant="subtitle1" fontWeight={600}>
          About
        </Typography>
        <Link href="" openInNewTab>
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
