/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {ExternalLinkIcon} from 'lucide-react';
import StatsCard, {Stat} from '@/components/ui/stats-card';
import {labels} from '@/constants/labels';
import {Link, Typography} from '@outshift/spark-design';
import {useMemo} from 'react';
import {IdpType, IssuerSettings} from '@/types/api/settings';

export const InformationProvider = ({idpSettings}: {idpSettings?: IssuerSettings}) => {
  const provider = idpSettings?.idpType;
  const orgUrl = idpSettings?.oktaIdpSettings?.orgUrl;
  const clientId = idpSettings?.oktaIdpSettings?.clientId;
  const privateKey = idpSettings?.oktaIdpSettings?.privateKey;
  const hostname = idpSettings?.duoIdpSettings?.hostname;
  const integrationKey = idpSettings?.duoIdpSettings?.integrationKey;
  const secretKey = idpSettings?.duoIdpSettings?.secretKey;

  const stats: Stat[] = useMemo(() => {
    const temp: Stat[] = [];
    temp.push({
      title: 'Provider Type',
      value: labels.providerTypes[provider as keyof typeof labels.providerTypes] || 'Not provided'
    });
    if (provider === IdpType.IDP_TYPE_DUO) {
      temp.push({
        title: 'Hostname',
        value: hostname || 'Not provided'
      });
      temp.push({
        title: 'Integration Key',
        value: integrationKey || 'Not provided'
      });
      temp.push({
        title: 'Secret Key',
        value: secretKey ? `${'*'.repeat(15)}${secretKey.slice(-3)}` : 'Not provided'
      });
    }
    if (provider === IdpType.IDP_TYPE_OKTA) {
      temp.push({
        title: 'Org URL',
        value: orgUrl || 'Not provided'
      });
      temp.push({
        title: 'Client ID',
        value: clientId || 'Not provided'
      });
      temp.push({
        title: 'Private Key',
        value: privateKey ? `${'*'.repeat(15)}${privateKey.slice(-3)}` : 'Not provided'
      });
    }
    return temp;
  }, [clientId, hostname, integrationKey, orgUrl, privateKey, provider, secretKey]);

  return (
    <Card className="text-start py-4 bg-[#F5F8FD] rounded-[8px] p-[24px] space-y-4" variant="secondary">
      <div className="flex justify-between items-center">
        <Typography variant="subtitle1" fontWeight={600}>
          Identity Provider Information
        </Typography>
        <Link href="https://github.com/agntcy/identity?tab=readme-ov-file#step-3-register-as-an-issuer" openInNewTab>
          <div className="flex items-center gap-1">
            View documentation
            <ExternalLinkIcon className="w-4 h-4 ml-1" />
          </div>
        </Link>
      </div>
      <CardContent className="p-0 space-y-4">
        <StatsCard stats={stats} />
      </CardContent>
    </Card>
  );
};
