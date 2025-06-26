/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {ExternalLinkIcon} from 'lucide-react';
import {useStepper} from '../stepper';
import {labels} from '@/constants/labels';
import {Link, Typography} from '@outshift/spark-design';
import {IdentityProvidersFormValues} from '@/schemas/identity-provider-schema';
import {useMemo} from 'react';
import {IdpType} from '@/types/api/settings';
import {LoaderRelative} from '@/components/ui/loading';
import KeyValue, {KeyValuePair} from '@/components/ui/key-value';

export const RegisterProvider = ({isLoading = false}: {isLoading?: boolean}) => {
  const methods = useStepper();
  const metaData = methods.getMetadata('providerInfo') as IdentityProvidersFormValues | undefined;

  const provider = metaData?.provider;
  const orgUrl = metaData?.orgUrl;
  const clientId = metaData?.clientId;
  const privateKey = metaData?.privateKey;
  const hostname = metaData?.hostname;
  const integrationKey = metaData?.integrationKey;
  const secretKey = metaData?.secretKey;

  const keyValuePairs = useMemo(() => {
    const temp: KeyValuePair[] = [];
    temp.push({
      keyProp: 'Provider Type',
      value: labels.providerTypes[provider as keyof typeof labels.providerTypes] || 'Not provided'
    });
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
        value: secretKey ? `${'*'.repeat(15)}${secretKey.slice(-3)}` : 'Not provided'
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
        value: privateKey ? `${'*'.repeat(15)}${privateKey.slice(-3)}` : 'Not provided'
      });
    }
    return temp;
  }, [clientId, hostname, integrationKey, orgUrl, privateKey, provider, secretKey]);

  if (isLoading) {
    return (
      <Card className="text-start" variant="secondary">
        <LoaderRelative />
      </Card>
    );
  }

  return (
    <Card className="text-start space-y-6" variant="secondary">
      <div className="flex justify-between items-center">
        <Typography variant="body1Semibold">About</Typography>
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
