/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {ExternalLinkIcon} from 'lucide-react';
import {useStepper} from '../stepper';
import StatsCard from '@/components/ui/stats-card';
import {labels} from '@/constants/labels';
import {Link, Typography} from '@outshift/spark-design';

export const RegisterProvider = ({isLoading = false}: {isLoading?: boolean}) => {
  const methods = useStepper();
  const metaData = methods.getMetadata('providerInfo');

  const provider = metaData?.provider;
  const issuer = metaData?.issuer;
  const clientId = metaData?.clientId;
  const clientSecret = metaData?.clientSecret as string | undefined;

  return (
    <Card className="text-start py-4 bg-[#F5F8FD] rounded-[8px] p-[24px] space-y-4" variant="secondary">
      <div className="flex justify-between items-center">
        <Typography variant="subtitle1">Identity Provider Information</Typography>
        <Link href="https://github.com/agntcy/identity?tab=readme-ov-file#step-3-register-as-an-issuer" openInNewTab>
          <div className="flex items-center gap-1">
            View documentation
            <ExternalLinkIcon className="w-4 h-4 ml-1" />
          </div>
        </Link>
      </div>
      <CardContent className="p-0 space-y-4">
        <StatsCard
          stats={[
            {
              title: 'Provider Type',
              value: labels.providerTypes[provider as keyof typeof labels.providerTypes] || 'Not provided'
            },
            {
              title: 'Client Issuer',
              value: issuer || 'Not provided'
            },
            {
              title: 'Client ID',
              value: clientId || 'Not provided'
            },
            {
              title: 'Client Secret',
              value: clientSecret ? `${'*'.repeat(15)}${clientSecret.slice(-3)}` : 'Not provided'
            }
          ]}
        />
      </CardContent>
    </Card>
  );
};
